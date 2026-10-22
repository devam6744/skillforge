from django.contrib import admin
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'display_name', 'username', 'initial_skill_level', 'onboarding_completed', 'created_at')
    search_fields = ('display_name', 'username', 'user__email')
    list_filter = ('initial_skill_level', 'onboarding_completed')
