from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.users.models import UserProfile

User = get_user_model()


class AuthenticationTests(APITestCase):
    def setUp(self):
        self.register_url = '/api/v1/auth/register/'
        self.login_url = '/api/v1/auth/login/'
        self.google_url = '/api/v1/auth/google/'
        self.logout_url = '/api/v1/auth/logout/'
        self.me_url = '/api/v1/auth/me/'

        self.valid_user_data = {
            'email': 'developer@skillforge.io',
            'password': 'StrongSecurePassword123!',
            'password_confirm': 'StrongSecurePassword123!',
            'display_name': 'Code Crafter'
        }

    def test_registration_success(self):
        """User can register with valid credentials and receives an active session."""
        response = self.client.post(self.register_url, self.valid_user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['email'], 'developer@skillforge.io')
        self.assertEqual(response.data['user']['profile']['display_name'], 'Code Crafter')

        # Verify DB records
        user = User.objects.get(email='developer@skillforge.io')
        self.assertTrue(user.is_active)
        self.assertEqual(user.profile.display_name, 'Code Crafter')

        # Verify session is established
        me_response = self.client.get(self.me_url)
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data['user']['email'], 'developer@skillforge.io')

    def test_registration_password_mismatch(self):
        """Registration fails if passwords do not match."""
        data = self.valid_user_data.copy()
        data['password_confirm'] = 'DifferentPassword123!'
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password_confirm', response.data['error']['details'])

    def test_registration_duplicate_email(self):
        """Registration fails if email is already taken."""
        self.client.post(self.register_url, self.valid_user_data, format='json')
        # Attempt second registration with same email (different case)
        data = self.valid_user_data.copy()
        data['email'] = 'DEVELOPER@skillforge.io'
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data['error']['details'])

    def test_registration_weak_password(self):
        """Registration fails if password is too short or common."""
        data = self.valid_user_data.copy()
        data['password'] = '123'
        data['password_confirm'] = '123'
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        """Registered user can log in with valid credentials."""
        self.client.post(self.register_url, self.valid_user_data, format='json')
        self.client.logout()

        login_response = self.client.post(self.login_url, {
            'email': 'developer@skillforge.io',
            'password': 'StrongSecurePassword123!'
        }, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertEqual(login_response.data['user']['email'], 'developer@skillforge.io')

        # Session should be active
        me_response = self.client.get(self.me_url)
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)

    def test_login_invalid_credentials(self):
        """Login fails with 401 when given wrong password."""
        self.client.post(self.register_url, self.valid_user_data, format='json')
        self.client.logout()

        response = self.client.post(self.login_url, {
            'email': 'developer@skillforge.io',
            'password': 'WrongPassword123!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_google_oauth_success(self):
        """User can authenticate via Google OAuth credential."""
        response = self.client.post(self.google_url, {
            'credential': 'mock_token_devam'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['email'], 'devam@gmail.com')
        self.assertTrue(response.data['is_new_user'])

        # Authenticated session should allow /me/
        me_response = self.client.get(self.me_url)
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data['user']['email'], 'devam@gmail.com')

    def test_logout(self):
        """Logging out terminates the session."""
        self.client.post(self.register_url, self.valid_user_data, format='json')
        logout_response = self.client.post(self.logout_url)
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

        # Subsequent /me/ request must be denied
        me_response = self.client.get(self.me_url)
        self.assertEqual(me_response.status_code, status.HTTP_403_FORBIDDEN)
