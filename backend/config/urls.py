"""
Rutas de la API.

Todo cuelga de `/api/`. Hay dos formas de leer lo mismo y conviene tenerlas
claras:

- Las rutas de recurso (`/api/catalog/products/`) sirven para el panel, que
  necesita listar, filtrar, crear y editar pieza por pieza.
- Las rutas de paquete (`/api/bootstrap/`, `/api/builder/bundle/`) sirven para
  la tienda, que necesita muchas cosas a la vez y en un solo viaje.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.accounts.views import CambiarPasswordView, LoginView, LogoutView, MeView, RefreshView
from apps.builder.views import (
    BuilderBundleView,
    FlowerColorViewSet,
    FlowerVariantViewSet,
    FlowerViewSet,
    RibbonViewSet,
    WrapperViewSet,
)
from apps.catalog.views import CategoryViewSet, ProductViewSet
from apps.content.views import (
    BootstrapView,
    GalleryImageViewSet,
    HelpItemViewSet,
    HeroSlideViewSet,
    SiteSettingsViewSet,
    ValuePropViewSet,
)


def salud(_request):
    """
    Señal de vida del servidor, sin tocar la base de datos.

    La plataforma consulta esto cada pocos segundos, y una tarea programada
    cada diez minutos, para que el servicio no se apague por inactividad. Si
    la consulta llegara a la base, la mantendría encendida también a ella, y
    la base se cobra por horas encendida y no por uso. Así la base solo
    despierta cuando entra una persona de verdad.
    """
    return JsonResponse({"estado": "ok"})


router = DefaultRouter()
router.register("catalog/categories", CategoryViewSet, basename="category")
router.register("catalog/products", ProductViewSet, basename="product")
router.register("builder/flowers", FlowerViewSet, basename="flower")
router.register("builder/wrappers", WrapperViewSet, basename="wrapper")
router.register("builder/ribbons", RibbonViewSet, basename="ribbon")
router.register("builder/colors", FlowerColorViewSet, basename="flowercolor")
router.register("builder/variants", FlowerVariantViewSet, basename="flowervariant")
router.register("content/hero", HeroSlideViewSet, basename="heroslide")
router.register("content/gallery", GalleryImageViewSet, basename="galleryimage")
router.register("content/help", HelpItemViewSet, basename="helpitem")
router.register("content/value-props", ValuePropViewSet, basename="valueprop")
router.register("content/site", SiteSettingsViewSet, basename="sitesettings")

urlpatterns = [
    path("admin/", admin.site.urls),
    # señal de vida para la plataforma
    path("api/salud/", salud, name="salud"),
    # autenticación
    path("api/auth/login/", LoginView.as_view(), name="login"),
    path("api/auth/refresh/", RefreshView.as_view(), name="refresh"),
    path("api/auth/logout/", LogoutView.as_view(), name="logout"),
    path("api/auth/me/", MeView.as_view(), name="me"),
    path("api/auth/password/", CambiarPasswordView.as_view(), name="cambiar-password"),
    # paquetes para la tienda
    path("api/bootstrap/", BootstrapView.as_view(), name="bootstrap"),
    path("api/builder/bundle/", BuilderBundleView.as_view(), name="builder-bundle"),
    # recursos
    path("api/", include(router.urls)),
]

# En desarrollo Django sirve las fotos que sube el equipo. En producción de
# eso se encarga el servidor web o el bucket, nunca Django.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
