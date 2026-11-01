from rest_framework import serializers
from apps.challenges.models import Challenge
from apps.practice.models import SessionChallenge


class ChallengeDetailSerializer(serializers.ModelSerializer):
    language_name = serializers.CharField(source='language.name', read_only=True)
    language_slug = serializers.CharField(source='language.slug', read_only=True)
    topic_name = serializers.CharField(source='primary_topic.name', read_only=True)
    topic_slug = serializers.CharField(source='primary_topic.slug', read_only=True)
    hints = serializers.JSONField(source='hints_json', read_only=True)

    class Meta:
        model = Challenge
        fields = [
            'id',
            'title',
            'statement',
            'constraints_text',
            'examples',
            'difficulty',
            'practice_mode',
            'target_concepts',
            'starter_code',
            'hints',
            'language_name',
            'language_slug',
            'topic_name',
            'topic_slug',
            'origin',
            'quality_status',
            'created_at',
        ]
        read_only_fields = fields


class SessionChallengeSerializer(serializers.ModelSerializer):
    challenge = ChallengeDetailSerializer(read_only=True)
    total_questions = serializers.IntegerField(source='session.requested_question_count', read_only=True)
    is_last_question = serializers.SerializerMethodField()

    class Meta:
        model = SessionChallenge
        fields = [
            'id',
            'question_order',
            'total_questions',
            'status',
            'is_last_question',
            'challenge',
            'started_at',
            'completed_at',
        ]
        read_only_fields = fields

    def get_is_last_question(self, obj) -> bool:
        return obj.question_order >= obj.session.requested_question_count
