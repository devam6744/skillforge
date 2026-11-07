import os
import sys
from pathlib import Path

# Add backend directory to sys.path so Django config and apps are found
BACKEND_DIR = Path(__file__).resolve().parent.parent / 'backend'
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.core.wsgi import get_wsgi_application

# Vercel WSGI entrypoint
app = get_wsgi_application()
