from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.db import connection


def health_check(request):
    """
    Health check endpoint verifying application & database connectivity.
    Returns 200 if database responds, 503 if database check fails.
    """
    db_status = "healthy"
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            cursor.fetchone()
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
        return JsonResponse({
            "status": "degraded",
            "database": db_status
        }, status=503)

    return JsonResponse({
        "status": "healthy",
        "service": "SkillForge API",
        "version": "v1",
        "database": db_status
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/health/', health_check, name='api-health'),
]
