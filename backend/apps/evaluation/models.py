import uuid
from django.db import models
from apps.submissions.models import Submission


class Evaluation(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SUCCEEDED = 'SUCCEEDED', 'Succeeded'
        FAILED = 'FAILED', 'Failed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.OneToOneField(
        Submission,
        on_delete=models.CASCADE,
        related_name='evaluation'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    score = models.IntegerField(null=True, blank=True)
    summary = models.TextField(blank=True)
    syntax_issues = models.JSONField(default=list, blank=True)
    logic_issues = models.JSONField(default=list, blank=True)
    potential_bugs = models.JSONField(default=list, blank=True)
    approach_feedback = models.TextField(blank=True)
    code_quality_feedback = models.TextField(blank=True)
    concepts_demonstrated = models.JSONField(default=list, blank=True)
    weak_concepts = models.JSONField(default=list, blank=True)
    improvement_actions = models.JSONField(default=list, blank=True)
    confidence = models.FloatField(null=True, blank=True)
    provider = models.CharField(max_length=50, default='google-gemini')
    model = models.CharField(max_length=100, blank=True)
    prompt_version = models.CharField(max_length=50, default='v1.0')
    rubric_version = models.CharField(max_length=50, default='v1.0')
    latency_ms = models.IntegerField(null=True, blank=True)
    safe_error_code = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Evaluation for {self.submission_id} - Score: {self.score} ({self.status})"
