from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UserProfile
from .serializers import UserProfileSerializer


class ProfileView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, _ = UserProfile.objects.get_or_create(
            user=self.request.user,
            defaults={'display_name': self.request.user.email.split('@')[0]}
        )
        return profile

    def get(self, request):
        profile = self.get_object()
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        profile = self.get_object()
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Profile update failed.",
                "details": serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)
