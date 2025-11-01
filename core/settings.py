from pathlib import Path
from datetime import timedelta
import environ

BASE_DIR = Path(__file__).resolve().parent.parent

# --- env ---
env = environ.Env(
    DEBUG=(bool, True),
    SECRET_KEY=(str, 'changeme-in-.env'),
    ALLOWED_HOSTS=(list, ['*']),
    FRONTEND_ORIGIN=(str, 'http://localhost:5173'),
)
environ.Env.read_env(BASE_DIR / '.env')

SECRET_KEY = env('SECRET_KEY')
DEBUG = env('DEBUG')
ALLOWED_HOSTS = ['127.0.0.1', 'localhost']


# --- apps ---
INSTALLED_APPS = [
    'django.contrib.admin','django.contrib.auth','django.contrib.contenttypes',
    'django.contrib.sessions','django.contrib.messages','django.contrib.staticfiles',
    'rest_framework','corsheaders','store',
]

# --- middleware ---
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

ROOT_URLCONF = 'core.urls'

TEMPLATES = [{
    'BACKEND':'django.template.backends.django.DjangoTemplates',
    'DIRS':[], 'APP_DIRS':True,
    'OPTIONS':{'context_processors':[
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ]},
}]
WSGI_APPLICATION = 'core.wsgi.application'

# --- db (SQLite by default; swap to PostgreSQL via .env later) ---
DATABASES = {
    'default': {
        'ENGINE':'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# --- auth validators (keep during prod) ---
AUTH_PASSWORD_VALIDATORS = [
    {'NAME':'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME':'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME':'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME':'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# --- i18n ---
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kathmandu'
USE_I18N = True
USE_TZ = True

# --- static/media ---
STATIC_URL = 'static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# --- CORS ---
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [env('FRONTEND_ORIGIN')]
# For local tools / Swagger etc. you can add extra origins in .env

# --- DRF & JWT ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '200/hour',
        'user': '2000/hour',
    },
}
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=4),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- Payment gateways ---
KHALTI_BASE_URL = env('KHALTI_BASE_URL', default='https://dev.khalti.com/api/v2')  # prod: https://khalti.com/api/v2
KHALTI_SECRET_KEY = env('KHALTI_SECRET_KEY', default='')  # from Khalti merchant portal
KHALTI_RETURN_URL = env('KHALTI_RETURN_URL', default='http://127.0.0.1:8000/api/payments/khalti/callback/')

ESEWA_FORM_URL = env('ESEWA_FORM_URL', default='https://rc-epay.esewa.com.np/api/epay/main/v2/form')   # prod: https://epay.esewa.com.np/api/epay/main/v2/form
ESEWA_STATUS_URL = env('ESEWA_STATUS_URL', default='https://uat.esewa.com.np/api/epay/transaction/status/')  # prod: https://epay.esewa.com.np/api/epay/transaction/status/
ESEWA_PRODUCT_CODE = env('ESEWA_PRODUCT_CODE', default='EPAYTEST')  # merchant product_code
ESEWA_SECRET_KEY = env('ESEWA_SECRET_KEY', default='8gBm/:&EnhH.1/q(')  # UAT default from docs; replace in prod
ESEWA_SUCCESS_URL = env('ESEWA_SUCCESS_URL', default='http://127.0.0.1:8000/api/payments/esewa/success/')
ESEWA_FAILURE_URL = env('ESEWA_FAILURE_URL', default='http://127.0.0.1:8000/api/payments/esewa/failure/')
