import os
import sys
import traceback
import json
from pathlib import Path

# Add backend directory to sys.path so Django config and apps are found
BACKEND_DIR = Path(__file__).resolve().parent.parent / 'backend'
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

django_app = None
init_error = None

try:
    from django.core.wsgi import get_wsgi_application
    django_app = get_wsgi_application()
except Exception as e:
    init_error = traceback.format_exc()

def app(environ, start_response):
    if init_error:
        status = '500 Internal Server Error'
        response_headers = [
            ('Content-Type', 'application/json'),
            ('Access-Control-Allow-Origin', '*')
        ]
        start_response(status, response_headers)
        return [json.dumps({"error": "DJANGO_INIT_ERROR", "traceback": init_error}).encode('utf-8')]
    return django_app(environ, start_response)
