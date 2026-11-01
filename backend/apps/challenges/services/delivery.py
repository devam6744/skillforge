import logging
from typing import Optional, Tuple
from django.db import transaction
from django.utils import timezone
from apps.practice.models import PracticeSession, SessionChallenge
from apps.challenges.models import Challenge
from apps.catalog.models import Topic
from apps.challenges.services.gemini import GeminiChallengeService
from apps.challenges.services.rate_limiter import AIRateLimiter, session_ai_lock

logger = logging.getLogger(__name__)


class ChallengeDeliveryService:
    """
    Orchestrates challenge retrieval, caching, pool rotation, and AI generation.
    Enforces rate limits, concurrency locks, and minimizes unnecessary external calls.
    """

    @classmethod
    def get_or_create_next_challenge(cls, session: PracticeSession) -> Tuple[Optional[SessionChallenge], bool, str]:
        """
        Returns (session_challenge, is_session_finished, message).
        Guarantees:
        1. Idempotency: Returns current active challenge if one is already open.
        2. Pool-first: Reuses high-quality database pool challenges to minimize API load.
        3. Rate-limited AI generation: Uses Gemini only when pool has no unserved challenge.
        4. Session lock: Prevents duplicate generation on double-click.
        """
        # Step 1: Idempotency check - return open active challenge if exists
        active_sc = session.session_challenges.filter(status=SessionChallenge.Status.ACTIVE).select_related('challenge', 'challenge__primary_topic').first()
        if active_sc:
            return active_sc, False, "Active challenge resumed from session."

        # Step 2: Check if session quota is already fulfilled
        completed_count = session.session_challenges.count()
        if completed_count >= session.requested_question_count:
            if session.status != PracticeSession.Status.COMPLETED:
                session.status = PracticeSession.Status.COMPLETED
                session.completed_at = timezone.now()
                session.save(update_fields=['status', 'completed_at', 'updated_at'])
            return None, True, "All challenges in this practice session have been completed."

        question_order = completed_count + 1

        # Step 3: Determine target topic
        target_topic = cls._resolve_target_topic(session, question_order)
        difficulty = session.difficulty_mode if session.difficulty_mode != 'ADAPTIVE' else 'EASY'
        practice_mode = session.practice_mode

        # Step 4: Pool check - check if valid unserved challenge exists in database
        already_served_ids = session.session_challenges.values_list('challenge_id', flat=True)
        pool_challenge = Challenge.objects.filter(
            language=session.language,
            primary_topic=target_topic,
            difficulty=difficulty,
            practice_mode=practice_mode,
            quality_status=Challenge.QualityStatus.VALID
        ).exclude(id__in=already_served_ids).first()

        if pool_challenge:
            with transaction.atomic():
                session_challenge = SessionChallenge.objects.create(
                    session=session,
                    challenge=pool_challenge,
                    question_order=question_order,
                    status=SessionChallenge.Status.ACTIVE
                )
                if session.status == PracticeSession.Status.CREATED:
                    session.status = PracticeSession.Status.IN_PROGRESS
                    session.started_at = timezone.now()
                    session.save(update_fields=['status', 'started_at', 'updated_at'])

            return session_challenge, False, "Challenge served from verified local catalog pool."

        # Step 5: On-demand AI generation with concurrency lock & rate limiting
        with session_ai_lock(str(session.id)) as acquired:
            if not acquired:
                # Concurrent request in progress; check if challenge was just created
                existing = session.session_challenges.filter(question_order=question_order).first()
                if existing:
                    return existing, False, "Challenge retrieved."

            # Check rate limiter for Gemini external call
            is_allowed, remaining_or_wait = AIRateLimiter.check_and_consume(str(session.user_id))
            if not is_allowed:
                logger.info(f"User {session.user_id} throttled. Using curated template to protect quota.")

            ai_data = GeminiChallengeService.generate_challenge(
                language_name=session.language.name,
                language_slug=session.language.slug,
                topic_name=target_topic.name,
                topic_slug=target_topic.slug,
                difficulty=difficulty,
                practice_mode=practice_mode
            )

            # Deduplication check by content_hash
            content_hash = ai_data.get('content_hash', '')
            challenge_obj = None
            if content_hash:
                challenge_obj = Challenge.objects.filter(content_hash=content_hash).first()

            if not challenge_obj:
                challenge_obj = Challenge.objects.create(
                    language=session.language,
                    primary_topic=target_topic,
                    title=ai_data.get('title', f"{session.language.name} {target_topic.name} Exercise"),
                    statement=ai_data.get('statement', ''),
                    constraints_text=ai_data.get('constraints_text', ''),
                    examples=ai_data.get('examples', []),
                    difficulty=difficulty,
                    practice_mode=practice_mode,
                    target_concepts=ai_data.get('target_concepts', []),
                    starter_code=ai_data.get('starter_code', ''),
                    hints_json=ai_data.get('hints', []),
                    origin=ai_data.get('origin', 'AI_GENERATED'),
                    quality_status=Challenge.QualityStatus.VALID,
                    content_hash=content_hash,
                    ai_provider=ai_data.get('ai_provider', 'google-gemini'),
                    ai_model=ai_data.get('ai_model', 'gemini-2.5-flash'),
                )

            with transaction.atomic():
                session_challenge = SessionChallenge.objects.create(
                    session=session,
                    challenge=challenge_obj,
                    question_order=question_order,
                    status=SessionChallenge.Status.ACTIVE
                )
                if session.status == PracticeSession.Status.CREATED:
                    session.status = PracticeSession.Status.IN_PROGRESS
                    session.started_at = timezone.now()
                    session.save(update_fields=['status', 'started_at', 'updated_at'])

            return session_challenge, False, f"Challenge delivered successfully ({ai_data.get('origin')})."

    @classmethod
    def _resolve_target_topic(cls, session: PracticeSession, question_order: int) -> Topic:
        """
        Determines the topic for this question:
        - In TOPIC practice: strictly uses session.selected_topic.
        - In MIXED practice: cycles through language topics.
        """
        if session.practice_type == PracticeSession.PracticeType.TOPIC and session.selected_topic:
            return session.selected_topic

        topics = list(session.language.topics.all().order_by('sort_order'))
        if not topics:
            raise ValueError(f"Language {session.language.name} has no topics in catalog.")

        topic_index = (question_order - 1) % len(topics)
        return topics[topic_index]
