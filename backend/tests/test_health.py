from rest_framework.test import APITestCase
from rest_framework import status


class HealthCheckTests(APITestCase):
    def test_health_check_endpoint(self):
        """Verify the health check endpoint returns status 200 and reports healthy database."""
        response = self.client.get('/api/v1/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data.get('status'), 'healthy')
        self.assertEqual(data.get('service'), 'SkillForge API')
        self.assertEqual(data.get('version'), 'v1')
        self.assertEqual(data.get('database'), 'healthy')
