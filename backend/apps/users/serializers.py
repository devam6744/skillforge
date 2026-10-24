from rest_framework import serializers
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id',
            'email',
            'display_name',
            'username',
            'bio',
            'initial_skill_level',
            'onboarding_completed',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'email', 'created_at', 'updated_at']

    def validate_username(self, value):
        if value:
            value = value.strip().lower()
            current_profile = self.instance
            query = UserProfile.objects.filter(username=value)
            if current_profile:
                query = query.exclude(id=current_profile.id)
            if query.exists():
                raise serializers.ValidationError("This username is already taken.")
        return value
