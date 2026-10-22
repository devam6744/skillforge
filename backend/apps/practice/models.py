import uuid
from django.db import models
from django.conf import settings
from apps.catalog.models import ProgrammingLanguage, Topic


class PracticeSession(models.Model):
    class PracticeType(models.TextChoices):
        TOPIC = 'TOPIC', 'Topic Practice'
        MIXED = 'MIXED', 'Mixed Practice'

    class DifficultyMode(models.TextChoices):
        EASY = 'EASY', 'Easy'
        MEDIUM = 'MEDIUM', 'Medium'
        HARD = 'HARD', 'Hard'
        ADAPTIVE = 'ADAPTIVE', 'Adaptive'

    class PracticeMode(models.TextChoices):
        CODING = 'CODING', 'Coding Practice'
        DEBUG = 'DEBUG', 'Debug Mode'

    class Status(models.TextChoices):
        CREATED = 'CREATED', 'Created'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        ABANDONED = 'ABANDONED', 'Abandoned'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='practice_sessions'
    )
    language = models.ForeignKey(
        ProgrammingLanguage,
        on_delete=models.CASCADE,
        related_name='practice_sessions'
    )
    practice_type = models.CharField(
        max_length=20,
        choices=PracticeType.choices,
        default=PracticeType.TOPIC
    )
    selected_topic = models.ForeignKey(
        Topic,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='practice_sessions'
    )
    difficulty_mode = models.CharField(
        max_length=20,
        choices=DifficultyMode.choices,
        default=DifficultyMode.ADAPTIVE
    )
    practice_mode = models.CharField(
        max_length=20,
        choices=PracticeMode.choices,
        default=PracticeMode.CODING
    )
    requested_question_count = models.IntegerField(default=5)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.CREATED
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.language.name} ({self.status})"
