"""
Serializadores del armador.

El formato publico replica exactamente lo que `frontend/src/data/builder.ts`
entregaba al motor: mismas claves, mismas unidades, mismo anidamiento de
`anchor` y `stem`. Es lo que permite que `lib/bouquet.ts` no cambie una sola
linea: solo cambia de donde vienen las piezas.
"""

from django.utils.text import slugify
from rest_framework import serializers

from .models import Flower, FlowerColor, FlowerVariant, Ribbon, Wrapper


class SlugDelNombreMixin:
    """
    Rellena el slug a partir del nombre cuando el formulario no lo manda.

    El slug es cosa del programa, no de quien administra la tienda: es lo que
    viaja en las direcciones y lo que usa el motor para identificar la pieza.
    Pedirlo en el formulario obligaba a explicar que es un slug y a que
    alguien inventara uno; y si lo escribia con tildes o espacios, rompia.

    Si llega uno, se respeta: al editar una pieza que ya existe hay que poder
    conservar el suyo, porque cambiarlo rompe los enlaces que ya circulan.
    """

    def validate(self, datos):
        datos = super().validate(datos)
        if not datos.get("slug") and datos.get("label"):
            base = slugify(datos["label"])
            modelo = self.Meta.model
            slug = base
            n = 2
            # Dos listones llamados igual no pueden compartir slug: se numera
            # el segundo en vez de fallar con un error que nadie entiende.
            existentes = modelo.objects.all()
            if self.instance is not None:
                existentes = existentes.exclude(pk=self.instance.pk)
            while existentes.filter(slug=slug).exists():
                slug = f"{base}-{n}"
                n += 1
            datos["slug"] = slug
        return datos


class FlowerColorPublicSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="slug", read_only=True)

    class Meta:
        model = FlowerColor
        fields = ["id", "label", "swatch"]


class FlowerPublicSerializer(serializers.ModelSerializer):
    """Una flor con la forma que espera el motor de armado."""

    id = serializers.CharField(source="slug", read_only=True)
    image = serializers.CharField(source="imagen_url", read_only=True)
    role = serializers.CharField(source="rol", read_only=True)
    w = serializers.FloatField(source="ancho", read_only=True)
    h = serializers.FloatField(source="alto", read_only=True)
    anchor = serializers.SerializerMethodField()
    stem = serializers.SerializerMethodField()

    class Meta:
        model = Flower
        fields = ["id", "label", "image", "role", "w", "h", "anchor", "stem"]

    def get_anchor(self, obj: Flower) -> dict:
        return {"x": obj.anchor_x, "y": obj.anchor_y}

    def get_stem(self, obj: Flower) -> dict | None:
        # Sin foto con tallo no se manda la clave: el motor comprueba su
        # existencia para decidir si la flor puede ir arriba mostrando tallo.
        if not obj.tiene_tallo:
            return None
        return {
            "image": obj.tallo_imagen_url,
            "w": obj.tallo_ancho,
            "h": obj.tallo_alto,
            "anchor": {"x": obj.tallo_anchor_x, "y": obj.tallo_anchor_y},
        }


class WrapperPublicSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="slug", read_only=True)
    size = serializers.CharField(source="tamano", read_only=True)
    image = serializers.CharField(source="imagen_url", read_only=True)
    cluster = serializers.SerializerMethodField()
    clusterR = serializers.FloatField(source="cluster_r", read_only=True)
    flowerScale = serializers.FloatField(source="escala_flores", read_only=True)
    knot = serializers.SerializerMethodField()
    capacity = serializers.IntegerField(source="capacidad", read_only=True)

    class Meta:
        model = Wrapper
        fields = [
            "id",
            "label",
            "size",
            "image",
            "aspect",
            "cluster",
            "clusterR",
            "flowerScale",
            "knot",
            "capacity",
        ]

    def get_cluster(self, obj: Wrapper) -> dict:
        return {"x": obj.cluster_x, "y": obj.cluster_y}

    def get_knot(self, obj: Wrapper) -> dict:
        return {"x": obj.nudo_x, "y": obj.nudo_y, "w": obj.nudo_ancho}


class RibbonPublicSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="slug", read_only=True)
    image = serializers.CharField(source="imagen_url", read_only=True)

    class Meta:
        model = Ribbon
        fields = ["id", "label", "image", "aspect"]


# ------------------------------------------------------------------ admin


