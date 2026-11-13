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
# Auto-support common PaaS cloud deployment domains
if '*' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.extend(['.railway.app', '.onrender.com', '.vercel.app', '.herokuapp.com'])

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
    'whitenoise.middleware.WhiteNoiseMiddleware',
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
    db_path = BASE_DIR / 'db.sqlite3'
    if os.getenv('VERCEL') or os.getenv('AWS_LAMBDA_FUNCTION_NAME'):
        db_path = Path('/tmp') / 'db.sqlite3'
    return {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': db_path,
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
try:
    STATIC_ROOT.mkdir(parents=True, exist_ok=True)
except OSError:
    pass

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Cache configuration for AI rate limiting, mutex locks and challenge pool
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'skillforge-cache',
    }
}

# Reverse Proxy & Cloud Host Security Settings
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True

# Session & Cookie Lifespan (Multi-device concurrent sessions supported, 30 days)
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 60 * 60 * 24 * 30  # 30 days persistent multi-device session
SESSION_SAVE_EVERY_REQUEST = False
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

# Email Configuration (SMTP for Password Reset & Verification OTPs)
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() in ('true', '1', 't')
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER') or os.getenv('email_user', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD') or os.getenv('email_password', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL') or (f"SkillForge Team <{EMAIL_HOST_USER}>" if EMAIL_HOST_USER else "noreply@skillforge.io")
EMAIL_TIMEOUT = 10

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
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
    r"^http://localhost:\d+$",
    r"^http://127\.0\.0\.1:\d+$",
]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv('CSRF_TRUSTED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',')
    if origin.strip()
]
# Auto-trust Vercel deployment domains
if 'https://*.vercel.app' not in CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS.append('https://*.vercel.app')

# AI Service Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY') or os.getenv('gemini_api')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-3-flash-preview')

# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID = os.getenv('GOOGLE_OAUTH_CLIENT_ID') or os.getenv('VITE_GOOGLE_CLIENT_ID')
GOOGLE_OAUTH_CLIENT_SECRET = os.getenv('GOOGLE_OAUTH_CLIENT_SECRET')
