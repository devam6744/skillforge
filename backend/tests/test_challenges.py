from unittest.mock import patch
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from apps.catalog.models import ProgrammingLanguage, Topic
from apps.practice.models import PracticeSession, SessionChallenge
from apps.challenges.models import Challenge
from apps.challenges.services.rate_limiter import AIRateLimiter, session_ai_lock
from apps.challenges.services.gemini import GeminiChallengeService, AIConnectionError
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

    def test_ai_rate_limiter(self):
        """Verify that rate limiter permits calls up to quota and throttles beyond."""
        user_id = str(self.user.id)
        for i in range(3):
            allowed, _ = AIRateLimiter.check_and_consume(user_id, max_requests=3, window_seconds=60)
            self.assertTrue(allowed)

        allowed, wait_sec = AIRateLimiter.check_and_consume(user_id, max_requests=3, window_seconds=60)
        self.assertFalse(allowed)
        self.assertGreater(wait_sec, 0)

    def test_session_ai_lock(self):
        """Verify session mutex lock prevents concurrent execution."""
        session_id = 'test-lock-session-123'
        with session_ai_lock(session_id) as acquired1:
            self.assertTrue(acquired1)
            with session_ai_lock(session_id) as acquired2:
                self.assertFalse(acquired2)

    @patch.object(GeminiChallengeService, 'generate_challenge_batch')
    def test_batch_challenge_delivery_and_progression(self, mock_batch):
        """Verify batch generation of 5 questions, Q1 active, Q2-Q5 pending, and smooth progression."""
        mock_batch.return_value = [
            {
                'title': f'Scenario Challenge Q{i}',
                'statement': f'Statement for question {i}',
                'constraints_text': '- Type check',
                'target_concepts': ['Conditionals'],
                'starter_code': f'def solve_{i}(): pass',
                'hints': ['Check edge cases'],
                'examples': [{'input': '1', 'output': '2'}],
                'origin': 'AI_GENERATED',
                'ai_provider': 'google-gemini',
                'ai_model': 'gemini-3-flash-preview',
                'content_hash': f'hash_{i}',
            }
            for i in range(1, 6)
        ]

        session = PracticeSession.objects.create(
            user=self.user,
            language=self.language,
            practice_type=PracticeSession.PracticeType.TOPIC,
            selected_topic=self.topic,
            difficulty_mode=PracticeSession.DifficultyMode.EASY,
            practice_mode=PracticeSession.PracticeMode.CODING,
            requested_question_count=5,
            status=PracticeSession.Status.IN_PROGRESS
        )

        # 1. Delivery should trigger batch generation and return Q1 ACTIVE
        sc1, finished, msg = ChallengeDeliveryService.get_or_create_next_challenge(session)
        self.assertFalse(finished)
        self.assertEqual(sc1.question_order, 1)
        self.assertEqual(sc1.status, SessionChallenge.Status.ACTIVE)
        self.assertEqual(mock_batch.call_count, 1)

        # Total 5 questions created in this batch
        self.assertEqual(session.session_challenges.count(), 5)
        # Q2 to Q5 must be PENDING
        for order in [2, 3, 4, 5]:
            sc_pending = session.session_challenges.get(question_order=order)
            self.assertEqual(sc_pending.status, SessionChallenge.Status.PENDING)

        # 2. Repeated call should return exact same active challenge (idempotent, no extra AI call)
        sc1_repeat, _, _ = ChallengeDeliveryService.get_or_create_next_challenge(session)
        self.assertEqual(sc1.id, sc1_repeat.id)
        self.assertEqual(mock_batch.call_count, 1)

    @patch.object(GeminiChallengeService, 'generate_challenge_batch')
    def test_session_skip_advances_from_batch(self, mock_batch):
        """Verify skipping Q1 immediately activates Q2 from the generated set without calling AI again."""
        mock_batch.return_value = [
            {
                'title': f'Scenario Challenge Q{i}',
                'statement': f'Statement for question {i}',
                'constraints_text': '- Type check',
                'target_concepts': ['Conditionals'],
                'starter_code': f'def solve_{i}(): pass',
                'hints': ['Check edge cases'],
                'examples': [],
                'origin': 'AI_GENERATED',
                'ai_provider': 'google-gemini',
                'ai_model': 'gemini-3-flash-preview',
                'content_hash': f'hash_{i}',
            }
            for i in range(1, 3)
        ]

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

        # Deliver initial challenge (Q1)
        sc1, _, _ = ChallengeDeliveryService.get_or_create_next_challenge(session)
        self.assertEqual(sc1.question_order, 1)

        # Skip Q1 via API
        skip_url = reverse('practice:session-skip-challenge', kwargs={'id': session.id})
        skip_res = self.client.post(skip_url)
        self.assertEqual(skip_res.status_code, status.HTTP_200_OK)
        self.assertEqual(skip_res.data['question_order'], 2)
        # Should not call AI again because Q2 was already in the batch
        self.assertEqual(mock_batch.call_count, 1)

        # Skip Q2 -> Session should be finished
        final_skip = self.client.post(skip_url)
        self.assertEqual(final_skip.status_code, status.HTTP_200_OK)
        self.assertTrue(final_skip.data.get('session_finished'))

    @patch('apps.evaluation.services.evaluator.CodeEvaluationService._evaluate_with_gemini')
    def test_code_evaluation_live_flow(self, mock_gemini_eval):
        """Verify code submission endpoint, syntax validation, scoring, and status update."""
        mock_gemini_eval.return_value = {
            'score': 95,
            'summary': 'All scenario branches correctly implemented.',
            'feedback': 'Excellent edge case handling.',
            'syntax_issues': [],
            'logic_issues': [],
            'concepts_demonstrated': ['Branching', 'Boundary Checking'],
            'complexity': 'O(1) execution'
        }

        session = PracticeSession.objects.create(
            user=self.user,
            language=self.language,
            practice_type=PracticeSession.PracticeType.TOPIC,
            selected_topic=self.topic,
            difficulty_mode=PracticeSession.DifficultyMode.EASY,
            practice_mode=PracticeSession.PracticeMode.CODING,
            requested_question_count=1,
            status=PracticeSession.Status.IN_PROGRESS
        )
        challenge = Challenge.objects.create(
            language=self.language,
            primary_topic=self.topic,
            title='Voter Age Verification System',
            statement='Verify age >= 18 for voting.',
            starter_code='def check_voter(age):\n    pass\n',
            target_concepts=['Conditionals']
        )
        SessionChallenge.objects.create(
            session=session,
            challenge=challenge,
            question_order=1,
            status=SessionChallenge.Status.ACTIVE
        )

        submit_url = reverse('practice:session-submit', kwargs={'id': session.id})

        # 1. Unchanged boilerplate submit -> score 10
        bp_res = self.client.post(submit_url, {
            'challenge_id': str(challenge.id),
            'source_code': challenge.starter_code
        })
        self.assertEqual(bp_res.status_code, status.HTTP_200_OK)
        self.assertEqual(bp_res.data['score'], 10)
        self.assertFalse(bp_res.data['is_solved'])

        # 2. Syntax error submit -> score 20
        syn_res = self.client.post(submit_url, {
            'challenge_id': str(challenge.id),
            'source_code': 'def check_voter(age):\nif age > 18'
        })
        self.assertEqual(syn_res.status_code, status.HTTP_200_OK)
        self.assertEqual(syn_res.data['score'], 20)
        self.assertTrue(len(syn_res.data['syntax_issues']) > 0)

        # 3. Correct solution -> score 95, is_solved=True, session completed
        sol_code = """
def check_voter(age: int) -> str:
    if age < 0:
        return 'Invalid'
    return 'Eligible' if age >= 18 else 'Not eligible'
"""
        sol_res = self.client.post(submit_url, {
            'challenge_id': str(challenge.id),
            'source_code': sol_code
        })
        self.assertEqual(sol_res.status_code, status.HTTP_200_OK)
        self.assertEqual(sol_res.data['score'], 95)
        self.assertTrue(sol_res.data['is_solved'])
        self.assertTrue(sol_res.data['is_session_finished'])

        # Verify database update: SessionChallenge marked as SOLVED
        sc = SessionChallenge.objects.get(session=session, challenge=challenge)
        self.assertEqual(sc.status, SessionChallenge.Status.SOLVED)

    @patch.object(GeminiChallengeService, 'generate_challenge_batch')
    def test_offline_returns_internet_required_error(self, mock_batch):
        """Verify that when offline/unreachable, API returns 503 with INTERNET_REQUIRED."""
        mock_batch.side_effect = AIConnectionError("Active internet connection required.")

        session = PracticeSession.objects.create(
            user=self.user,
            language=self.language,
            practice_type=PracticeSession.PracticeType.TOPIC,
            selected_topic=self.topic,
            requested_question_count=5,
            status=PracticeSession.Status.IN_PROGRESS
        )

        url = reverse('practice:session-current-challenge', kwargs={'id': session.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data['error'], 'INTERNET_REQUIRED')
        self.assertIn('internet', response.data['detail'].lower())

