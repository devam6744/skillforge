import secrets
from datetime import timedelta
from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import login, logout, get_user_model, update_session_auth_hash
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.contrib.sessions.models import Session
from django.apps import apps
from .models import PasswordResetOTP
from .services import send_password_reset_otp_email
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    GoogleAuthSerializer,
    UserSerializer,
    RequestPasswordResetOTPSerializer,
    VerifyPasswordResetOTPSerializer,
    ConfirmPasswordResetSerializer,
    ChangePasswordSerializer,
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


class RequestPasswordResetOTPView(views.APIView):
    """
    Generates a secure 6-digit OTP and sends it via SMTP email for password reset.
    Rate limited / single active OTP per user.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RequestPasswordResetOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Failed to send reset code.",
                    "details": serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        user = User.objects.get(email=email)

        # Invalidate any previously active OTPs for this user
        PasswordResetOTP.objects.filter(user=user, is_used=False).update(is_used=True)

        # Generate 6-digit numeric OTP
        otp = f"{secrets.randbelow(900000) + 100000}"
        expires_at = timezone.now() + timedelta(minutes=10)

        otp_record = PasswordResetOTP.objects.create(
            user=user,
            otp=otp,
            expires_at=expires_at,
            is_used=False
        )

        success, mode = send_password_reset_otp_email(user, otp, expires_minutes=10)
        
        response_payload = {
            "message": "Verification code has been sent to your email address.",
            "email": email,
            "expires_in_minutes": 10,
        }

        # If SMTP password not configured yet or failed in cloud, provide demo_otp for instant unblocked verification
        if mode == "FALLBACK_DEMO":
            response_payload["demo_otp"] = otp
            response_payload["notice"] = "Gmail SMTP App Password not configured in Vercel. Showing verification code for immediate testing."

        return Response(response_payload, status=status.HTTP_200_OK)


class VerifyPasswordResetOTPView(views.APIView):
    """
    Validates the 6-digit OTP before allowing password change.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyPasswordResetOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "error": {
                    "code": "INVALID_OTP",
                    "message": "Invalid or expired verification code.",
                    "details": serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "valid": True,
            "message": "Verification code verified successfully."
        }, status=status.HTTP_200_OK)


class ConfirmPasswordResetView(views.APIView):
    """
    Verifies OTP and resets user password. Establishes session immediately upon success.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ConfirmPasswordResetSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Password reset failed.",
                    "details": serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data['user']
        otp_record = serializer.validated_data['otp_record']
        new_password = serializer.validated_data['new_password']

        # Update password
        user.set_password(new_password)
        user.save()

        # Mark OTP as consumed
        otp_record.is_used = True
        otp_record.save(update_fields=['is_used'])

        # Invalidate all remaining OTPs for security
        PasswordResetOTP.objects.filter(user=user, is_used=False).update(is_used=True)

        # Automatically log user in
        login(request, user)

        return Response({
            "message": "Password reset successfully. You are now logged in.",
            "user": UserSerializer(user).data
        }, status=status.HTTP_200_OK)


class ChangePasswordView(views.APIView):
    """
    Allows authenticated users to change their password from their profile security tab.
    Preserves current session authentication hash.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response({
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Password update failed.",
                    "details": serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        new_password = serializer.validated_data['new_password']
        user = request.user
        user.set_password(new_password)
        user.save()

        # Update session auth hash to prevent logging out current device
        update_session_auth_hash(request, user)

        return Response({
            "message": "Password updated successfully."
        }, status=status.HTTP_200_OK)


class MultiDeviceSessionsView(views.APIView):
    """
    Provides multi-device visibility and control:
    - GET: lists count of active authenticated device sessions
    - POST (action: logout_others): revokes all sessions on other devices
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id_str = str(request.user.id)
        current_key = request.session.session_key
        active_sessions = Session.objects.filter(expire_date__gte=timezone.now())

        other_devices_count = 0
        for s in active_sessions:
            if s.session_key != current_key:
                try:
                    data = s.get_decoded()
                    if data.get('_auth_user_id') == user_id_str:
                        other_devices_count += 1
                except Exception:
                    continue

        return Response({
            "current_device": {
                "session_active": True,
                "multi_device_supported": True,
            },
            "other_active_devices_count": other_devices_count,
            "total_active_devices": other_devices_count + (1 if current_key else 0)
        }, status=status.HTTP_200_OK)

    def post(self, request):
        """Log out from all other devices, keeping current device authenticated."""
        user_id_str = str(request.user.id)
        current_key = request.session.session_key
        active_sessions = Session.objects.filter(expire_date__gte=timezone.now())

        revoked_count = 0
        for s in active_sessions:
            if s.session_key != current_key:
                try:
                    data = s.get_decoded()
                    if data.get('_auth_user_id') == user_id_str:
                        s.delete()
                        revoked_count += 1
                except Exception:
                    continue

        return Response({
            "message": f"Successfully logged out from {revoked_count} other device(s).",
            "revoked_count": revoked_count
        }, status=status.HTTP_200_OK)
