"""
Configuración de Django para el backend de Makyp Creations.

Todo lo que cambia entre tu máquina y el servidor (claves, base de datos,
dominios permitidos) se lee de variables de entorno, nunca se escribe aquí.
Mira `.env.example` para saber qué hay que definir.
"""

from datetime import timedelta
from pathlib import Path
import os

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")


def env(nombre: str, por_defecto: str = "") -> str:
    return os.environ.get(nombre, por_defecto)


def env_bool(nombre: str, por_defecto: bool = False) -> bool:
    valor = env(nombre, str(por_defecto)).strip().lower()
    return valor in {"1", "true", "yes", "on", "si", "sí"}


def env_list(nombre: str, por_defecto: str = "") -> list[str]:
    return [item.strip() for item in env(nombre, por_defecto).split(",") if item.strip()]


# ---------------------------------------------------------------- seguridad

SECRET_KEY = env("DJANGO_SECRET_KEY", "clave-insegura-solo-para-desarrollo")
DEBUG = env_bool("DJANGO_DEBUG", True)
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")

# En producción el sitio va detrás de HTTPS: sin esto la cookie del refresh
# viajaría en claro y el navegador la mandaría a sitios de terceros.
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

CSRF_TRUSTED_ORIGINS = env_list("DJANGO_CSRF_TRUSTED_ORIGINS", "http://localhost:5173")

# ---------------------------------------------------------------- aplicaciones

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # terceros
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    # propias
    "apps.accounts",
    "apps.catalog",
    "apps.builder",
    "apps.content",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ---------------------------------------------------------------- base de datos

#
# En produccion las plataformas entregan la base como una sola direccion
# (DATABASE_URL); en local es mas comodo tener los datos sueltos. Se admiten
# las dos formas para no tener que mantener dos configuraciones distintas.
DATABASE_URL = env("DATABASE_URL")

if DATABASE_URL:
    from urllib.parse import unquote, urlparse

    url = urlparse(DATABASE_URL)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": url.path.lstrip("/"),
            "USER": unquote(url.username or ""),
            "PASSWORD": unquote(url.password or ""),
            "HOST": url.hostname or "",
            "PORT": str(url.port or 5432),
            # Las bases gestionadas exigen conexion cifrada; sin esto, el
            # despliegue falla con un error de red que no dice por que.
            "OPTIONS": {"sslmode": env("DB_SSLMODE", "require")},
            # Se reaprovecha la conexion diez minutos en vez de abrir una por
            # peticion: con la base en otro servidor, ese saludo inicial es
            # lo que mas tarda de toda la peticion.
            "CONN_MAX_AGE": 600,
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("POSTGRES_DB", "makyp"),
            "USER": env("POSTGRES_USER", "postgres"),
            "PASSWORD": env("POSTGRES_PASSWORD", ""),
            "HOST": env("POSTGRES_HOST", "localhost"),
            "PORT": env("POSTGRES_PORT", "5432"),
        }
    }

# ---------------------------------------------------------------- usuarios

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ---------------------------------------------------------------- API

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    # Por defecto todo es de solo lectura pública: la tienda tiene que verse
    # sin iniciar sesión. Escribir exige ser del equipo.
    "DEFAULT_PERMISSION_CLASSES": ("apps.accounts.permissions.LecturaPublicaEscrituraStaff",),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_RENDERER_CLASSES": ("rest_framework.renderers.JSONRenderer",),
    "DEFAULT_THROTTLE_CLASSES": ("rest_framework.throttling.ScopedRateThrottle",),
    "DEFAULT_THROTTLE_RATES": {"login": "10/min"},
}

SIMPLE_JWT = {
    # El access vive poco y el frontend lo guarda en memoria; el refresh dura
    # más pero viaja en una cookie httpOnly que JavaScript no puede leer.
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "UPDATE_LAST_LOGIN": True,
}

# Nombre de la cookie donde va el refresh. Se maneja en apps/accounts/views.py.
REFRESH_COOKIE_NAME = "makyp_refresh"
REFRESH_COOKIE_SAMESITE = env("REFRESH_COOKIE_SAMESITE", "Lax")
REFRESH_COOKIE_SECURE = not DEBUG

# ---------------------------------------------------------------- CORS

CORS_ALLOWED_ORIGINS = env_list(
    "DJANGO_CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
)
# hace falta para que el navegador mande y acepte la cookie del refresh
CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------- estáticos

LANGUAGE_CODE = "es-co"
TIME_ZONE = "America/Bogota"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# ---------------------------------------------------------------- las fotos
#
# En produccion las fotos que sube el equipo NO pueden vivir en el disco del
# servidor: el sistema de archivos de estas plataformas se borra entero en
# cada despliegue, asi que la primera actualizacion se llevaria por delante
# todo lo subido. Van a un almacenamiento aparte (Cloudflare R2, que habla el
# mismo idioma que S3).
#
# Si no hay credenciales configuradas se usa el disco, que es justo lo que
# hace falta en tu maquina: asi el proyecto sigue arrancando sin tener que
# configurar nada para trabajar en local.
R2_BUCKET = env("R2_BUCKET")
R2_ENDPOINT = env("R2_ENDPOINT")
R2_ACCESS_KEY = env("R2_ACCESS_KEY")
R2_SECRET_KEY = env("R2_SECRET_KEY")
# El dominio publico del bucket, para que las direcciones de las fotos sean
# limpias y no lleven firma ni caducidad.
R2_DOMINIO_PUBLICO = env("R2_DOMINIO_PUBLICO")

USAR_R2 = all([R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY])

if USAR_R2:
    almacen_fotos = {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            "bucket_name": R2_BUCKET,
            "endpoint_url": R2_ENDPOINT,
            "access_key": R2_ACCESS_KEY,
            "secret_key": R2_SECRET_KEY,
            # R2 no maneja las listas de permisos de S3: hay que no mandarlas.
            "default_acl": None,
            # Sin firma en la direccion: las fotos de una tienda son publicas
            # y una direccion firmada caduca, rompiendo las que se hayan
            # compartido o guardado en cache.
            "querystring_auth": False,
            "file_overwrite": False,
            "custom_domain": R2_DOMINIO_PUBLICO or None,
            "object_parameters": {"CacheControl": "public, max-age=86400"},
        },
    }
else:
    almacen_fotos = {"BACKEND": "django.core.files.storage.FileSystemStorage"}

STORAGES = {
    "default": almacen_fotos,
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Las fotos que ya vivían en el frontend se siguen sirviendo desde ahí. Ver el
# comentario de `image_url` en apps/catalog/models.py.
FRONTEND_ASSET_BASE_URL = env("FRONTEND_ASSET_BASE_URL", "")
