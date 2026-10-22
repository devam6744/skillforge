import uuid
from django.db import models
from django.conf import settings
from apps.practice.models import PracticeSession
from apps.challenges.models import Challenge
from apps.catalog.models import ProgrammingLanguage


class Submission(models.Model):
    class Status(models.TextChoices):
        RECEIVED = 'RECEIVED', 'Received'
        EVALUATING = 'EVALUATING', 'Evaluating'
        EVALUATED = 'EVALUATED', 'Evaluated'
        EVALUATION_FAILED = 'EVALUATION_FAILED', 'Evaluation Failed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submissions'
    )
    session = models.ForeignKey(
        PracticeSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='submissions'
    )
    challenge = models.ForeignKey(
        Challenge,
        on_delete=models.CASCADE,
        related_name='submissions'
    )
    language = models.ForeignKey(
        ProgrammingLanguage,
        on_delete=models.CASCADE,
        related_name='submissions'
    )
    source_code = models.TextField()
    status = models.CharField(
        max_length=25,
        choices=Status.choices,
        default=Status.RECEIVED
    )
    idempotency_key = models.CharField(max_length=128, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.challenge.title} ({self.status})"
