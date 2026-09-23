"""
Las piezas del armador de ramos.

Estos modelos son el espejo exacto de lo que antes vivia en
`frontend/src/data/builder.ts`. El motor de armado no cambia: sigue recibiendo
las mismas medidas, solo que ahora salen de la base de datos y el equipo las
puede tocar desde el panel.

Aviso importante sobre las medidas: `ancho`, `alto` y el anclaje NO son
valores a ojo. Salen de medir la foto recortada al contenido real y de ubicar
el centro de la cabeza de la flor. El `ancho` esta a escala real entre flores
(un lirio de 300 es de verdad casi tres veces mas ancho que una margarita de
110). Si se cargan a ojo, el motor coloca mal esa flor.
"""

from django.db import models

from apps.common import Ordenable, resolver_url_imagen


class FlowerRole(models.TextChoices):
    FACE = "face", "Cara — flor abierta y grande, va abajo y al frente"
    STEM = "stem", "Tallo — va arriba y parada, en arco"
    SPIKE = "spike", "Espiga — alta, marca la silueta del ramo"
    FILLER = "filler", "Relleno — pequeña, se mete en las junturas"
    GREEN = "green", "Follaje — va al fondo, abriéndose hacia los lados"


class FlowerColor(Ordenable):
    """Un color de la paleta del armador."""

    slug = models.SlugField("slug", max_length=30, unique=True)
    label = models.CharField("nombre", max_length=40)
    swatch = models.CharField(
        "muestra",
        max_length=9,
        help_text="Color en hexadecimal para el botón, por ejemplo #f2789f",
    )
    visible = models.BooleanField("visible", default=True)

    class Meta(Ordenable.Meta):
        verbose_name = "color de flor"
        verbose_name_plural = "colores de flor"

    def __str__(self) -> str:
        return self.label


class Flower(Ordenable):
    """Una flor que se puede meter en el ramo."""

    slug = models.SlugField("slug", max_length=40, unique=True)
    label = models.CharField("nombre", max_length=60)
    rol = models.CharField("rol", max_length=10, choices=FlowerRole.choices)

    imagen = models.ImageField("imagen", upload_to="armador/flores/", blank=True, null=True)
    imagen_ruta = models.CharField("ruta de imagen", max_length=200, blank=True)

    ancho = models.FloatField(
        "ancho",
        help_text=(
            "Ancho de la foto en unidades del escenario (el escenario mide 1000), "
            "a escala real frente a las demás flores."
        ),
    )
    alto = models.FloatField("alto", help_text="Alto en las mismas unidades que el ancho.")
    anchor_x = models.FloatField(
        "anclaje X", help_text="Centro de la cabeza, en fracción del ancho de la foto (0 a 1)."
    )
    anchor_y = models.FloatField(
        "anclaje Y", help_text="Centro de la cabeza, en fracción del alto de la foto (0 a 1)."
    )

    # Version con tallo: el motor la usa cuando la flor queda en la parte alta
    # del ramo, para que el tallo baje y la conecte con el resto.
    tallo_imagen = models.ImageField(
        "imagen con tallo", upload_to="armador/flores/", blank=True, null=True
    )
    tallo_imagen_ruta = models.CharField("ruta de imagen con tallo", max_length=200, blank=True)
    tallo_ancho = models.FloatField("ancho con tallo", blank=True, null=True)
    tallo_alto = models.FloatField("alto con tallo", blank=True, null=True)
    tallo_anchor_x = models.FloatField("anclaje X con tallo", blank=True, null=True)
    tallo_anchor_y = models.FloatField("anclaje Y con tallo", blank=True, null=True)

    color_base = models.ForeignKey(
        FlowerColor,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="flores_base",
        verbose_name="color de la foto original",
        help_text=(
            "Con qué color está hecha la foto de arriba. "
            "Vacío si la flor no cambia de color."
        ),
    )
    visible = models.BooleanField("visible", default=True)

    class Meta(Ordenable.Meta):
        verbose_name = "flor"
        verbose_name_plural = "flores"

    def __str__(self) -> str:
        return self.label

    @property
    def imagen_url(self) -> str:
        return resolver_url_imagen(self, "imagen", "imagen_ruta")

    @property
    def tallo_imagen_url(self) -> str:
        return resolver_url_imagen(self, "tallo_imagen", "tallo_imagen_ruta")

    @property
    def tiene_tallo(self) -> bool:
        return bool(self.tallo_imagen_url and self.tallo_ancho and self.tallo_alto)


