import uuid
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from apps.catalog.models import ProgrammingLanguage, Topic
from apps.practice.models import PracticeSession

User = get_user_model()


class PracticeSessionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_a = User.objects.create_user(
            email="alice@example.com",
            password="StrongPassword123!"
        )
        self.user_b = User.objects.create_user(
            email="bob@example.com",
            password="StrongPassword123!"
        )

        self.python = ProgrammingLanguage.objects.create(
            name="Python",
            slug="python",
            is_active=True
        )
        self.cpp = ProgrammingLanguage.objects.create(
            name="C++",
            slug="cpp",
            is_active=True
        )
        self.py_topic = Topic.objects.create(
            language=self.python,
            name="Arrays & Hash Maps",
            slug="arrays-hash-maps",
            is_active=True
        )
        self.cpp_topic = Topic.objects.create(
            language=self.cpp,
            name="Memory & RAII",
            slug="memory-raii",
            is_active=True
        )

    def test_unauthenticated_user_cannot_access_practice_sessions(self):
        url = reverse('practice:session-list-create')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        response = self.client.post(url, {})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_topic_practice_session_success(self):
        self.client.force_authenticate(user=self.user_a)
        url = reverse('practice:session-list-create')
        payload = {
            "language_slug": "python",
            "topic_slug": "arrays-hash-maps",
            "practice_type": "TOPIC",
            "difficulty_mode": "ADAPTIVE",
            "practice_mode": "CODING",
            "requested_question_count": 5
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['language_slug'], 'python')
        self.assertEqual(response.data['topic_slug'], 'arrays-hash-maps')
        self.assertEqual(response.data['status'], 'IN_PROGRESS')
        self.assertIsNotNone(response.data['started_at'])

    def test_create_session_topic_mismatch_fails_validation(self):
        self.client.force_authenticate(user=self.user_a)
        url = reverse('practice:session-list-create')
        # memory-raii is C++ topic, not Python
        payload = {
            "language_slug": "python",
            "topic_slug": "memory-raii",
            "practice_type": "TOPIC"
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('topic_slug', response.data)

    def test_create_mixed_practice_session_without_topic(self):
        self.client.force_authenticate(user=self.user_a)
        url = reverse('practice:session-list-create')
        payload = {
            "language_slug": "python",
            "practice_type": "MIXED",
            "difficulty_mode": "HARD",
            "requested_question_count": 10
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['practice_type'], 'MIXED')
        self.assertIsNone(response.data['topic_slug'])

    def test_user_session_isolation(self):
        # Alice creates a session
        self.client.force_authenticate(user=self.user_a)
        session = PracticeSession.objects.create(
            user=self.user_a,
            language=self.python,
            selected_topic=self.py_topic,
            status=PracticeSession.Status.IN_PROGRESS
        )

        # Bob attempts to retrieve Alice's session
        self.client.force_authenticate(user=self.user_b)
        url = reverse('practice:session-detail', kwargs={'id': session.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Bob lists sessions — should be empty
        list_url = reverse('practice:session-list-create')
        response = self.client.get(list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    def test_active_session_endpoint(self):
        self.client.force_authenticate(user=self.user_a)
        active_url = reverse('practice:session-active')

        # No active session initially
        response = self.client.get(active_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['active_session'])

        # Create active session
        session = PracticeSession.objects.create(
            user=self.user_a,
            language=self.python,
            selected_topic=self.py_topic,
            status=PracticeSession.Status.IN_PROGRESS
        )
        response = self.client.get(active_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['active_session'])
        self.assertEqual(response.data['active_session']['id'], str(session.id))

    def test_abandon_session(self):
        self.client.force_authenticate(user=self.user_a)
        session = PracticeSession.objects.create(
            user=self.user_a,
            language=self.python,
            selected_topic=self.py_topic,
            status=PracticeSession.Status.IN_PROGRESS
        )
        abandon_url = reverse('practice:session-abandon', kwargs={'id': session.id})
        response = self.client.post(abandon_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ABANDONED')

        session.refresh_from_db()
        self.assertEqual(session.status, PracticeSession.Status.ABANDONED)

    def test_complete_session(self):
        self.client.force_authenticate(user=self.user_a)
        session = PracticeSession.objects.create(
            user=self.user_a,
            language=self.python,
            selected_topic=self.py_topic,
            status=PracticeSession.Status.IN_PROGRESS
        )
        complete_url = reverse('practice:session-complete', kwargs={'id': session.id})
        response = self.client.post(complete_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'COMPLETED')

        session.refresh_from_db()
        self.assertEqual(session.status, PracticeSession.Status.COMPLETED)
