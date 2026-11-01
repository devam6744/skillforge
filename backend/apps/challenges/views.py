from rest_framework import generics, permissions
from apps.challenges.models import Challenge
from apps.challenges.serializers import ChallengeDetailSerializer


class ChallengeDetailView(generics.RetrieveAPIView):
    """
    Retrieve challenge details by ID.
    GET /api/v1/challenges/<uuid:id>/
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChallengeDetailSerializer
    queryset = Challenge.objects.all().select_related('language', 'primary_topic')
    lookup_field = 'id'
