"""Serializadores del contenido editable del sitio."""

from rest_framework import serializers

from .models import GalleryImage, HelpItem, HeroSlide, SiteSettings, ValueProp


class SiteSettingsPublicSerializer(serializers.ModelSerializer):
    """Los datos del negocio con la forma que ya usaba `data/site.ts`."""

    whatsapp = serializers.SerializerMethodField()

    class Meta:
        model = SiteSettings
        fields = ["whatsapp", "email", "instagram", "tiktok", "facebook", "ubicacion"]

    def get_whatsapp(self, obj: SiteSettings) -> dict:
        return {"phone": obj.whatsapp, "displayPhone": obj.whatsapp_visible}


class SiteSettingsAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = [
            "id",
            "whatsapp",
            "whatsapp_visible",
            "email",
            "instagram",
            "tiktok",
            "facebook",
            "ubicacion",
        ]

    def validate_whatsapp(self, valor: str) -> str:
        solo_digitos = "".join(c for c in valor if c.isdigit())
        if len(solo_digitos) < 10:
            raise serializers.ValidationError(
                "Escribe el número con indicativo de país. Ejemplo: 573203684500"
            )
        return solo_digitos


class HeroSlidePublicSerializer(serializers.ModelSerializer):
    image = serializers.CharField(source="imagen_url", read_only=True)

    class Meta:
        model = HeroSlide
        fields = ["id", "image", "alt"]


class HeroSlideAdminSerializer(serializers.ModelSerializer):
    imagen_url = serializers.CharField(read_only=True)

    class Meta:
        model = HeroSlide
        fields = ["id", "imagen", "imagen_ruta", "imagen_url", "alt", "visible", "orden"]


class GalleryImagePublicSerializer(serializers.ModelSerializer):
    image = serializers.CharField(source="imagen_url", read_only=True)

    class Meta:
        model = GalleryImage
        fields = ["id", "image", "alt"]


class GalleryImageAdminSerializer(serializers.ModelSerializer):
    imagen_url = serializers.CharField(read_only=True)

    class Meta:
        model = GalleryImage
        fields = ["id", "imagen", "imagen_ruta", "imagen_url", "alt", "visible", "orden"]


class HelpItemPublicSerializer(serializers.ModelSerializer):
    """Misma forma que tenia ayuda.ts: parrafos y puntos ya separados."""

    id = serializers.CharField(source="slug", read_only=True)
    question = serializers.CharField(source="pregunta", read_only=True)
    answer = serializers.ListField(source="parrafos", read_only=True)
    list = serializers.ListField(source="lista", read_only=True)
    note = serializers.CharField(source="nota", read_only=True)

    class Meta:
        model = HelpItem
        fields = ["id", "question", "answer", "list", "note"]


class HelpItemAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = HelpItem
        fields = ["id", "slug", "pregunta", "respuesta", "puntos", "nota", "visible", "orden"]


class ValuePropPublicSerializer(serializers.ModelSerializer):
    icon = serializers.CharField(source="icono", read_only=True)
    title = serializers.CharField(source="titulo", read_only=True)
    description = serializers.CharField(source="descripcion", read_only=True)

    class Meta:
        model = ValueProp
        fields = ["id", "icon", "title", "description"]


class ValuePropAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValueProp
        fields = ["id", "icono", "titulo", "descripcion", "visible", "orden"]
