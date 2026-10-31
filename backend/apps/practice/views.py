from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.practice.models import PracticeSession
from apps.practice.serializers import (
    PracticeSessionCreateSerializer,
    PracticeSessionDetailSerializer
)


class SessionListCreateView(generics.ListCreateAPIView):
    """
    List user's sessions or create a new session.
    GET /api/v1/practice/sessions/
    POST /api/v1/practice/sessions/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PracticeSessionCreateSerializer
        return PracticeSessionDetailSerializer

    def get_queryset(self):
        return PracticeSession.objects.filter(
            user=self.request.user
        ).select_related('language', 'selected_topic').order_by('-created_at')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        session = serializer.save()
        detail_serializer = PracticeSessionDetailSerializer(session)
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)


class ActiveSessionView(APIView):
    """
    Retrieves the user's current in-progress practice session if one exists.
    GET /api/v1/practice/sessions/active/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        session = PracticeSession.objects.filter(
            user=request.user,
            status=PracticeSession.Status.IN_PROGRESS
        ).select_related('language', 'selected_topic').first()

        if not session:
            return Response({"active_session": None}, status=status.HTTP_200_OK)

        serializer = PracticeSessionDetailSerializer(session)
        return Response({"active_session": serializer.data}, status=status.HTTP_200_OK)


class SessionDetailView(generics.RetrieveAPIView):
    """
    Retrieve specific session details.
    GET /api/v1/practice/sessions/<uuid:id>/
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PracticeSessionDetailSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return PracticeSession.objects.filter(
            user=self.request.user
        ).select_related('language', 'selected_topic')


class SessionAbandonView(APIView):
    """
    Abandon an active session.
    POST /api/v1/practice/sessions/<uuid:id>/abandon/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        session = get_object_or_404(PracticeSession, id=id, user=request.user)

        if session.status in [PracticeSession.Status.COMPLETED, PracticeSession.Status.ABANDONED]:
            return Response(
                {"detail": f"Session is already {session.status.lower()}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        session.status = PracticeSession.Status.ABANDONED
        session.completed_at = timezone.now()
        session.save(update_fields=['status', 'completed_at', 'updated_at'])

        serializer = PracticeSessionDetailSerializer(session)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SessionCompleteView(APIView):
    """
    Complete an active session.
    POST /api/v1/practice/sessions/<uuid:id>/complete/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        session = get_object_or_404(PracticeSession, id=id, user=request.user)

        if session.status == PracticeSession.Status.ABANDONED:
            return Response(
                {"detail": "Cannot complete an abandoned session."},
                status=status.HTTP_400_BAD_REQUEST
            )

        session.status = PracticeSession.Status.COMPLETED
        session.completed_at = timezone.now()
        session.save(update_fields=['status', 'completed_at', 'updated_at'])

        serializer = PracticeSessionDetailSerializer(session)
        return Response(serializer.data, status=status.HTTP_200_OK)