class FlowerColorAdminSerializer(SlugDelNombreMixin, serializers.ModelSerializer):
    class Meta:
        model = FlowerColor
        fields = ["id", "slug", "label", "swatch", "visible", "orden"]
        extra_kwargs = {"slug": {"required": False}}


class FlowerVariantAdminSerializer(serializers.ModelSerializer):
    color_slug = serializers.CharField(source="color.slug", read_only=True)
    imagen_url = serializers.CharField(read_only=True)
    tallo_imagen_url = serializers.CharField(read_only=True)

    class Meta:
        model = FlowerVariant
        fields = [
            "id",
            "flor",
            "color",
            "color_slug",
            "imagen",
            "imagen_ruta",
            "imagen_url",
            "tallo_imagen",
            "tallo_imagen_ruta",
            "tallo_imagen_url",
        ]


class FlowerAdminSerializer(SlugDelNombreMixin, serializers.ModelSerializer):
    imagen_url = serializers.CharField(read_only=True)
    tallo_imagen_url = serializers.CharField(read_only=True)
    variantes = FlowerVariantAdminSerializer(many=True, read_only=True)

    class Meta:
        model = Flower
        fields = [
            "id",
            "slug",
            "label",
            "rol",
            "imagen",
            "imagen_ruta",
            "imagen_url",
            "ancho",
            "alto",
            "anchor_x",
            "anchor_y",
            "tallo_imagen",
            "tallo_imagen_ruta",
            "tallo_imagen_url",
            "tallo_ancho",
            "tallo_alto",
            "tallo_anchor_x",
            "tallo_anchor_y",
            "color_base",
            "visible",
            "orden",
            "variantes",
        ]
        extra_kwargs = {"slug": {"required": False}}

    def validate(self, datos):
        datos = super().validate(datos)
        # Las medidas mandan al motor: si vienen en cero o negativas, la flor
        # se coloca encima de las demas o desaparece del ramo.
        for campo in ("ancho", "alto"):
            valor = datos.get(campo, getattr(self.instance, campo, None))
            if valor is not None and valor <= 0:
                raise serializers.ValidationError({campo: "Tiene que ser mayor que cero."})

        for campo in ("anchor_x", "anchor_y"):
            valor = datos.get(campo, getattr(self.instance, campo, None))
            if valor is not None and not 0 <= valor <= 1:
                raise serializers.ValidationError(
                    {campo: "Es una fracción de la foto: va entre 0 y 1."}
                )
        return datos


class WrapperAdminSerializer(SlugDelNombreMixin, serializers.ModelSerializer):
    imagen_url = serializers.CharField(read_only=True)

    class Meta:
        model = Wrapper
        fields = [
            "id",
            "slug",
            "label",
            "tamano",
            "imagen",
            "imagen_ruta",
            "imagen_url",
            "aspect",
            "cluster_x",
            "cluster_y",
            "cluster_r",
            "escala_flores",
            "nudo_x",
            "nudo_y",
            "nudo_ancho",
            "capacidad",
            "visible",
            "orden",
        ]
        extra_kwargs = {"slug": {"required": False}}

    def validate_capacidad(self, valor: int) -> int:
        if valor < 1:
            raise serializers.ValidationError("Una envoltura tiene que admitir al menos una flor.")
        return valor

    def validate_aspect(self, valor: float) -> float:
        if valor <= 0:
            raise serializers.ValidationError("La proporción tiene que ser mayor que cero.")
        return valor


class RibbonAdminSerializer(SlugDelNombreMixin, serializers.ModelSerializer):
    imagen_url = serializers.CharField(read_only=True)

    class Meta:
        model = Ribbon
        fields = [
            "id",
            "slug",
            "label",
            "imagen",
            "imagen_ruta",
            "imagen_url",
            "aspect",
            "visible",
            "orden",
        ]
        extra_kwargs = {"slug": {"required": False}, "aspect": {"required": False}}

    def validate(self, datos):
        datos = super().validate(datos)
        # La proporcion sale de la foto. Preguntarla seria pedirle a alguien
        # que divida el ancho entre el alto de una imagen que tiene delante.
        imagen = datos.get("imagen")
        if imagen is not None and not datos.get("aspect"):
            from .analisis import medir

            try:
                medidas = medir(imagen)
                datos["aspect"] = (
                    round(medidas.ancho_px / medidas.alto_px, 4) if medidas.alto_px else 1.0
                )
                imagen.seek(0)
            except Exception:
                # Si no se puede medir, un cuadrado es lo menos malo: el
                # liston se vera algo estirado, pero nada se rompe.
                datos["aspect"] = 1.0
        return datos
