import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url

# Base directory: backend/
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from root .env or backend .env
load_dotenv(BASE_DIR.parent / '.env')
load_dotenv(BASE_DIR / '.env')

# Security settings
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'skillforge-dev-insecure-secret-key-change-in-production')
DEBUG = os.getenv('DJANGO_DEBUG', 'True').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1,testserver').split(',')
    if host.strip()
]

# Application definition
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'corsheaders',
]

LOCAL_APPS = [
    'apps.accounts',
    'apps.users',
    'apps.catalog',
    'apps.practice',
    'apps.challenges',
    'apps.submissions',
    'apps.evaluation',
    'apps.skills',
    'apps.adaptive',
    'apps.hints',
    'apps.analytics',
    'apps.audit',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# Database configuration (Supabase Managed PostgreSQL)
def get_database_config():
    import sys
    # Use isolated SQLite for fast local and CI tests
    if 'test' in sys.argv or os.getenv('DJANGO_TESTING') == '1':
        return {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }

    # 1. Direct DATABASE_URL
    database_url = os.getenv('DATABASE_URL')
    
    # 2. Or construct from Supabase credentials if provided
    if not database_url:
        sb_pwd = os.getenv('supabase_password') or os.getenv('SUPABASE_PASSWORD')
        if sb_pwd:
            sb_host = os.getenv('SUPABASE_HOST', 'db.zmdsholoifaihtjrliez.supabase.co')
            sb_user = os.getenv('SUPABASE_USER', 'postgres')
            sb_port = os.getenv('SUPABASE_PORT', '5432')
            sb_db = os.getenv('SUPABASE_DB', 'postgres')
            database_url = f"postgresql://{sb_user}:{sb_pwd}@{sb_host}:{sb_port}/{sb_db}"
            
    if database_url:
        return dj_database_url.parse(database_url, conn_max_age=600)
    
    # Fallback to SQLite for development/testing if no database URL is set
    return {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }

DATABASES = {
    'default': get_database_config()
}

# Custom User Model (Blueprint Section 5.1 & Phase 1)
AUTH_USER_MODEL = 'accounts.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# CORS & CSRF configuration
FRONTEND_ORIGIN = os.getenv('FRONTEND_ORIGIN', 'http://localhost:5173')
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in FRONTEND_ORIGIN.split(',')
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv('CSRF_TRUSTED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',')
    if origin.strip()
]

# AI Service Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY') or os.getenv('gemini_api')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')
