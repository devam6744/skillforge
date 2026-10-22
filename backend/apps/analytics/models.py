import uuid
from django.db import models
from django.conf import settings


class AIUsage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ai_usage_logs'
    )
    operation_type = models.CharField(max_length=50)  # e.g., CHALLENGE_GEN, EVALUATION, HINT
    provider = models.CharField(max_length=50, default='google-gemini')
    model = models.CharField(max_length=100)
    request_key = models.CharField(max_length=128, blank=True, db_index=True)
    status = models.CharField(max_length=20, default='SUCCESS')
    latency_ms = models.IntegerField(null=True, blank=True)
    input_tokens = models.IntegerField(null=True, blank=True)
    output_tokens = models.IntegerField(null=True, blank=True)
    safe_error_code = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.operation_type} - {self.status} ({self.created_at})"
