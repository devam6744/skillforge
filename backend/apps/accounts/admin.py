from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'is_active', 'is_staff', 'is_email_verified', 'date_joined')
    search_fields = ('email',)
    list_filter = ('is_active', 'is_staff', 'is_email_verified')
    ordering = ('-date_joined',)
