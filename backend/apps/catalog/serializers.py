"""
Serializadores del catalogo.

Hay dos por modelo y es a proposito:

- El **publico** entrega los datos con la forma exacta que la tienda ya
  consumia cuando vivian en `frontend/src/data/`. Asi el frontend cambia de
  dónde saca los datos, no cómo los usa.
- El **de administracion** trabaja con los campos del modelo tal cual, que es
  lo que necesita un formulario para crear y editar.

Mezclar los dos obligaria a que el panel hablara en el idioma de la tienda, o
al reves, y cualquier cambio en uno rompeia el otro.
"""

from rest_framework import serializers

from .models import Category, Product


class CategoryPublicSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source="titulo", read_only=True)
    subtitle = serializers.CharField(source="subtitulo", read_only=True)
    image = serializers.CharField(source="imagen_url", read_only=True)

    class Meta:
        model = Category
        fields = ["slug", "title", "subtitle", "image"]


class CategoryAdminSerializer(serializers.ModelSerializer):
    imagen_url = serializers.CharField(read_only=True)
    productos_count = serializers.IntegerField(source="productos.count", read_only=True)

    class Meta:
        model = Category
        fields = [
            "id",
            "slug",
            "titulo",
            "subtitulo",
            "imagen",
            "imagen_ruta",
            "imagen_url",
            "visible",
            "orden",
            "productos_count",
        ]


class ProductPublicSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="nombre", read_only=True)
    price = serializers.IntegerField(source="precio", read_only=True)
    category = serializers.SlugRelatedField(
        source="categoria", slug_field="slug", read_only=True
    )
    image = serializers.CharField(source="imagen_url", read_only=True)
    badge = serializers.CharField(source="etiqueta", read_only=True)
    description = serializers.CharField(source="descripcion", read_only=True)
    includes = serializers.CharField(source="incluye", read_only=True)

    class Meta:
        model = Product
        fields = ["id", "name", "price", "category", "image", "badge", "description", "includes"]


class ProductAdminSerializer(serializers.ModelSerializer):
    imagen_url = serializers.CharField(read_only=True)
    categoria_nombre = serializers.CharField(source="categoria.titulo", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "nombre",
            "precio",
            "categoria",
            "categoria_nombre",
            "imagen",
            "imagen_ruta",
            "imagen_url",
            "etiqueta",
            "descripcion",
            "incluye",
            "disponible",
            "orden",
        ]

    def validate_precio(self, valor: int) -> int:
        if valor <= 0:
            raise serializers.ValidationError("El precio tiene que ser mayor que cero.")
        return valor

    def validate(self, datos):
        # Un producto sin foto se ve roto en la tienda. Se exige una de las
        # dos: la que se sube o la ruta de una que ya exista en el frontend.
        subida = datos.get("imagen", getattr(self.instance, "imagen", None))
        ruta = datos.get("imagen_ruta", getattr(self.instance, "imagen_ruta", ""))
        if not subida and not ruta:
            raise serializers.ValidationError(
                {"imagen": "Sube una foto o indica la ruta de una que ya esté en el sitio."}
            )
        return datos
