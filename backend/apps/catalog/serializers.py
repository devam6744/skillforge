from rest_framework import serializers
from apps.catalog.models import ProgrammingLanguage, Topic


class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ['id', 'slug', 'name', 'description', 'sort_order']


class ProgrammingLanguageSerializer(serializers.ModelSerializer):
    topics = serializers.SerializerMethodField()

    class Meta:
        model = ProgrammingLanguage
        fields = ['id', 'slug', 'name', 'sort_order', 'topics']

    def get_topics(self, obj):
        active_topics = obj.topics.filter(is_active=True).order_by('sort_order', 'name')
        return TopicSerializer(active_topics, many=True).data

