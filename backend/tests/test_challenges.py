from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from apps.catalog.models import ProgrammingLanguage, Topic
from apps.practice.models import PracticeSession, SessionChallenge
from apps.challenges.models import Challenge
from apps.challenges.services.rate_limiter import AIRateLimiter, session_ai_lock
from apps.challenges.services.gemini import GeminiChallengeService
from apps.challenges.services.delivery import ChallengeDeliveryService


class ChallengesTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='engineer@skillforge.io',
            password='StrongPassword123!'
        )
        self.client.force_authenticate(user=self.user)

        self.language = ProgrammingLanguage.objects.create(
            name='Python',
            slug='python',
            sort_order=1
        )
        self.topic = Topic.objects.create(
            language=self.language,
            name='Lists, Dicts & Comprehensions',
            slug='lists-dicts-comprehensions',
            description='Working with collections',
            sort_order=1
        )

    def test_gemini_fallback_service(self):
        """Verify that offline / no-API-key fallback returns valid foundation challenge."""
        data = GeminiChallengeService._fallback(
            language_slug='python',
            topic_slug='lists-dicts-comprehensions',
            difficulty='EASY',
            practice_mode='CODING'
        )
        self.assertEqual(data['origin'], 'CURATED_FALLBACK')
        self.assertTrue(len(data['title']) > 0)
        self.assertTrue('def ' in data['starter_code'])
        self.assertTrue(len(data['target_concepts']) > 0)

    def test_ai_rate_limiter(self):
        """Verify that rate limiter permits calls up to quota and throttles beyond."""
        user_id = str(self.user.id)
        # Consume 3 calls with max 3
        for i in range(3):
            allowed, _ = AIRateLimiter.check_and_consume(user_id, max_requests=3, window_seconds=60)
            self.assertTrue(allowed)

        # 4th call must be throttled
        allowed, wait_sec = AIRateLimiter.check_and_consume(user_id, max_requests=3, window_seconds=60)
        self.assertFalse(allowed)
        self.assertGreater(wait_sec, 0)

    def test_session_ai_lock(self):
        """Verify session mutex lock prevents concurrent execution."""
        session_id = 'test-lock-session-123'
        with session_ai_lock(session_id) as acquired1:
            self.assertTrue(acquired1)
            # Inner attempt should fail to acquire
            with session_ai_lock(session_id) as acquired2:
                self.assertFalse(acquired2)

    def test_challenge_delivery_idempotency_and_pool(self):
        """Verify challenge delivery uses pool and guarantees idempotency."""
        session = PracticeSession.objects.create(
            user=self.user,
            language=self.language,
            practice_type=PracticeSession.PracticeType.TOPIC,
            selected_topic=self.topic,
            difficulty_mode=PracticeSession.DifficultyMode.EASY,
            practice_mode=PracticeSession.PracticeMode.CODING,
            requested_question_count=2,
            status=PracticeSession.Status.IN_PROGRESS
        )

        # 1. Delivery should create first challenge
        sc1, finished, msg = ChallengeDeliveryService.get_or_create_next_challenge(session)
        self.assertFalse(finished)
        self.assertIsNotNone(sc1)
        self.assertEqual(sc1.question_order, 1)
        self.assertEqual(sc1.status, SessionChallenge.Status.ACTIVE)

        # 2. Repeated call should return exact same active challenge (idempotent)
        sc1_repeat, finished_repeat, _ = ChallengeDeliveryService.get_or_create_next_challenge(session)
        self.assertFalse(finished_repeat)
        self.assertEqual(sc1.id, sc1_repeat.id)

    def test_session_current_and_next_challenge_api(self):
        """Verify API endpoints for current challenge, skip, and next challenge."""
        session = PracticeSession.objects.create(
            user=self.user,
            language=self.language,
            practice_type=PracticeSession.PracticeType.TOPIC,
            selected_topic=self.topic,
            difficulty_mode=PracticeSession.DifficultyMode.EASY,
            practice_mode=PracticeSession.PracticeMode.CODING,
            requested_question_count=2,
            status=PracticeSession.Status.IN_PROGRESS
        )

        # GET current challenge
        url = reverse('practice:session-current-challenge', kwargs={'id': session.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['question_order'], 1)
        self.assertIn('starter_code', response.data['challenge'])
        self.assertIn('title', response.data['challenge'])

        # Skip to next challenge
        skip_url = reverse('practice:session-skip-challenge', kwargs={'id': session.id})
        skip_response = self.client.post(skip_url)
        self.assertEqual(skip_response.status_code, status.HTTP_200_OK)
        self.assertEqual(skip_response.data['question_order'], 2)
        self.assertTrue(skip_response.data['is_last_question'])

        # Complete final question by skipping
        final_skip = self.client.post(skip_url)
        self.assertEqual(final_skip.status_code, status.HTTP_200_OK)
        self.assertTrue(final_skip.data.get('session_finished'))

    def test_challenge_detail_api(self):
        """Verify GET /api/v1/challenges/<id>/ returns complete challenge specifications."""
        challenge = Challenge.objects.create(
            language=self.language,
            primary_topic=self.topic,
            title='Test Dict Challenge',
            statement='Do not mutate input dict',
            starter_code='def solution(): pass',
            hints_json=['Use copy()']
        )
        url = reverse('challenges:challenge-detail', kwargs={'id': challenge.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Dict Challenge')
        self.assertEqual(response.data['hints'], ['Use copy()'])
