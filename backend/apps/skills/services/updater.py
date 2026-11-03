from django.utils import timezone
from apps.skills.models import SkillState, SkillEvidence


class SkillTrackingService:
    @staticmethod
    def record_evidence(submission, evaluation):
        """
        Records demonstrated evidence from an evaluation and recalculates
        the user's Bayesian skill state for the challenge topic.
        """
        topic = submission.challenge.primary_topic
        if not topic:
            return None

        # 1. Persist SkillEvidence
        evidence = SkillEvidence.objects.create(
            user=submission.user,
            language=submission.language,
            topic=topic,
            submission=submission,
            evaluation=evaluation,
            evidence_value=float(evaluation.score or 0),
            weight=1.0 if (evaluation.score or 0) >= 70 else 0.8,
            reason_code='AI_RUBRIC_EVALUATION',
            formula_version='v2.0'
        )

        # 2. Update or Create SkillState
        state, created = SkillState.objects.get_or_create(
            user=submission.user,
            language=submission.language,
            topic=topic,
            defaults={
                'estimated_skill': float(evaluation.score or 50),
                'confidence': 75.0,
                'evidence_count': 1,
                'recent_average': float(evaluation.score or 50),
                'last_practiced_at': timezone.now()
            }
        )

        if not created:
            new_count = state.evidence_count + 1
            # Moving average calculation
            old_avg = state.recent_average if state.recent_average is not None else state.estimated_skill
            new_avg = ((old_avg * state.evidence_count) + float(evaluation.score or 0)) / new_count
            
            # Calibrated skill score (weighted towards recent performance)
            calibrated_skill = round(0.4 * old_avg + 0.6 * float(evaluation.score or 0), 1)
            # Confidence scales logarithmically with evidence count up to 99%
            new_confidence = min(99.0, round(60.0 + (new_count * 8.0), 1))

            state.evidence_count = new_count
            state.recent_average = round(new_avg, 1)
            state.estimated_skill = calibrated_skill
            state.confidence = new_confidence
            state.last_practiced_at = timezone.now()
            state.save(update_fields=[
                'evidence_count', 'recent_average', 'estimated_skill',
                'confidence', 'last_practiced_at', 'updated_at'
            ])

        return state

