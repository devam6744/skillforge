from django.urls import path
from apps.practice.views import (
    SessionListCreateView,
    SessionDetailView,
    SessionAbandonView,
    SessionCompleteView,
    ActiveSessionView,
    SessionCurrentChallengeView,
    SessionNextChallengeView,
    SessionSkipChallengeView,
    SessionSubmitView,
)

app_name = 'practice'

urlpatterns = [
    path('sessions/', SessionListCreateView.as_view(), name='session-list-create'),
    path('sessions/active/', ActiveSessionView.as_view(), name='session-active'),
    path('sessions/<uuid:id>/', SessionDetailView.as_view(), name='session-detail'),
    path('sessions/<uuid:id>/abandon/', SessionAbandonView.as_view(), name='session-abandon'),
    path('sessions/<uuid:id>/complete/', SessionCompleteView.as_view(), name='session-complete'),
    path('sessions/<uuid:id>/current-challenge/', SessionCurrentChallengeView.as_view(), name='session-current-challenge'),
    path('sessions/<uuid:id>/next-challenge/', SessionNextChallengeView.as_view(), name='session-next-challenge'),
    path('sessions/<uuid:id>/skip-challenge/', SessionSkipChallengeView.as_view(), name='session-skip-challenge'),
    path('sessions/<uuid:id>/submit/', SessionSubmitView.as_view(), name='session-submit'),
]

