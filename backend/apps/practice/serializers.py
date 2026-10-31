from django.utils import timezone
from rest_framework import serializers
from apps.catalog.models import ProgrammingLanguage, Topic
from apps.practice.models import PracticeSession


class PracticeSessionCreateSerializer(serializers.ModelSerializer):
    language_slug = serializers.SlugRelatedField(
        slug_field='slug',
        queryset=ProgrammingLanguage.objects.filter(is_active=True),
        source='language'
    )
    topic_slug = serializers.CharField(required=False, allow_null=True, write_only=True)
    requested_question_count = serializers.IntegerField(default=5, min_value=1, max_value=20)

    class Meta:
        model = PracticeSession
        fields = [
            'language_slug',
            'topic_slug',
            'practice_type',
            'difficulty_mode',
            'practice_mode',
            'requested_question_count'
        ]

    def validate(self, attrs):
        language = attrs.get('language')
        practice_type = attrs.get('practice_type', PracticeSession.PracticeType.TOPIC)
        topic_slug = attrs.get('topic_slug')

        if practice_type == PracticeSession.PracticeType.TOPIC:
            if not topic_slug:
                raise serializers.ValidationError({
                    'topic_slug': 'Topic is required when practice_type is TOPIC.'
                })
            try:
                topic = Topic.objects.get(language=language, slug=topic_slug, is_active=True)
                attrs['selected_topic'] = topic
            except Topic.DoesNotExist:
                raise serializers.ValidationError({
                    'topic_slug': f"Topic '{topic_slug}' does not exist for language '{language.name}'."
                })
        else:
            attrs['selected_topic'] = None

        return attrs

    def create(self, validated_data):
        validated_data.pop('topic_slug', None)
        validated_data['user'] = self.context['request'].user
        validated_data['status'] = PracticeSession.Status.IN_PROGRESS
        validated_data['started_at'] = timezone.now()
        return super().create(validated_data)


class PracticeSessionDetailSerializer(serializers.ModelSerializer):
    language_name = serializers.CharField(source='language.name', read_only=True)
    language_slug = serializers.CharField(source='language.slug', read_only=True)
    topic_name = serializers.CharField(source='selected_topic.name', read_only=True, default=None)
    topic_slug = serializers.CharField(source='selected_topic.slug', read_only=True, default=None)

    class Meta:
        model = PracticeSession
        fields = [
            'id',
            'language_name',
            'language_slug',
            'practice_type',
            'topic_name',
            'topic_slug',
            'difficulty_mode',
            'practice_mode',
            'requested_question_count',
            'status',
            'started_at',
            'completed_at',
            'created_at',
            'updated_at'
        ]
        read_only_fields = fields

