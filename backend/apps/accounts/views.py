from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import login, logout, get_user_model
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.apps import apps
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    GoogleAuthSerializer,
    UserSerializer,
)

User = get_user_model()


class RegisterView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Automatically establish authenticated session upon registration
            login(request, user)
            return Response({
                "message": "User registered successfully.",
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response({
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Registration validation failed.",
                "details": serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)


class LoginView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)
            return Response({
                "message": "Login successful.",
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        return Response({
            "error": {
                "code": "INVALID_CREDENTIALS",
                "message": "Invalid email or password.",
                "details": serializer.errors
            }
        }, status=status.HTTP_401_UNAUTHORIZED)


class GoogleAuthView(views.APIView):
    """
    Verifies Google OAuth ID token, provisions user if new, and logs user into Django session.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "error": {
                    "code": "OAUTH_VALIDATION_ERROR",
                    "message": "Google authentication failed.",
                    "details": serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        payload = serializer.validated_data['credential']
        email = payload['email']
        name = payload.get('name', '').strip() or email.split('@')[0]

        # Get existing user or provision a new one
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'is_active': True,
                'is_email_verified': True,
            }
        )

        # Mark email verified if previously unverified
        if not user.is_email_verified:
            user.is_email_verified = True
            user.save(update_fields=['is_email_verified'])

        # Ensure user profile exists
        UserProfile = apps.get_model('users', 'UserProfile')
        UserProfile.objects.get_or_create(
            user=user,
            defaults={'display_name': name}
        )

        # Establish Django session
        login(request, user)

        return Response({
            "message": "Google authentication successful.",
            "user": UserSerializer(user).data,
            "is_new_user": created
        }, status=status.HTTP_200_OK)


class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({
            "message": "Logged out successfully."
        }, status=status.HTTP_200_OK)


class MeView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "user": UserSerializer(request.user).data
        }, status=status.HTTP_200_OK)


class CSRFTokenView(views.APIView):
    """Provides a fresh CSRF cookie for the SPA client."""
    permission_classes = [AllowAny]

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        return Response({"message": "CSRF cookie set."}, status=status.HTTP_200_OK)
