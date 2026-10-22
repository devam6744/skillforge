import uuid
from django.db import models
from apps.practice.models import PracticeSession
from apps.submissions.models import Submission
from apps.catalog.models import Topic


class AdaptiveDecision(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        PracticeSession,
        on_delete=models.CASCADE,
        related_name='adaptive_decisions'
    )
    prior_submission = models.ForeignKey(
        Submission,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='triggered_decisions'
    )
    chosen_topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name='adaptive_decisions'
    )
    chosen_difficulty = models.CharField(max_length=20)
    chosen_mode = models.CharField(max_length=20)
    reason_codes = models.JSONField(default=list, blank=True)
    excluded_recent_challenge_ids = models.JSONField(default=list, blank=True)
    policy_version = models.CharField(max_length=50, default='v1.0')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Decision for session {self.session_id}: {self.chosen_topic.name} ({self.chosen_difficulty})"
