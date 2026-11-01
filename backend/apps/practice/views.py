from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.practice.models import PracticeSession, SessionChallenge
from apps.practice.serializers import (
    PracticeSessionCreateSerializer,
    PracticeSessionDetailSerializer
)
from apps.challenges.serializers import SessionChallengeSerializer
from apps.challenges.services.delivery import ChallengeDeliveryService
from apps.challenges.models import Challenge
from apps.submissions.models import Submission
from apps.evaluation.services.evaluator import CodeEvaluationService


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


class SessionCurrentChallengeView(APIView):
    """
    Get current active challenge for a session.
    GET /api/v1/practice/sessions/<uuid:id>/current-challenge/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, id):
        session = get_object_or_404(PracticeSession, id=id, user=request.user)
        active_sc = session.session_challenges.filter(
            status=SessionChallenge.Status.ACTIVE
        ).select_related('challenge', 'challenge__primary_topic', 'challenge__language').first()

        if not active_sc:
            # Attempt to deliver next challenge
            active_sc, is_finished, msg = ChallengeDeliveryService.get_or_create_next_challenge(session)
            if is_finished:
                return Response(
                    {"session_finished": True, "detail": msg},
                    status=status.HTTP_200_OK
                )

        serializer = SessionChallengeSerializer(active_sc)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SessionNextChallengeView(APIView):
    """
    Request or advance to the next challenge in this practice session.
    POST /api/v1/practice/sessions/<uuid:id>/next-challenge/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        session = get_object_or_404(PracticeSession, id=id, user=request.user)

        if session.status in [PracticeSession.Status.COMPLETED, PracticeSession.Status.ABANDONED]:
            return Response(
                {"detail": f"Cannot generate challenges for a {session.status.lower()} session."},
                status=status.HTTP_400_BAD_REQUEST
            )

        session_challenge, is_finished, message = ChallengeDeliveryService.get_or_create_next_challenge(session)

        if is_finished or not session_challenge:
            return Response(
                {"session_finished": True, "detail": message},
                status=status.HTTP_200_OK
            )

        serializer = SessionChallengeSerializer(session_challenge)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SessionSkipChallengeView(APIView):
    """
    Skip current challenge and advance to next.
    POST /api/v1/practice/sessions/<uuid:id>/skip-challenge/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        session = get_object_or_404(PracticeSession, id=id, user=request.user)

        active_sc = session.session_challenges.filter(
            status=SessionChallenge.Status.ACTIVE
        ).first()

        if active_sc:
            active_sc.status = SessionChallenge.Status.SKIPPED
            active_sc.completed_at = timezone.now()
            active_sc.save(update_fields=['status', 'completed_at'])

        session_challenge, is_finished, message = ChallengeDeliveryService.get_or_create_next_challenge(session)

        if is_finished or not session_challenge:
            return Response(
                {"session_finished": True, "detail": message},
                status=status.HTTP_200_OK
            )

        serializer = SessionChallengeSerializer(session_challenge)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SessionSubmitView(APIView):
    """
    Submits student code for evaluation against a challenge in a practice session.
    POST /api/v1/practice/sessions/<uuid:id>/submit/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        session = get_object_or_404(PracticeSession, id=id, user=request.user)

        if session.status in [PracticeSession.Status.COMPLETED, PracticeSession.Status.ABANDONED]:
            return Response(
                {"detail": f"Cannot submit solutions for a {session.status.lower()} session."},
                status=status.HTTP_400_BAD_REQUEST
            )

        challenge_id = request.data.get('challenge_id')
        source_code = request.data.get('source_code', '')

        if not challenge_id:
            return Response({"detail": "challenge_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        challenge = get_object_or_404(Challenge, id=challenge_id)

        submission = Submission.objects.create(
            user=request.user,
            session=session,
            challenge=challenge,
            language=session.language,
            source_code=source_code,
            status=Submission.Status.EVALUATING
        )

        eval_result = CodeEvaluationService.evaluate(submission)

        is_session_finished = False
        if eval_result.score >= 70:
            solved_count = session.session_challenges.filter(status=SessionChallenge.Status.SOLVED).count()
            if solved_count >= session.requested_question_count:
                session.status = PracticeSession.Status.COMPLETED
                session.completed_at = timezone.now()
                session.save(update_fields=['status', 'completed_at', 'updated_at'])
                is_session_finished = True

        return Response({
            "submission_id": str(submission.id),
            "score": eval_result.score,
            "status": eval_result.status,
            "is_solved": eval_result.score >= 70,
            "is_session_finished": is_session_finished,
            "summary": eval_result.summary,
            "feedback": eval_result.approach_feedback,
            "syntax_issues": eval_result.syntax_issues,
            "logic_issues": eval_result.logic_issues,
            "concepts_demonstrated": eval_result.concepts_demonstrated,
            "complexity": "O(1) execution",
            "timestamp": eval_result.completed_at.strftime("%I:%M:%S %p") if eval_result.completed_at else timezone.now().strftime("%I:%M:%S %p")
        }, status=status.HTTP_200_OK)


