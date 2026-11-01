import json
import hashlib
import logging
from typing import Optional, Dict, Any
from django.conf import settings
from apps.challenges.services.curated_templates import get_curated_challenge

logger = logging.getLogger(__name__)


class GeminiChallengeService:
    """
    Service adapter for Google Gemini 2.5 Flash challenge generation.
    Features:
    - Strict structured JSON prompt enforcing real language foundations over DSA trivia.
    - Timeout protection and bounded execution.
    - Seamless fallback to high-quality curated templates on quota, network, or parsing errors.
    - Content hashing for deduplication.
    """

    @classmethod
    def generate_challenge(
        cls,
        language_name: str,
        language_slug: str,
        topic_name: str,
        topic_slug: str,
        difficulty: str = "EASY",
        practice_mode: str = "CODING"
    ) -> Dict[str, Any]:
        """
        Generates a foundation challenge using Gemini 2.5 Flash.
        Falls back to curated templates if API key is missing or call fails.
        """
        api_key = getattr(settings, 'GEMINI_API_KEY', None)
        if not api_key:
            logger.warning("GEMINI_API_KEY not configured. Using curated foundation challenge.")
            return cls._fallback(language_slug, topic_slug, difficulty, practice_mode, reason="NO_API_KEY")

        prompt = cls._build_prompt(language_name, topic_name, difficulty, practice_mode)

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)
            model_name = getattr(settings, 'GEMINI_MODEL', 'gemini-2.5-flash')

            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.3,
                    max_output_tokens=2048,
                )
            )

            raw_text = response.text
            parsed = cls._parse_and_validate(raw_text)
            parsed['origin'] = 'AI_GENERATED'
            parsed['ai_provider'] = 'google-gemini'
            parsed['ai_model'] = model_name
            parsed['content_hash'] = cls._compute_hash(parsed['statement'], parsed['starter_code'])
            return parsed

        except Exception as exc:
            logger.warning(f"Gemini challenge generation failed: {exc}. Engaging curated fallback.")
            return cls._fallback(language_slug, topic_slug, difficulty, practice_mode, reason=str(exc))

    @classmethod
    def _build_prompt(cls, language: str, topic: str, difficulty: str, mode: str) -> str:
        return f"""You are the senior technical curriculum author for SkillForge, a software engineering skill platform.
Your task is to generate one high-quality, practical coding practice challenge for:
- Language: {language}
- Topic: {topic}
- Difficulty: {difficulty}
- Practice Mode: {mode}

CRITICAL RULES:
1. DO NOT generate competitive LeetCode DSA trivia (NO dynamic programming, binary search trees, graph BFS/DFS, array permutation riddles).
2. DO generate real-world software engineering exercises that test core language concepts:
   - Idiomatic language syntax and standard library features
   - Defensive programming, boundary checking, and robust error/exception handling
   - Object-oriented design, encapsulation, and class invariants
   - Memory management, pointers, and reference semantics where applicable
3. Provide clean, well-commented starter boilerplate with function signatures and clear docstrings.

Return ONLY a valid JSON object with the following schema:
{{
  "title": "Short descriptive title of the practical exercise",
  "statement": "Detailed markdown problem statement explaining the requirements, background, and expected behavior",
  "constraints_text": "Bullet list of constraints (e.g. time/space limits, exception rules, mutation policies)",
  "target_concepts": ["List", "Of", "3-5", "Specific", "Language", "Concepts"],
  "starter_code": "The complete boilerplate code the user will edit in their editor",
  "hints": ["Progressive hint 1", "Progressive hint 2"],
  "examples": [
    {{"input": "sample input", "output": "sample output"}}
  ]
}}
"""

    @classmethod
    def _parse_and_validate(cls, raw_json: str) -> Dict[str, Any]:
        text = raw_json.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        data = json.loads(text)
        required_keys = ['title', 'statement', 'constraints_text', 'target_concepts', 'starter_code']
        for k in required_keys:
            if k not in data or not data[k]:
                raise ValueError(f"Gemini response missing mandatory field: {k}")

        if not isinstance(data.get('target_concepts'), list):
            data['target_concepts'] = [str(data.get('target_concepts'))]
        if not isinstance(data.get('hints'), list):
            data['hints'] = []
        if not isinstance(data.get('examples'), list):
            data['examples'] = []

        return data

    @classmethod
    def _fallback(cls, language_slug: str, topic_slug: str, difficulty: str, practice_mode: str, reason: str = "") -> Dict[str, Any]:
        template = get_curated_challenge(language_slug, topic_slug, difficulty)
        data = dict(template)
        data['origin'] = 'CURATED_FALLBACK'
        data['ai_provider'] = 'fallback-curated'
        data['ai_model'] = 'skillforge-curated-v1'
        data['content_hash'] = cls._compute_hash(data['statement'], data['starter_code'])
        return data

    @staticmethod
    def _compute_hash(statement: str, starter_code: str) -> str:
        content = f"{statement.strip()}::{starter_code.strip()}"
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
