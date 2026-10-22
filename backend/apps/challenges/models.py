import uuid
from django.db import models
from apps.catalog.models import ProgrammingLanguage, Topic


class Challenge(models.Model):
    class Difficulty(models.TextChoices):
        EASY = 'EASY', 'Easy'
        MEDIUM = 'MEDIUM', 'Medium'
        HARD = 'HARD', 'Hard'

    class PracticeMode(models.TextChoices):
        CODING = 'CODING', 'Coding Practice'
        DEBUG = 'DEBUG', 'Debug Mode'

    class QualityStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending Review'
        VALID = 'VALID', 'Valid'
        FLAGGED = 'FLAGGED', 'Flagged'
        ARCHIVED = 'ARCHIVED', 'Archived'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    language = models.ForeignKey(
        ProgrammingLanguage,
        on_delete=models.CASCADE,
        related_name='challenges'
    )
    primary_topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name='challenges'
    )
    title = models.CharField(max_length=255)
    statement = models.TextField()
    constraints_text = models.TextField(blank=True)
    examples = models.JSONField(default=list, blank=True)
    difficulty = models.CharField(
        max_length=20,
        choices=Difficulty.choices,
        default=Difficulty.EASY
    )
    practice_mode = models.CharField(
        max_length=20,
        choices=PracticeMode.choices,
        default=PracticeMode.CODING
    )
    target_concepts = models.JSONField(default=list, blank=True)
    evaluation_rubric_version = models.CharField(max_length=50, default='v1.0')
    origin = models.CharField(max_length=50, default='AI_GENERATED')
    quality_status = models.CharField(
        max_length=20,
        choices=QualityStatus.choices,
        default=QualityStatus.VALID
    )
    content_hash = models.CharField(max_length=64, blank=True, db_index=True)
    ai_provider = models.CharField(max_length=50, blank=True, default='google-gemini')
    ai_model = models.CharField(max_length=100, blank=True)
    prompt_version = models.CharField(max_length=50, blank=True, default='v1.0')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.language.name} - {self.title} ({self.difficulty})"
