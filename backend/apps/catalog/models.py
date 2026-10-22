import uuid
from django.db import models


class ProgrammingLanguage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class Topic(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    language = models.ForeignKey(
        ProgrammingLanguage,
        on_delete=models.CASCADE,
        related_name='topics'
    )
    slug = models.SlugField(max_length=50)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'name']
        constraints = [
            models.UniqueConstraint(
                fields=['language', 'slug'],
                name='unique_language_topic_slug'
            )
        ]

    def __str__(self):
        return f"{self.language.name} - {self.name}"
