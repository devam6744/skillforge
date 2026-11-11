from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    GoogleAuthView,
    LogoutView,
    MeView,
    CSRFTokenView,
    RequestPasswordResetOTPView,
    VerifyPasswordResetOTPView,
    ConfirmPasswordResetView,
    ChangePasswordView,
    MultiDeviceSessionsView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('google/', GoogleAuthView.as_view(), name='auth-google'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('csrf/', CSRFTokenView.as_view(), name='auth-csrf'),
    # Password Reset via OTP (SMTP Email)
    path('password-reset/request-otp/', RequestPasswordResetOTPView.as_view(), name='password-reset-request-otp'),
    path('password-reset/verify-otp/', VerifyPasswordResetOTPView.as_view(), name='password-reset-verify-otp'),
    path('password-reset/confirm/', ConfirmPasswordResetView.as_view(), name='password-reset-confirm'),
    # Profile Security & Multi-Device Management
    path('password/change/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('sessions/multi-device/', MultiDeviceSessionsView.as_view(), name='auth-multi-device-sessions'),
]
