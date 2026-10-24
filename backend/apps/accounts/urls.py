from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    GoogleAuthView,
    LogoutView,
    MeView,
    CSRFTokenView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('google/', GoogleAuthView.as_view(), name='auth-google'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('csrf/', CSRFTokenView.as_view(), name='auth-csrf'),
]
