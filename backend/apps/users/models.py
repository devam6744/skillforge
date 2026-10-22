import uuid
from django.db import models
from django.conf import settings


class UserProfile(models.Model):
    """User profile and onboarding preferences."""
    class SkillLevel(models.TextChoices):
        BEGINNER = 'BEGINNER', 'Beginner'
        INTERMEDIATE = 'INTERMEDIATE', 'Intermediate'
        ADVANCED = 'ADVANCED', 'Advanced'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    display_name = models.CharField(max_length=150, blank=True)
    username = models.CharField(max_length=50, unique=True, null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    initial_skill_level = models.CharField(
        max_length=20,
        choices=SkillLevel.choices,
        default=SkillLevel.BEGINNER
    )
    onboarding_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.display_name or str(self.user.email)
