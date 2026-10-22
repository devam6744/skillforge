import uuid
from django.db import models
from django.conf import settings
from apps.practice.models import PracticeSession
from apps.challenges.models import Challenge
from apps.submissions.models import Submission


class HintRequest(models.Model):
    class HintLevel(models.TextChoices):
        CONCEPT = 'CONCEPT', 'Conceptual Hint'
        APPROACH = 'APPROACH', 'Approach Guidance'
        DIRECTIONAL = 'DIRECTIONAL', 'Directional Hint'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='hint_requests'
    )
    session = models.ForeignKey(
        PracticeSession,
        on_delete=models.CASCADE,
        related_name='hint_requests'
    )
    challenge = models.ForeignKey(
        Challenge,
        on_delete=models.CASCADE,
        related_name='hint_requests'
    )
    submission = models.ForeignKey(
        Submission,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='hint_requests'
    )
    hint_level = models.CharField(
        max_length=20,
        choices=HintLevel.choices,
        default=HintLevel.CONCEPT
    )
    hint_text = models.TextField()
    provider = models.CharField(max_length=50, default='google-gemini')
    model = models.CharField(max_length=100, blank=True)
    prompt_version = models.CharField(max_length=50, default='v1.0')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Hint ({self.hint_level}) for {self.user.email} on {self.challenge.title}"
