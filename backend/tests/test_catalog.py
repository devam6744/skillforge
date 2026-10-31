from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.catalog.models import ProgrammingLanguage, Topic


class CatalogApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.python = ProgrammingLanguage.objects.create(
            name="Python",
            slug="python",
            sort_order=1,
            is_active=True
        )
        self.cpp = ProgrammingLanguage.objects.create(
            name="C++",
            slug="cpp",
            sort_order=2,
            is_active=True
        )
        self.inactive_lang = ProgrammingLanguage.objects.create(
            name="Rust",
            slug="rust",
            sort_order=99,
            is_active=False
        )
        self.topic1 = Topic.objects.create(
            language=self.python,
            name="Arrays & Hash Maps",
            slug="arrays-hash-maps",
            sort_order=1,
            is_active=True
        )
        self.topic2 = Topic.objects.create(
            language=self.python,
            name="Pointers & Linked Lists",
            slug="pointers-linked-lists",
            sort_order=2,
            is_active=True
        )

    def test_list_languages(self):
        url = reverse('catalog:language-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = [item['slug'] for item in response.data]
        self.assertIn('python', slugs)
        self.assertIn('cpp', slugs)
        self.assertNotIn('rust', slugs)  # Inactive should be excluded

        # Verify nested topics
        python_item = next(item for item in response.data if item['slug'] == 'python')
        self.assertEqual(len(python_item['topics']), 2)

    def test_list_topics_by_language(self):
        url = reverse('catalog:topic-list', kwargs={'slug': 'python'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['slug'], 'arrays-hash-maps')

    def test_list_topics_invalid_language_returns_404(self):
        url = reverse('catalog:topic-list', kwargs={'slug': 'nonexistent'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

