from django.urls import path
from apps.challenges.views import ChallengeDetailView, ChallengeSubmitView

app_name = 'challenges'

urlpatterns = [
    path('submit/', ChallengeSubmitView.as_view(), name='challenge-submit-direct'),
    path('<uuid:id>/submit/', ChallengeSubmitView.as_view(), name='challenge-submit'),
    path('<uuid:id>/', ChallengeDetailView.as_view(), name='challenge-detail'),
]
