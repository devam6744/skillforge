from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import UserProfile

User = get_user_model()


class UserProfileTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="developer@example.com",
            password="StrongPassword123!"
        )
        self.client.force_authenticate(user=self.user)

    def test_get_and_update_profile(self):
        url = reverse('user-profile')

        # 1. GET profile
        get_res = self.client.get(url)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.data['email'], 'developer@example.com')

        # 2. PATCH profile
        patch_res = self.client.patch(url, {
            'display_name': 'Devam Patel',
            'username': 'devampatel',
            'bio': 'Full-stack software engineer & problem solver.',
            'initial_skill_level': 'INTERMEDIATE'
        }, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['display_name'], 'Devam Patel')
        self.assertEqual(patch_res.data['username'], 'devampatel')
        self.assertEqual(patch_res.data['initial_skill_level'], 'INTERMEDIATE')

        # 3. Duplicate username validation
        user2 = User.objects.create_user(email="other@example.com", password="Password123!")
        client2 = APIClient()
        client2.force_authenticate(user=user2)
        dup_res = client2.patch(url, {'username': 'devampatel'}, format='json')
        self.assertEqual(dup_res.status_code, status.HTTP_400_BAD_REQUEST)
