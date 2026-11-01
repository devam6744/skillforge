import hashlib
from django.core.management.base import BaseCommand
from apps.catalog.models import ProgrammingLanguage, Topic
from apps.challenges.models import Challenge
from apps.challenges.services.curated_templates import CURATED_CHALLENGES


class Command(BaseCommand):
    help = 'Seeds curated real-world university-level foundational challenges into Supabase DB'

    def handle(self, *args, **options):
        self.stdout.write("Seeding curated university foundational challenges...")

        seeded_count = 0
        updated_count = 0

        for item in CURATED_CHALLENGES:
            lang_slug = item['language_slug']
            topic_slug = item['topic_slug']

            try:
                language = ProgrammingLanguage.objects.get(slug=lang_slug)
            except ProgrammingLanguage.DoesNotExist:
                self.stderr.write(f"Language not found: {lang_slug}")
                continue

            try:
                topic = Topic.objects.get(language=language, slug=topic_slug)
            except Topic.DoesNotExist:
                # If specific slug doesn't match exactly, fallback to first topic of language
                topic = Topic.objects.filter(language=language).first()
                if not topic:
                    self.stderr.write(f"No topics found for language: {lang_slug}")
                    continue

            # Compute content hash for deduplication
            raw_hash_input = f"{item['statement'].strip()}:{item['starter_code'].strip()}"
            content_hash = hashlib.sha256(raw_hash_input.encode('utf-8')).hexdigest()

            challenge, created = Challenge.objects.update_or_create(
                language=language,
                title=item['title'],
                defaults={
                    'primary_topic': topic,
                    'statement': item['statement'],
                    'constraints_text': item.get('constraints_text', ''),
                    'examples': item.get('examples', []),
                    'difficulty': item.get('difficulty', 'EASY'),
                    'practice_mode': item.get('practice_mode', 'CODING'),
                    'target_concepts': item.get('target_concepts', []),
                    'starter_code': item.get('starter_code', ''),
                    'hints_json': item.get('hints', []),
                    'origin': 'CURATED',
                    'quality_status': Challenge.QualityStatus.VALID,
                    'content_hash': content_hash,
                    'ai_provider': 'curated-foundation',
                    'ai_model': 'scenario-v1.0'
                }
            )

            if created:
                seeded_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully processed challenges: {seeded_count} created, {updated_count} updated. "
                f"Total valid challenges in pool: {Challenge.objects.count()}."
            )
        )
