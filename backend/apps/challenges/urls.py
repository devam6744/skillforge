from django.urls import path
from apps.challenges.views import ChallengeDetailView

app_name = 'challenges'

urlpatterns = [
    path('<uuid:id>/', ChallengeDetailView.as_view(), name='challenge-detail'),
]
