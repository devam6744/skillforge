import uuid
from django.db import models
from django.conf import settings


class AuditEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_events'
    )
    event_type = models.CharField(max_length=100)
    target_type = models.CharField(max_length=100, blank=True)
    target_id = models.CharField(max_length=100, blank=True)
    request_id = models.CharField(max_length=100, blank=True)
    safe_metadata = models.JSONField(default=dict, blank=True)
    outcome = models.CharField(max_length=50, default='SUCCESS')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Audit: {self.event_type} - {self.outcome} ({self.created_at})"