class FlowerVariant(models.Model):
    """La misma flor en otro color. Una fila por flor y color."""

    flor = models.ForeignKey(
        Flower, on_delete=models.CASCADE, related_name="variantes", verbose_name="flor"
    )
    color = models.ForeignKey(
        FlowerColor, on_delete=models.CASCADE, related_name="variantes", verbose_name="color"
    )
    imagen = models.ImageField("imagen", upload_to="armador/flores/", blank=True, null=True)
    imagen_ruta = models.CharField("ruta de imagen", max_length=200, blank=True)
    tallo_imagen = models.ImageField(
        "imagen con tallo", upload_to="armador/flores/", blank=True, null=True
    )
    tallo_imagen_ruta = models.CharField("ruta de imagen con tallo", max_length=200, blank=True)

    class Meta:
        verbose_name = "variante de color"
        verbose_name_plural = "variantes de color"
        constraints = [
            models.UniqueConstraint(fields=["flor", "color"], name="una_variante_por_flor_y_color")
        ]
        ordering = ["flor", "color"]

    def __str__(self) -> str:
        return f"{self.flor.label} en {self.color.label}"

    @property
    def imagen_url(self) -> str:
        return resolver_url_imagen(self, "imagen", "imagen_ruta")

    @property
    def tallo_imagen_url(self) -> str:
        return resolver_url_imagen(self, "tallo_imagen", "tallo_imagen_ruta")


class Wrapper(Ordenable):
    """
    Una envoltura. Define el tamano del ramo y cuantas flores caben.

    Las coordenadas van en fraccion de la caja de la envoltura (0 a 1), no en
    pixeles, para que todo siga cuadrando cuando la vista previa cambia de
    tamano en el celular.
    """

    slug = models.SlugField("slug", max_length=40, unique=True)
    label = models.CharField("nombre", max_length=60)
    tamano = models.CharField(
        "tamaño",
        max_length=40,
        help_text="En palabras, como lo lee el cliente: Grande, Mediana, Pequeña.",
    )
    imagen = models.ImageField("imagen", upload_to="armador/envolturas/", blank=True, null=True)
    imagen_ruta = models.CharField("ruta de imagen", max_length=200, blank=True)

    aspect = models.FloatField("proporción", help_text="Ancho dividido alto de la foto recortada.")
    cluster_x = models.FloatField("centro del ramo X", help_text="Fracción de la caja (0 a 1).")
    cluster_y = models.FloatField("centro del ramo Y", help_text="Fracción de la caja (0 a 1).")
    cluster_r = models.FloatField("radio del ramo", help_text="Fracción del ancho de la envoltura.")
    escala_flores = models.FloatField(
        "escala de las flores",
        help_text=(
            "Cuánto se ven las flores en esta envoltura. "
            "Una envoltura pequeña las hace ver más grandes."
        ),
    )
    nudo_x = models.FloatField("nudo X", help_text="Dónde amarra el listón, fracción de la caja.")
    nudo_y = models.FloatField("nudo Y", help_text="Dónde amarra el listón, fracción de la caja.")
    nudo_ancho = models.FloatField("ancho del nudo", help_text="Fracción del ancho de la caja.")
    capacidad = models.PositiveIntegerField(
        "capacidad", help_text="Cuántas piezas caben de verdad en esta envoltura."
    )
    visible = models.BooleanField("visible", default=True)

    class Meta(Ordenable.Meta):
        verbose_name = "envoltura"
        verbose_name_plural = "envolturas"

    def __str__(self) -> str:
        return f"{self.label} ({self.tamano})"

    @property
    def imagen_url(self) -> str:
        return resolver_url_imagen(self, "imagen", "imagen_ruta")


class Ribbon(Ordenable):
    """Un liston para amarrar el ramo."""

    slug = models.SlugField("slug", max_length=40, unique=True)
    label = models.CharField("nombre", max_length=60)
    imagen = models.ImageField("imagen", upload_to="armador/listones/", blank=True, null=True)
    imagen_ruta = models.CharField("ruta de imagen", max_length=200, blank=True)
    aspect = models.FloatField("proporción", default=1.0)
    visible = models.BooleanField("visible", default=True)

    class Meta(Ordenable.Meta):
        verbose_name = "listón"
        verbose_name_plural = "listones"

    def __str__(self) -> str:
        return self.label

    @property
    def imagen_url(self) -> str:
        return resolver_url_imagen(self, "imagen", "imagen_ruta")
