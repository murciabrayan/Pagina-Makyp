from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import SoloStaff

from .analisis import ETIQUETAS_TALLA, TALLAS, medir, rol_sugerido, sugerir_campos

from apps.viewsets import DobleSerializerViewSet

from .models import Flower, FlowerColor, FlowerVariant, Ribbon, Wrapper
from .serializers import (
    FlowerAdminSerializer,
    FlowerColorAdminSerializer,
    FlowerColorPublicSerializer,
    FlowerPublicSerializer,
    FlowerVariantAdminSerializer,
    RibbonAdminSerializer,
    RibbonPublicSerializer,
    WrapperAdminSerializer,
    WrapperPublicSerializer,
)


class FlowerViewSet(DobleSerializerViewSet):
    queryset = Flower.objects.select_related("color_base").prefetch_related(
        "variantes", "variantes__color"
    )
    serializer_public = FlowerPublicSerializer
    serializer_admin = FlowerAdminSerializer
    lookup_field = "slug"
    filterset_fields = ["rol"]
    search_fields = ["label", "slug"]
    parser_classes = [MultiPartParser, FormParser]

    @action(
        detail=False,
        methods=["post"],
        url_path="analizar",
        permission_classes=[SoloStaff],
    )
    def analizar(self, request):
        """
        Mide una foto y devuelve los numeros que necesita el motor.

        Es lo que evita que quien administra la tienda tenga que abrir la
        imagen en un editor para averiguar el contorno y el centro de la
        cabeza. Sube la foto, elige una talla, y aqui sale todo lo demas.

        No guarda nada: solo mide y responde. El alta ocurre despues, con el
        formulario ya relleno y despues de que la persona haya visto la
        medicion.
        """
        imagen = request.FILES.get("imagen")
        if imagen is None:
            return Response(
                {"imagen": ["Sube una foto para poder medirla."]}, status=400
            )

        talla = request.data.get("talla", "mediana")
        if talla not in TALLAS:
            return Response(
                {"talla": [f"Talla desconocida. Usa una de: {', '.join(TALLAS)}"]},
                status=400,
            )

        try:
            medidas = medir(imagen)
        except ValueError as error:
            return Response({"imagen": [str(error)]}, status=400)
        except Exception:
            # Pillow lanza de todo con un archivo corrupto o un formato que no
            # entiende. Al que sube una foto no le sirve el nombre de la
            # excepcion, le sirve saber que hacer.
            return Response(
                {
                    "imagen": [
                        "No pudimos leer esta imagen. Tiene que ser un PNG o un WebP "
                        "con la flor recortada y el fondo transparente."
                    ]
                },
                status=400,
            )

        avisos = []
        if medidas.margen_desperdiciado > 0.45:
            avisos.append(
                "La foto tiene mucho espacio vacío alrededor. Funciona igual, porque "
                "medimos solo la flor, pero recortarla haría el sitio más liviano."
            )
        if medidas.ancho_px < 120:
            avisos.append(
                "La foto es pequeña y puede verse borrosa en el ramo. "
                "Lo ideal son unos 400 píxeles de ancho o más."
            )
        if medidas.proporcion >= 2.6:
            avisos.append(
                "Es bastante más alta que ancha, así que la tratamos como espiga: "
                "sobresale por encima del ramo, como la lavanda."
            )

        return Response(
            {
                "medidas": medidas.como_dict(),
                "campos": sugerir_campos(medidas, talla),
                "rol_sugerido": rol_sugerido(medidas, talla),
                "tiene_tallo": medidas.tiene_tallo,
                "avisos": avisos,
            }
        )

    @action(detail=False, methods=["get"], url_path="tallas", permission_classes=[AllowAny])
    def tallas(self, request):
        """Las tallas que ofrece el formulario, con su descripcion."""
        return Response(
            [
                {"valor": clave, "etiqueta": ETIQUETAS_TALLA[clave], "ancho": ancho}
                for clave, ancho in TALLAS.items()
            ]
        )


