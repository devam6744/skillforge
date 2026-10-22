import uuid
from django.db import models
from django.conf import settings
from apps.catalog.models import ProgrammingLanguage, Topic
from apps.submissions.models import Submission
from apps.evaluation.models import Evaluation


class SkillState(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='skill_states'
    )
    language = models.ForeignKey(
        ProgrammingLanguage,
        on_delete=models.CASCADE,
        related_name='skill_states'
    )
    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name='skill_states'
    )
    estimated_skill = models.FloatField(default=0.0)
    confidence = models.FloatField(default=0.0)
    evidence_count = models.IntegerField(default=0)
    recent_average = models.FloatField(null=True, blank=True)
    last_practiced_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'language', 'topic'],
                name='unique_user_language_topic_skill'
            )
        ]

    def __str__(self):
        return f"{self.user.email} - {self.language.name} - {self.topic.name}: {self.estimated_skill:.1f}"


class SkillEvidence(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='skill_evidence'
    )
    language = models.ForeignKey(
        ProgrammingLanguage,
        on_delete=models.CASCADE,
        related_name='skill_evidence'
    )
    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name='skill_evidence'
    )
    submission = models.ForeignKey(
        Submission,
        on_delete=models.CASCADE,
        related_name='skill_evidence'
    )
    evaluation = models.ForeignKey(
        Evaluation,
        on_delete=models.CASCADE,
        related_name='skill_evidence'
    )
    evidence_value = models.FloatField()
    weight = models.FloatField(default=1.0)
    reason_code = models.CharField(max_length=50)
    formula_version = models.CharField(max_length=50, default='v1.0')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Evidence for {self.user.email} on {self.topic.name}: {self.evidence_value}"
