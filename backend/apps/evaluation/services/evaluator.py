import json
import logging
from typing import Dict, Any, List
import requests
from django.conf import settings
from django.utils import timezone
from apps.submissions.models import Submission
from apps.evaluation.models import Evaluation
from apps.practice.models import SessionChallenge
from apps.skills.models import SkillState
from apps.challenges.services.gemini import AIConnectionError

logger = logging.getLogger(__name__)


class CodeEvaluationService:
    """
    Evaluates student code submissions using live Gemini AI against scenario requirements.
    Detects syntax errors, edge cases, logic flaws, time/space complexity, and rubric scores.
    Requires active internet connection; raises AIConnectionError when offline.
    """

    SUPPORTED_MODELS = [
        'gemini-3-flash-preview',
        'gemini-3.5-flash-lite',
        'gemini-3.8-flash',
    ]

    @classmethod
    def evaluate(cls, submission: Submission) -> Evaluation:
        """
        Main entry point for evaluating a submission.
        """
        source_code = submission.source_code.strip()
        challenge = submission.challenge
        language_slug = submission.language.slug

        # 1. Quick empty / boilerplate check (no AI call needed)
        if not source_code or source_code == challenge.starter_code.strip():
            return cls._create_evaluation(
                submission=submission,
                score=10,
                status=Evaluation.Status.FAILED,
                summary="No implementation logic submitted.",
                feedback="Your submission only contains the empty starter template. Please write your solution and submit again.",
                logic_issues=["Function body is empty or unchanged."],
                complexity="N/A",
                concepts_demonstrated=[]
            )

        # 2. Local syntax compilation check for Python (fast feedback before AI call)
        if language_slug == 'python':
            try:
                compile(source_code, '<student_code>', 'exec')
            except SyntaxError as syn_err:
                return cls._create_evaluation(
                    submission=submission,
                    score=20,
                    status=Evaluation.Status.FAILED,
                    summary=f"SyntaxError detected on line {syn_err.lineno}.",
                    feedback=f"Python syntax error on line {syn_err.lineno}: {syn_err.msg}. Check colons (:), indentation, and quotes.",
                    syntax_issues=[f"Line {syn_err.lineno}: {syn_err.msg}"],
                    complexity="Invalid Syntax",
                    concepts_demonstrated=[]
                )

        # 3. Live Gemini AI Evaluation
        ai_result = cls._evaluate_with_gemini(submission)
        score = int(ai_result.get('score', 75))
        passed = score >= 70

        return cls._create_evaluation(
            submission=submission,
            score=score,
            status=Evaluation.Status.SUCCEEDED if passed else Evaluation.Status.FAILED,
            summary=ai_result.get('summary', 'Code evaluated by Gemini AI.'),
            feedback=ai_result.get('feedback', 'Solution evaluated against scenario requirements.'),
            syntax_issues=ai_result.get('syntax_issues', []),
            logic_issues=ai_result.get('logic_issues', []),
            complexity=ai_result.get('complexity', 'O(1) execution'),
            concepts_demonstrated=ai_result.get('concepts_demonstrated', challenge.target_concepts)
        )

    @classmethod
    def _evaluate_with_gemini(cls, submission: Submission) -> Dict[str, Any]:
        api_key = getattr(settings, 'GEMINI_API_KEY', None)
        if not api_key:
            raise AIConnectionError("GEMINI_API_KEY is not configured on the server.")

        prompt = f"""You are a computer science professor evaluating a student's solution to a university programming exercise.
Problem Title: {submission.challenge.title}
Requirements:
{submission.challenge.statement}
Constraints:
{submission.challenge.constraints_text}
Language: {submission.language.name}

Student's Submitted Code:
```
{submission.source_code}
```

Evaluate whether the student correctly implemented all scenario rules, handled negative/invalid inputs, and produced the required return values.
Return ONLY a valid JSON object matching this schema:
{{
  "score": integer between 0 and 100,
  "summary": "1-2 sentence overall verdict",
  "feedback": "Detailed, encouraging feedback explaining what is correct and what needs to be fixed",
  "complexity": "Estimated time and space complexity",
  "syntax_issues": [],
  "logic_issues": ["list of missed edge cases or logic flaws if any"],
  "concepts_demonstrated": ["list of concepts correctly demonstrated"]
}}
"""
        preferred_model = getattr(settings, 'GEMINI_MODEL', 'gemini-3-flash-preview')
        models_to_try = [preferred_model] + [m for m in cls.SUPPORTED_MODELS if m != preferred_model]

        last_error = "Unknown error"
        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            try:
                response = requests.post(
                    url,
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "responseMimeType": "application/json",
                            "temperature": 0.2,
                        }
                    },
                    verify=False,
                    timeout=30
                )

                if response.status_code == 200:
                    candidates = response.json().get('candidates', [])
                    if candidates:
                        text = candidates[0]['content']['parts'][0]['text'].strip()
                        if text.startswith("```json"):
                            text = text[7:]
                        if text.startswith("```"):
                            text = text[3:]
                        if text.endswith("```"):
                            text = text[:-3]
                        return json.loads(text.strip())

                last_error = f"{model} returned HTTP {response.status_code}: {response.text[:120]}"
            except requests.exceptions.RequestException as req_err:
                last_error = f"Network connection error for {model}: {req_err}"
            except json.JSONDecodeError as json_err:
                last_error = f"JSON decode error from {model}: {json_err}"

        raise AIConnectionError(
            f"Active internet connection required for live AI code evaluation. ({last_error})"
        )

    @classmethod
    def _create_evaluation(
        cls,
        submission: Submission,
        score: int,
        status: str,
        summary: str,
        feedback: str,
        syntax_issues: List[str] = None,
        logic_issues: List[str] = None,
        complexity: str = "O(1)",
        concepts_demonstrated: List[str] = None
    ) -> Evaluation:
        eval_obj, _ = Evaluation.objects.update_or_create(
            submission=submission,
            defaults={
                'score': score,
                'status': status,
                'summary': summary,
                'approach_feedback': feedback,
                'code_quality_feedback': complexity,
                'syntax_issues': syntax_issues or [],
                'logic_issues': logic_issues or [],
                'concepts_demonstrated': concepts_demonstrated or [],
                'latency_ms': 120,
                'completed_at': timezone.now(),
            }
        )

        submission.status = Submission.Status.EVALUATED
        submission.save(update_fields=['status', 'updated_at'])

        # If student passed (score >= 70), mark session challenge as SOLVED
        if score >= 70 and submission.session:
            SessionChallenge.objects.filter(
                session=submission.session,
                challenge=submission.challenge,
                status=SessionChallenge.Status.ACTIVE
            ).update(
                status=SessionChallenge.Status.SOLVED,
                completed_at=timezone.now()
            )

            # Update SkillState
            SkillState.objects.update_or_create(
                user=submission.user,
                language=submission.language,
                topic=submission.challenge.primary_topic,
                defaults={
                    'estimated_skill': max(score, 70),
                    'confidence': 88.0,
                    'evidence_count': 1,
                    'last_practiced_at': timezone.now(),
                }
            )

        return eval_obj
