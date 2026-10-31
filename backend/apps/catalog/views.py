from rest_framework import generics, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.catalog.models import ProgrammingLanguage, Topic
from apps.catalog.serializers import ProgrammingLanguageSerializer, TopicSerializer


class LanguageListView(generics.ListAPIView):
    """
    Public endpoint to list all supported programming languages and their active topics.
    GET /api/v1/catalog/languages/
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = ProgrammingLanguageSerializer
    pagination_class = None

    def get_queryset(self):
        return ProgrammingLanguage.objects.filter(is_active=True).prefetch_related('topics')


class TopicListView(generics.ListAPIView):
    """
    Public endpoint to list active topics for a specific programming language slug.
    GET /api/v1/catalog/languages/<slug>/topics/
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = TopicSerializer
    pagination_class = None

    def get_queryset(self):
        language_slug = self.kwargs.get('slug')
        language = get_object_or_404(ProgrammingLanguage, slug=language_slug, is_active=True)
        return Topic.objects.filter(language=language, is_active=True).order_by('sort_order', 'name')