class WrapperViewSet(DobleSerializerViewSet):
    queryset = Wrapper.objects.all()
    serializer_public = WrapperPublicSerializer
    serializer_admin = WrapperAdminSerializer
    lookup_field = "slug"
    parser_classes = [MultiPartParser, FormParser]

    @action(
        detail=False,
        methods=["post"],
        url_path="analizar",
        permission_classes=[SoloStaff],
    )
    def analizar(self, request):
        """
        Mide la foto de una envoltura y propone donde va el ramo.

        La proporcion sale de la imagen, igual que en las flores. Lo demas
        (donde se apoya el ramo, que tan ancho es, donde amarra el liston) no
        esta en los pixeles: son decisiones sobre el diseno de esa envoltura.
        Lo que se devuelve aqui son valores de partida sacados de las seis
        envolturas que ya existen, para que el editor visual arranque con algo
        razonable y solo haya que corregirlo arrastrando.
        """
        imagen = request.FILES.get("imagen")
        if imagen is None:
            return Response({"imagen": ["Sube una foto para poder medirla."]}, status=400)

        try:
            medidas = medir(imagen)
        except ValueError as error:
            return Response({"imagen": [str(error)]}, status=400)
        except Exception:
            return Response(
                {
                    "imagen": [
                        "No pudimos leer esta imagen. Tiene que ser un PNG o un WebP "
                        "con la envoltura recortada y el fondo transparente."
                    ]
                },
                status=400,
            )

        # ancho / alto: es lo que espera la vista previa del armador.
        aspecto = round(medidas.ancho_px / medidas.alto_px, 4) if medidas.alto_px else 1.0

        return Response(
            {
                "aspect": aspecto,
                "ancho_px": medidas.ancho_px,
                "alto_px": medidas.alto_px,
                # Punto de partida tomado de las envolturas ya cargadas: el
                # ramo se apoya algo por encima del centro y ocupa cerca de la
                # mitad del ancho del papel.
                "sugerencia": {
                    "cluster_x": 0.5,
                    "cluster_y": 0.3,
                    "cluster_r": 0.42,
                    "nudo_x": 0.5,
                    "nudo_y": 0.56,
                    "nudo_ancho": 0.4,
                    "escala_flores": round(max(0.6, min(2.4, 0.9 / aspecto)), 2),
                },
            }
        )


class RibbonViewSet(DobleSerializerViewSet):
    queryset = Ribbon.objects.all()
    serializer_public = RibbonPublicSerializer
    serializer_admin = RibbonAdminSerializer
    lookup_field = "slug"


class FlowerColorViewSet(DobleSerializerViewSet):
    queryset = FlowerColor.objects.all()
    serializer_public = FlowerColorPublicSerializer
    serializer_admin = FlowerColorAdminSerializer
    lookup_field = "slug"


class FlowerVariantViewSet(DobleSerializerViewSet):
    queryset = FlowerVariant.objects.select_related("flor", "color")
    serializer_public = FlowerVariantAdminSerializer
    serializer_admin = FlowerVariantAdminSerializer
    filterset_fields = ["flor__slug", "color__slug"]

    def filtrar_publicos(self, qs):
        # Una variante no tiene bandera propia: se publica si su flor y su
        # color estan publicados.
        return qs.filter(flor__visible=True, color__visible=True)


class BuilderBundleView(APIView):
    """
    Todo el armador en una sola peticion.

    La pantalla de armar el ramo necesita las flores, las envolturas, los
    listones, la paleta y las variantes de color antes de poder pintar nada.
    Pedirlas por separado son cinco viajes y un armador que aparece a pedazos;
    asi llega completo de una vez.

    El mapa de variantes se entrega con la misma forma que tenia
    `flowerColorVariants` en el frontend: por flor, el color de su foto
    original y las fotos de los demas colores.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        flores = (
            Flower.objects.filter(visible=True)
            .select_related("color_base")
            .prefetch_related("variantes__color")
        )
        colores = FlowerColor.objects.filter(visible=True)

        variantes: dict[str, dict] = {}
        for flor in flores:
            if not flor.color_base:
                continue
            mapa = {}
            for variante in flor.variantes.all():
                if not variante.color.visible:
                    continue
                entrada = {"image": variante.imagen_url}
                if variante.tallo_imagen_url:
                    entrada["stem"] = variante.tallo_imagen_url
                mapa[variante.color.slug] = entrada
            if mapa:
                variantes[flor.slug] = {"base": flor.color_base.slug, "variants": mapa}

        return Response(
            {
                "flowers": FlowerPublicSerializer(flores, many=True).data,
                "wrappers": WrapperPublicSerializer(
                    Wrapper.objects.filter(visible=True), many=True
                ).data,
                "ribbons": RibbonPublicSerializer(
                    Ribbon.objects.filter(visible=True), many=True
                ).data,
                "colors": FlowerColorPublicSerializer(colores, many=True).data,
                "colorVariants": variantes,
            }
        )
