import os
from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.apps import apps

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'is_email_verified', 'date_joined', 'profile']
        read_only_fields = ['id', 'email', 'is_email_verified', 'date_joined', 'profile']

    def get_profile(self, obj):
        profile = getattr(obj, 'profile', None)
        if profile:
            return {
                'display_name': profile.display_name,
                'username': profile.username,
                'bio': profile.bio,
                'initial_skill_level': profile.initial_skill_level,
                'onboarding_completed': profile.onboarding_completed,
            }
        return None


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    display_name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        if User.objects.filter(email=normalized_email).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return normalized_email

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})

        # Validate password strength with Django built-in validators
        try:
            validate_password(attrs['password'])
        except DjangoValidationError as err:
            raise serializers.ValidationError({"password": list(err.messages)})

        return attrs

    def create(self, validated_data):
        email = validated_data['email']
        password = validated_data['password']
        display_name = validated_data.get('display_name', '').strip() or email.split('@')[0]

        user = User.objects.create_user(email=email, password=password)
        # Create or update linked user profile
        UserProfile = apps.get_model('users', 'UserProfile')
        UserProfile.objects.get_or_create(
            user=user,
            defaults={'display_name': display_name}
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password')

        user = authenticate(request=self.context.get('request'), email=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")

        attrs['user'] = user
        return attrs


class GoogleAuthSerializer(serializers.Serializer):
    credential = serializers.CharField(help_text="Google ID token (credential)")

    def validate_credential(self, token):
        import sys
        # In test environments or when explicitly configured for mock
        if ('test' in sys.argv or os.getenv('DJANGO_TESTING') == '1') and token.startswith('mock_token_'):
            mock_email = token.replace('mock_token_', '') + '@gmail.com'
            return {
                'email': mock_email,
                'name': 'Test Google User',
                'sub': 'google_test_12345',
                'email_verified': True
            }

        client_id = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests

            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                client_id,
                clock_skew_in_seconds=10
            )

            if not idinfo.get('email_verified', False):
                raise serializers.ValidationError("Google account email is not verified.")

            return {
                'email': idinfo.get('email').strip().lower(),
                'name': idinfo.get('name', ''),
                'sub': idinfo.get('sub'),
                'email_verified': True
            }
        except Exception as e:
            raise serializers.ValidationError(f"Invalid Google ID token: {str(e)}")
