import logging
from typing import Optional, Tuple
from django.db import transaction
from django.utils import timezone
from apps.practice.models import PracticeSession, SessionChallenge
from apps.challenges.models import Challenge
from apps.catalog.models import Topic
from apps.submissions.models import Submission
from apps.challenges.services.gemini import GeminiChallengeService, AIConnectionError
from apps.challenges.services.rate_limiter import AIRateLimiter, session_ai_lock

logger = logging.getLogger(__name__)


class ChallengeDeliveryService:
    """
    Orchestrates challenge retrieval and batch generation via Gemini AI.
    - Generates 5-question batches on-demand using Gemini AI.
    - Manages progression: user solves/skips questions one by one from the generated set.
    - When set is completed and more questions requested (e.g. 10 or 20), generates the next batch.
    - Zero static seed/dummy pool dependency.
    """

    @classmethod
    def get_or_create_next_challenge(cls, session: PracticeSession) -> Tuple[Optional[SessionChallenge], bool, str]:
        """
        Returns (session_challenge, is_session_finished, message).
        Guarantees:
        1. If an active challenge is already open in this session, resume it.
        2. If next question is already pending in this session's batch, activate and return it.
        3. If no pending question and session quota remains, call Gemini to generate the next batch.
        4. If session quota fulfilled, complete session.
        """
        # Step 1: Return open active challenge if exists
        active_sc = session.session_challenges.filter(
            status=SessionChallenge.Status.ACTIVE
        ).select_related('challenge', 'challenge__primary_topic', 'challenge__language').first()

        if active_sc:
            return active_sc, False, "Active challenge resumed from session."

        # Step 2: Check if there is already a PENDING challenge in the session's batch
        pending_sc = session.session_challenges.filter(
            status=SessionChallenge.Status.PENDING
        ).select_related('challenge', 'challenge__primary_topic', 'challenge__language').order_by('question_order').first()

        if pending_sc:
            with transaction.atomic():
                pending_sc.status = SessionChallenge.Status.ACTIVE
                pending_sc.started_at = timezone.now()
                pending_sc.save(update_fields=['status', 'started_at'])
            return pending_sc, False, f"Question {pending_sc.question_order} ready from active practice set."

        # Step 3: Check if session quota is already fulfilled
        completed_or_skipped_count = session.session_challenges.filter(
            status__in=[SessionChallenge.Status.SOLVED, SessionChallenge.Status.SKIPPED]
        ).count()

        if completed_or_skipped_count >= session.requested_question_count:
            if session.status != PracticeSession.Status.COMPLETED:
                session.status = PracticeSession.Status.COMPLETED
                session.completed_at = timezone.now()
                session.save(update_fields=['status', 'completed_at', 'updated_at'])
            return None, True, "All challenges in this practice session have been completed."

        # Step 4: Generate next batch of 5 questions via Gemini AI
        batch_size = min(5, session.requested_question_count - completed_or_skipped_count)
        start_order = completed_or_skipped_count + 1

        with session_ai_lock(str(session.id)) as acquired:
            if not acquired:
                # Concurrent request; check if another thread just created challenges
                existing = session.session_challenges.filter(status=SessionChallenge.Status.ACTIVE).first()
                if existing:
                    return existing, False, "Challenge resumed."

            # Rate limit check to prevent rapid spam clicks
            is_allowed, wait_sec = AIRateLimiter.check_and_consume(str(session.user_id), max_requests=10, window_seconds=60)
            if not is_allowed:
                raise AIConnectionError(f"Rate limit exceeded. Please wait {wait_sec} seconds before requesting more challenges.")

            target_topic = cls._resolve_target_topic(session, start_order)
            difficulty = session.difficulty_mode if session.difficulty_mode != 'ADAPTIVE' else 'EASY'
            practice_mode = session.practice_mode

            # Generate batch from Gemini AI, with automatic resilient fallback to verified DB pool on rate limits
            raw_challenges = []
            try:
                raw_challenges = GeminiChallengeService.generate_challenge_batch(
                    language_name=session.language.name,
                    language_slug=session.language.slug,
                    topic_name=target_topic.name,
                    topic_slug=target_topic.slug,
                    difficulty=difficulty,
                    practice_mode=practice_mode,
                    count=batch_size
                )
            except AIConnectionError as ai_err:
                logger.warning(
                    f"Live Gemini generation encountered rate-limit or error ({ai_err}). Engaging zero-downtime DB pool fallback..."
                )
                user_solved_ids = Submission.objects.filter(
                    user=session.user
                ).values_list('challenge_id', flat=True)

                fallback_challenges = list(
                    Challenge.objects.filter(
                        language=session.language,
                        primary_topic=target_topic,
                        quality_status=Challenge.QualityStatus.VALID
                    ).exclude(id__in=user_solved_ids)[:batch_size]
                )

                if len(fallback_challenges) < batch_size:
                    additional = list(
                        Challenge.objects.filter(
                            language=session.language,
                            quality_status=Challenge.QualityStatus.VALID
                        ).exclude(
                            id__in=set(user_solved_ids) | {c.id for c in fallback_challenges}
                        )[:batch_size - len(fallback_challenges)]
                    )
                    fallback_challenges.extend(additional)

                if fallback_challenges:
                    created_challenges = []
                    with transaction.atomic():
                        for idx, ch_obj in enumerate(fallback_challenges):
                            order = start_order + idx
                            initial_status = SessionChallenge.Status.ACTIVE if idx == 0 else SessionChallenge.Status.PENDING
                            sc = SessionChallenge.objects.create(
                                session=session,
                                challenge=ch_obj,
                                question_order=order,
                                status=initial_status,
                                started_at=timezone.now() if idx == 0 else None
                            )
                            created_challenges.append(sc)

                        if session.status == PracticeSession.Status.CREATED:
                            session.status = PracticeSession.Status.IN_PROGRESS
                            session.started_at = timezone.now()
                            session.save(update_fields=['status', 'started_at', 'updated_at'])

                    return created_challenges[0], False, f"Delivered verified challenge (1 of {len(created_challenges)} ready from resilient pool)."

                # If no DB challenges exist at all, reraise
                raise ai_err

            created_challenges = []
            with transaction.atomic():
                for idx, c_data in enumerate(raw_challenges):
                    order = start_order + idx
                    challenge_obj = Challenge.objects.create(
                        language=session.language,
                        primary_topic=target_topic,
                        title=c_data.get('title', f"{session.language.name} Exercise {order}"),
                        statement=c_data.get('statement', ''),
                        constraints_text=c_data.get('constraints_text', ''),
                        examples=c_data.get('examples', []),
                        difficulty=difficulty,
                        practice_mode=practice_mode,
                        target_concepts=c_data.get('target_concepts', []),
                        starter_code=c_data.get('starter_code', ''),
                        hints_json=c_data.get('hints', []),
                        origin='AI_GENERATED',
                        quality_status=Challenge.QualityStatus.VALID,
                        content_hash=c_data.get('content_hash', ''),
                        ai_provider=c_data.get('ai_provider', 'google-gemini'),
                        ai_model=c_data.get('ai_model', 'gemini-3-flash-preview'),
                    )

                    # First challenge in batch is immediately ACTIVE, rest are PENDING
                    initial_status = SessionChallenge.Status.ACTIVE if idx == 0 else SessionChallenge.Status.PENDING
                    sc = SessionChallenge.objects.create(
                        session=session,
                        challenge=challenge_obj,
                        question_order=order,
                        status=initial_status,
                        started_at=timezone.now() if idx == 0 else None
                    )
                    created_challenges.append(sc)

                if session.status == PracticeSession.Status.CREATED:
                    session.status = PracticeSession.Status.IN_PROGRESS
                    session.started_at = timezone.now()
                    session.save(update_fields=['status', 'started_at', 'updated_at'])

            return created_challenges[0], False, f"Delivered fresh AI challenge (1 of {len(created_challenges)} generated in this set)."

    @classmethod
    def _resolve_target_topic(cls, session: PracticeSession, question_order: int) -> Topic:
        if session.practice_type == PracticeSession.PracticeType.TOPIC and session.selected_topic:
            return session.selected_topic

        topics = list(session.language.topics.all().order_by('sort_order'))
        if not topics:
            raise ValueError(f"Language {session.language.name} has no topics in catalog.")

        topic_index = (question_order - 1) % len(topics)
        return topics[topic_index]
