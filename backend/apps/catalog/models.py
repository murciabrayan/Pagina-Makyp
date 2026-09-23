from django.db import models

from apps.common import Ordenable, resolver_url_imagen


class Category(Ordenable):
    """Una categoría de la tienda. El `slug` es lo que viaja en la URL."""

    slug = models.SlugField("slug", max_length=50, unique=True)
    titulo = models.CharField("título", max_length=80)
    subtitulo = models.CharField("subtítulo", max_length=120, blank=True)
    imagen = models.ImageField("imagen", upload_to="categorias/", blank=True, null=True)
    imagen_ruta = models.CharField(
        "ruta de imagen", max_length=200, blank=True,
        help_text="Foto que ya vive en el frontend, por ejemplo /categories/flores.webp",
    )
    visible = models.BooleanField(
        "visible", default=True,
        help_text="Si se desmarca, la categoría desaparece del menú y del inicio.",
    )

    class Meta(Ordenable.Meta):
        verbose_name = "categoría"
        verbose_name_plural = "categorías"

    def __str__(self) -> str:
        return self.titulo

    @property
    def imagen_url(self) -> str:
        return resolver_url_imagen(self, "imagen", "imagen_ruta")


class Product(Ordenable):
    """Un producto de la tienda."""

    nombre = models.CharField("nombre", max_length=140)
    precio = models.PositiveIntegerField(
        "precio",
        help_text="En pesos colombianos, sin decimales ni puntos. Ejemplo: 45000",
    )
    categoria = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="productos", verbose_name="categoría"
    )
    imagen = models.ImageField("imagen", upload_to="productos/", blank=True, null=True)
    imagen_ruta = models.CharField("ruta de imagen", max_length=200, blank=True)
    etiqueta = models.CharField(
        "etiqueta", max_length=40, blank=True,
        help_text='Distintivo sobre la foto, por ejemplo "Nuevo" o "Más vendido".',
    )
    descripcion = models.TextField("descripción", blank=True)
    incluye = models.TextField("incluye", blank=True)
    disponible = models.BooleanField(
        "disponible", default=True,
        help_text="Si se desmarca, el producto deja de aparecer en la tienda.",
    )

    class Meta(Ordenable.Meta):
        verbose_name = "producto"
        verbose_name_plural = "productos"
        indexes = [models.Index(fields=["categoria", "disponible"])]

    def __str__(self) -> str:
        return self.nombre

    @property
    def imagen_url(self) -> str:
        return resolver_url_imagen(self, "imagen", "imagen_ruta")
