from rest_framework.decorators import action
from rest_framework.response import Response

from apps.viewsets import DobleSerializerViewSet

from .models import Category, Product
from .serializers import (
    CategoryAdminSerializer,
    CategoryPublicSerializer,
    ProductAdminSerializer,
    ProductPublicSerializer,
)


class CategoryViewSet(DobleSerializerViewSet):
    queryset = Category.objects.all()
    serializer_public = CategoryPublicSerializer
    serializer_admin = CategoryAdminSerializer
    lookup_field = "slug"
    search_fields = ["titulo", "slug"]
    ordering_fields = ["orden", "titulo"]


class ProductViewSet(DobleSerializerViewSet):
    queryset = Product.objects.select_related("categoria")
    serializer_public = ProductPublicSerializer
    serializer_admin = ProductAdminSerializer
    filterset_fields = ["categoria__slug"]
    search_fields = ["nombre", "descripcion"]
    ordering_fields = ["orden", "precio", "nombre"]

    def filtrar_publicos(self, qs):
        # En productos la bandera se llama `disponible`, y ademas se esconden
        # los de una categoria oculta: si no, quedaria un producto visible
        # cuya categoria ya no existe en el menu.
        return qs.filter(disponible=True, categoria__visible=True)

    @action(detail=False, methods=["post"], url_path="reordenar")
    def reordenar(self, request):
        """
        Reordena varios productos de una vez.

        El panel permite arrastrar las tarjetas; mandar una peticion por cada
        una dejaria el orden a medias si se corta a la mitad. Aqui llega la
        lista completa y se guarda de una sola pasada.
        """
        if not (request.user.is_authenticated and request.user.is_staff):
            return Response({"detail": "No autorizado."}, status=403)

        orden = request.data.get("orden")
        if not isinstance(orden, list):
            return Response(
                {"orden": "Se espera una lista de identificadores en el orden deseado."},
                status=400,
            )

        productos = {p.id: p for p in Product.objects.filter(id__in=orden)}
        faltantes = [i for i in orden if i not in productos]
        if faltantes:
            return Response({"orden": f"No existen estos productos: {faltantes}"}, status=400)

        for posicion, product_id in enumerate(orden):
            productos[product_id].orden = posicion
        Product.objects.bulk_update(productos.values(), ["orden"])
        return Response({"actualizados": len(productos)})
