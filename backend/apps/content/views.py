from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import LecturaPublicaEscrituraStaff
from apps.catalog.models import Category
from apps.catalog.serializers import CategoryPublicSerializer
from apps.viewsets import DobleSerializerViewSet

from .models import GalleryImage, HelpItem, HeroSlide, SiteSettings, ValueProp
from .serializers import (
    GalleryImageAdminSerializer,
    GalleryImagePublicSerializer,
    HelpItemAdminSerializer,
    HelpItemPublicSerializer,
    HeroSlideAdminSerializer,
    HeroSlidePublicSerializer,
    SiteSettingsAdminSerializer,
    SiteSettingsPublicSerializer,
    ValuePropAdminSerializer,
    ValuePropPublicSerializer,
)


class HeroSlideViewSet(DobleSerializerViewSet):
    queryset = HeroSlide.objects.all()
    serializer_public = HeroSlidePublicSerializer
    serializer_admin = HeroSlideAdminSerializer


class GalleryImageViewSet(DobleSerializerViewSet):
    queryset = GalleryImage.objects.all()
    serializer_public = GalleryImagePublicSerializer
    serializer_admin = GalleryImageAdminSerializer


class HelpItemViewSet(DobleSerializerViewSet):
    queryset = HelpItem.objects.all()
    serializer_public = HelpItemPublicSerializer
    serializer_admin = HelpItemAdminSerializer
    lookup_field = "slug"


class ValuePropViewSet(DobleSerializerViewSet):
    queryset = ValueProp.objects.all()
    serializer_public = ValuePropPublicSerializer
    serializer_admin = ValuePropAdminSerializer


class SiteSettingsViewSet(
    mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet
):
    """
    Los datos del negocio son una sola fila, asi que no hay lista ni alta ni
    baja: solo ver y editar. Se responde siempre a la misma direccion,
    `/api/content/site/actual/`, para que el panel no tenga que averiguar un
    identificador que nunca cambia.
    """

    permission_classes = [LecturaPublicaEscrituraStaff]
    serializer_class = SiteSettingsAdminSerializer

    def get_object(self):
        return SiteSettings.cargar()

    def get_serializer_class(self):
        usuario = self.request.user
        if self.action == "retrieve" and not (usuario.is_authenticated and usuario.is_staff):
            return SiteSettingsPublicSerializer
        return SiteSettingsAdminSerializer


class BootstrapView(APIView):
    """
    Lo que la web necesita para pintarse, en una sola peticion.

    Son datos que hacen falta en casi todas las pantallas (los de contacto van
    en la cabecera, el pie y cada boton de WhatsApp). Pedirlos por separado
    haria que la pagina apareciera por partes.

    No incluye los productos ni el armador: esos pesan y solo hacen falta en
    su pantalla.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "site": SiteSettingsPublicSerializer(SiteSettings.cargar()).data,
                "categories": CategoryPublicSerializer(
                    Category.objects.filter(visible=True), many=True
                ).data,
                "hero": HeroSlidePublicSerializer(
                    HeroSlide.objects.filter(visible=True), many=True
                ).data,
                "gallery": GalleryImagePublicSerializer(
                    GalleryImage.objects.filter(visible=True), many=True
                ).data,
                "valueProps": ValuePropPublicSerializer(
                    ValueProp.objects.filter(visible=True), many=True
                ).data,
                "help": HelpItemPublicSerializer(
                    HelpItem.objects.filter(visible=True), many=True
                ).data,
            }
        )
