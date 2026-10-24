from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.users.models import UserProfile

User = get_user_model()


class ProfileTests(APITestCase):
    def setUp(self):
        self.profile_url = '/api/v1/profile/'
        self.user1 = User.objects.create_user(
            email='alice@skillforge.io',
            password='StrongPassword123!'
        )
        self.profile1, _ = UserProfile.objects.get_or_create(
            user=self.user1,
            defaults={'display_name': 'Alice Architect'}
        )

        self.user2 = User.objects.create_user(
            email='bob@skillforge.io',
            password='StrongPassword123!'
        )
        self.profile2, _ = UserProfile.objects.get_or_create(
            user=self.user2,
            defaults={'display_name': 'Bob Backend', 'username': 'bobdev'}
        )

    def test_unauthenticated_profile_access_denied(self):
        """Unauthenticated requests cannot access profile."""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_own_profile(self):
        """Authenticated user receives only their own profile."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'alice@skillforge.io')
        self.assertEqual(response.data['display_name'], 'Alice Architect')

    def test_update_profile_and_onboarding(self):
        """User can update profile display name, initial skill level, and complete onboarding."""
        self.client.force_authenticate(user=self.user1)
        update_data = {
            'display_name': 'Alice Lead',
            'username': 'alice_lead',
            'initial_skill_level': 'INTERMEDIATE',
            'onboarding_completed': True,
            'bio': 'Systems programmer exploring distributed consensus.'
        }
        response = self.client.patch(self.profile_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['display_name'], 'Alice Lead')
        self.assertEqual(response.data['username'], 'alice_lead')
        self.assertEqual(response.data['initial_skill_level'], 'INTERMEDIATE')
        self.assertTrue(response.data['onboarding_completed'])

        # Verify DB
        self.profile1.refresh_from_db()
        self.assertEqual(self.profile1.display_name, 'Alice Lead')
        self.assertTrue(self.profile1.onboarding_completed)

    def test_duplicate_username_rejected(self):
        """Cannot take a username already claimed by another user."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.patch(self.profile_url, {'username': 'bobdev'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data['error']['details'])
