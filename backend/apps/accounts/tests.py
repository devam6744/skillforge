import uuid
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import PasswordResetOTP

User = get_user_model()


class PasswordResetAndMultiDeviceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
        self.password = "InitialPass123!"
        self.user = User.objects.create_user(
            email=self.email,
            password=self.password
        )

    def test_request_otp_success(self):
        url = reverse('password-reset-request-otp')
        response = self.client.post(url, {'email': self.email}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Verification code has been sent", response.data['message'])

        # Verify OTP was created in database
        otp_record = PasswordResetOTP.objects.filter(user=self.user, is_used=False).first()
        self.assertIsNotNone(otp_record)
        self.assertEqual(len(otp_record.otp), 6)
        self.assertTrue(otp_record.is_valid())

    def test_request_otp_nonexistent_email(self):
        url = reverse('password-reset-request-otp')
        response = self.client.post(url, {'email': 'nobody@example.com'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_and_confirm_password_reset(self):
        # 1. Request OTP
        req_url = reverse('password-reset-request-otp')
        self.client.post(req_url, {'email': self.email}, format='json')
        otp_record = PasswordResetOTP.objects.filter(user=self.user, is_used=False).first()
        otp = otp_record.otp

        # 2. Verify OTP
        verify_url = reverse('password-reset-verify-otp')
        verify_resp = self.client.post(verify_url, {'email': self.email, 'otp': otp}, format='json')
        self.assertEqual(verify_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(verify_resp.data['valid'])

        # 3. Confirm Reset with new password
        new_password = "BrandNewSecret987!"
        confirm_url = reverse('password-reset-confirm')
        confirm_resp = self.client.post(confirm_url, {
            'email': self.email,
            'otp': otp,
            'new_password': new_password,
            'new_password_confirm': new_password,
        }, format='json')

        self.assertEqual(confirm_resp.status_code, status.HTTP_200_OK)
        self.assertIn("Password reset successfully", confirm_resp.data['message'])

        # 4. Verify user can log in with new password
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(new_password))

        # 5. Verify OTP is now marked as used
        otp_record.refresh_from_db()
        self.assertTrue(otp_record.is_used)

        # 6. Replay attack: attempting to reuse OTP must fail
        reuse_resp = self.client.post(confirm_url, {
            'email': self.email,
            'otp': otp,
            'new_password': "AnotherPassword123!",
            'new_password_confirm': "AnotherPassword123!",
        }, format='json')
        self.assertEqual(reuse_resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_authenticated(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('auth-change-password')

        # Invalid current password
        bad_resp = self.client.post(url, {
            'current_password': 'WrongPassword123!',
            'new_password': 'ValidNewPass456!',
            'new_password_confirm': 'ValidNewPass456!'
        }, format='json')
        self.assertEqual(bad_resp.status_code, status.HTTP_400_BAD_REQUEST)

        # Correct current password
        good_resp = self.client.post(url, {
            'current_password': self.password,
            'new_password': 'ValidNewPass456!',
            'new_password_confirm': 'ValidNewPass456!'
        }, format='json')
        self.assertEqual(good_resp.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('ValidNewPass456!'))

    def test_multi_device_sessions_view(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('auth-multi-device-sessions')

        get_resp = self.client.get(url)
        self.assertEqual(get_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(get_resp.data['current_device']['multi_device_supported'])

        post_resp = self.client.post(url)
        self.assertEqual(post_resp.status_code, status.HTTP_200_OK)
        self.assertIn("Successfully logged out", post_resp.data['message'])
