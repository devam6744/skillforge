from django.urls import path
from apps.catalog.views import LanguageListView, TopicListView

app_name = 'catalog'

urlpatterns = [
    path('languages/', LanguageListView.as_view(), name='language-list'),
    path('languages/<slug:slug>/topics/', TopicListView.as_view(), name='topic-list'),
]

