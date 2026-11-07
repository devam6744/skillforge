import json
import time
import random
import hashlib
import logging
from typing import List, Dict, Any
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class AIConnectionError(Exception):
    """Raised when Gemini AI service is unreachable (network down or offline)."""
    pass


class GeminiChallengeService:
    """
    Direct Gemini AI service adapter for dynamic challenge generation.
    - Generates sets of real-world scenario questions in batches (e.g. 5 questions at once).
    - Uses supported Gemini 3.0+ models (gemini-3-flash-preview, gemini-3.5-flash-lite, gemini-3.8-flash).
    - Requires active internet connection; raises AIConnectionError when offline.
    """

    SUPPORTED_MODELS = [
        'gemini-3-flash-preview',
        'gemini-3.5-flash-lite',
        'gemini-3.8-flash',
    ]

    @classmethod
    def _call_gemini_json(cls, prompt: str, temperature: float = 0.3, timeout: int = 35) -> tuple[Any, str]:
        """
        Executes a generateContent request to Gemini API and parses the JSON response.
        Tries primary configured model, then falls back to other supported models.
        """
        api_key = getattr(settings, 'GEMINI_API_KEY', None)
        if not api_key:
            raise AIConnectionError("GEMINI_API_KEY is not configured on the server.")

        preferred_model = getattr(settings, 'GEMINI_MODEL', 'gemini-3-flash-preview')
        models_to_try = [preferred_model] + [m for m in cls.SUPPORTED_MODELS if m != preferred_model]

        last_error = "Unknown error"
        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            # Retry loop with exponential backoff on burst rate limits (HTTP 429 / 503)
            for attempt in range(2):
                try:
                    response = requests.post(
                        url,
                        json={
                            "contents": [{"parts": [{"text": prompt}]}],
                            "generationConfig": {
                                "responseMimeType": "application/json",
                                "temperature": temperature,
                            }
                        },
                        verify=False,
                        timeout=timeout
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
                            return json.loads(text.strip()), model

                    if response.status_code in (429, 503):
                        backoff = 1.0 * (1.8 ** attempt) + random.uniform(0.1, 0.4)
                        logger.warning(
                            f"Gemini {model} burst rate-limited (HTTP {response.status_code}). Backing off for {backoff:.2f}s..."
                        )
                        time.sleep(backoff)
                        continue

                    last_error = f"{model} returned HTTP {response.status_code}: {response.text[:120]}"
                    break
                except requests.exceptions.RequestException as req_err:
                    last_error = f"Network connection error for {model}: {req_err}"
                    break
                except json.JSONDecodeError as json_err:
                    last_error = f"JSON decode error from {model}: {json_err}"
                    break

        raise AIConnectionError(
            f"Active internet connection required for live AI challenge generation. ({last_error})"
        )

    @classmethod
    def generate_challenge_batch(
        cls,
        language_name: str,
        language_slug: str,
        topic_name: str,
        topic_slug: str,
        difficulty: str = "EASY",
        practice_mode: str = "CODING",
        count: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Generates a batch of distinct, university-level scenario programming questions in ONE AI call.
        """
        prompt = f"""You are the senior technical curriculum author for SkillForge.
Generate a set of {count} distinct, university-level practical coding challenges based on real-world scenarios for:
- Language: {language_name}
- Topic: {topic_name}
- Difficulty: {difficulty}
- Practice Mode: {practice_mode}

CRITICAL RULES:
1. NO competitive LeetCode DSA trivia (NO dynamic programming matrices, graph traversals, binary search trees, array permutation riddles).
2. ONLY real-world university-level scenario programming exercises (e.g. cinema concessions, voter eligibility, shopping cart totals, ATM cash withdrawal with balance checks, student grade GPA tracker, speed radar fines, library late fees, electricity slabs).
3. CRITICAL STARTER CODE RULE: "starter_code" MUST ONLY contain the clean function/class signature, parameters, docstring, and a "pass" or "// TODO: Write your logic here" comment. NEVER LEAK THE SOLUTION CODE in starter_code!
4. Clear requirements, boundary conditions (handle negative/zero values), and expected return values.

Return ONLY a valid JSON ARRAY of {count} objects matching this exact schema:
[
  {{
    "title": "Short descriptive title of the practical scenario",
    "statement": "Detailed markdown problem statement explaining the scenario requirements, input parameters, and expected return values",
    "constraints_text": "Bullet list of constraints (e.g. types, boundary rules, return types)",
    "target_concepts": ["List", "Of", "3-5", "Specific", "Concepts"],
    "starter_code": "The empty boilerplate skeleton with pass or // TODO comment (NO SOLUTION CODE)",
    "hints": ["Progressive hint 1", "Progressive hint 2"],
    "examples": [
      {{"input": "sample input", "output": "sample output"}}
    ]
  }}
]
"""
        data, model_used = cls._call_gemini_json(prompt, temperature=0.3, timeout=35)
        if isinstance(data, dict) and "challenges" in data:
            data = data["challenges"]
        elif isinstance(data, dict) and "questions" in data:
            data = data["questions"]
        if not isinstance(data, list):
            data = [data]

        valid_challenges = []
        for item in data[:count]:
            if not isinstance(item, dict):
                continue
            title = item.get('title', f"{language_name} Scenario Exercise")
            statement = item.get('statement', '')
            starter_code = item.get('starter_code', '')
            if not statement or not starter_code:
                continue

            content_hash = cls._compute_hash(statement, starter_code)
            valid_challenges.append({
                'title': title,
                'statement': statement,
                'constraints_text': item.get('constraints_text', ''),
                'target_concepts': item.get('target_concepts', [topic_name]),
                'starter_code': starter_code,
                'hints': item.get('hints', []),
                'examples': item.get('examples', []),
                'origin': 'AI_GENERATED',
                'ai_provider': 'google-gemini',
                'ai_model': model_used,
                'content_hash': content_hash,
            })

        if not valid_challenges:
            raise AIConnectionError("AI generated an empty challenge set. Please try again.")

        return valid_challenges

    @classmethod
    def generate_single_challenge(
        cls,
        language_name: str,
        language_slug: str,
        topic_name: str,
        topic_slug: str,
        difficulty: str = "EASY",
        practice_mode: str = "CODING"
    ) -> Dict[str, Any]:
        """
        Generates a single scenario challenge via Gemini.
        """
        batch = cls.generate_challenge_batch(
            language_name=language_name,
            language_slug=language_slug,
            topic_name=topic_name,
            topic_slug=topic_slug,
            difficulty=difficulty,
            practice_mode=practice_mode,
            count=1
        )
        return batch[0]

    @staticmethod
    def _compute_hash(statement: str, starter_code: str) -> str:
        content = f"{statement.strip()}::{starter_code.strip()}"
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
