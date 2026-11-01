from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.challenges.models import Challenge
from apps.challenges.serializers import ChallengeDetailSerializer
from apps.catalog.models import ProgrammingLanguage
from apps.submissions.models import Submission
from apps.challenges.services.gemini import AIConnectionError
from apps.evaluation.services.evaluator import CodeEvaluationService


class ChallengeDetailView(generics.RetrieveAPIView):
    """
    Retrieve challenge details by ID.
    GET /api/v1/challenges/<uuid:id>/
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChallengeDetailSerializer
    queryset = Challenge.objects.all().select_related('language', 'primary_topic')
    lookup_field = 'id'


class ChallengeSubmitView(APIView):
    """
    Direct challenge submission & evaluation endpoint (supports standalone practice).
    POST /api/v1/challenges/<uuid:id>/submit/
    POST /api/v1/challenges/submit/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id=None):
        challenge_id = id or request.data.get('challenge_id')
        source_code = request.data.get('source_code', '')
        language_slug = request.data.get('language_slug', '')

        challenge = None
        if challenge_id:
            try:
                challenge = Challenge.objects.filter(id=challenge_id).first()
            except Exception:
                challenge = None

        if not challenge and language_slug:
            # Fallback: find first valid challenge for language
            lang = ProgrammingLanguage.objects.filter(slug=language_slug).first()
            if lang:
                challenge = Challenge.objects.filter(language=lang, quality_status=Challenge.QualityStatus.VALID).first()

        if not challenge:
            challenge = Challenge.objects.filter(quality_status=Challenge.QualityStatus.VALID).first()

        if not challenge:
            return Response({"detail": "Challenge not found."}, status=status.HTTP_404_NOT_FOUND)

        submission = Submission.objects.create(
            user=request.user,
            session=None,
            challenge=challenge,
            language=challenge.language,
            source_code=source_code,
            status=Submission.Status.EVALUATING
        )

        try:
            eval_result = CodeEvaluationService.evaluate(submission)
        except AIConnectionError as exc:
            return Response(
                {"error": "INTERNET_REQUIRED", "detail": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return Response({
            "submission_id": str(submission.id),
            "challenge_id": str(challenge.id),
            "challenge_title": challenge.title,
            "score": eval_result.score,
            "status": eval_result.status,
            "is_solved": eval_result.score >= 70,
            "summary": eval_result.summary,
            "feedback": eval_result.approach_feedback,
            "syntax_issues": eval_result.syntax_issues,
            "logic_issues": eval_result.logic_issues,
            "concepts_demonstrated": eval_result.concepts_demonstrated,
            "complexity": "O(1) execution",
            "timestamp": eval_result.completed_at.strftime("%I:%M:%S %p") if eval_result.completed_at else timezone.now().strftime("%I:%M:%S %p")
        }, status=status.HTTP_200_OK)
