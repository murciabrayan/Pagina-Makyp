"""
El contenido editable de la pagina: textos, fotos del inicio y datos de
contacto. Todo lo que antes estaba escrito dentro de `frontend/src/data/`.
"""

from django.core.exceptions import ValidationError
from django.db import models

from apps.common import Ordenable, resolver_url_imagen


class SiteSettings(models.Model):
    """
    Los datos del negocio: telefono, correo, redes.

    Es una tabla de una sola fila. Se fuerza en `save`, porque si existieran
    dos la pagina tendria que elegir una y el equipo no sabria cual esta
    editando.
    """

    whatsapp = models.CharField(
        "WhatsApp",
        max_length=20,
        help_text="Con indicativo de país y sin espacios ni signos. Ejemplo: 573203684500",
    )
    whatsapp_visible = models.CharField(
        "WhatsApp como se muestra",
        max_length=30,
        help_text="Como se lee en la página. Ejemplo: +57 320 368 4500",
    )
    email = models.EmailField("correo")
    instagram = models.URLField("Instagram", blank=True)
    tiktok = models.URLField("TikTok", blank=True)
    facebook = models.URLField("Facebook", blank=True)
    ubicacion = models.CharField("ubicación", max_length=80, blank=True)

    actualizado = models.DateTimeField("actualizado", auto_now=True)

    class Meta:
        verbose_name = "datos del negocio"
        verbose_name_plural = "datos del negocio"

    def __str__(self) -> str:
        return "Datos del negocio"

    def save(self, *args, **kwargs):
        if not self.pk and SiteSettings.objects.exists():
            raise ValidationError(
                "Ya existen los datos del negocio: edita la fila que hay en vez de crear otra."
            )
        return super().save(*args, **kwargs)

    @classmethod
    def cargar(cls) -> "SiteSettings":
        """Devuelve la fila, creandola vacia la primera vez."""
        fila = cls.objects.first()
        if fila is None:
            fila = cls.objects.create(
                whatsapp="573203684500",
                whatsapp_visible="+57 320 368 4500",
                email="makyp.creations@gmail.com",
            )
        return fila


class HeroSlide(Ordenable):
    """Cada foto del carrusel del inicio."""

    imagen = models.ImageField("imagen", upload_to="inicio/", blank=True, null=True)
    imagen_ruta = models.CharField("ruta de imagen", max_length=200, blank=True)
    alt = models.CharField(
        "texto alternativo",
        max_length=140,
        blank=True,
        help_text="Qué se ve en la foto. Lo leen los lectores de pantalla y los buscadores.",
    )
    visible = models.BooleanField("visible", default=True)

    class Meta(Ordenable.Meta):
        verbose_name = "foto del inicio"
        verbose_name_plural = "fotos del inicio"

    def __str__(self) -> str:
        return self.alt or f"Foto {self.orden}"

    @property
    def imagen_url(self) -> str:
        return resolver_url_imagen(self, "imagen", "imagen_ruta")


class GalleryImage(Ordenable):
    """Fotos de la galeria social del inicio."""

    imagen = models.ImageField("imagen", upload_to="galeria/", blank=True, null=True)
    imagen_ruta = models.CharField("ruta de imagen", max_length=200, blank=True)
    alt = models.CharField("texto alternativo", max_length=140, blank=True)
    visible = models.BooleanField("visible", default=True)

    class Meta(Ordenable.Meta):
        verbose_name = "foto de la galería"
        verbose_name_plural = "fotos de la galería"

    def __str__(self) -> str:
        return self.alt or f"Foto {self.orden}"

    @property
    def imagen_url(self) -> str:
        return resolver_url_imagen(self, "imagen", "imagen_ruta")


class HelpItem(Ordenable):
    """
    Una pregunta de la pagina de ayuda.

    La respuesta tiene tres partes porque asi se escribieron las de verdad:
    unos parrafos, a veces una lista de pasos, y a veces una aclaracion al
    pie. Se guardan como texto con una linea por elemento, que es lo que se
    puede editar comodamente en un formulario; el serializador las entrega ya
    separadas en listas.
    """

    slug = models.SlugField(
        "slug",
        max_length=50,
        unique=True,
        help_text="Se usa como ancla en la dirección: /ayuda#envios. Cambiarlo rompe los enlaces.",
    )
    pregunta = models.CharField("pregunta", max_length=160)
    respuesta = models.TextField(
        "respuesta",
        help_text="Un párrafo por línea. Las líneas en blanco se ignoran.",
    )
    puntos = models.TextField(
        "lista de puntos",
        blank=True,
        help_text="Opcional. Un punto por línea, cuando la respuesta se lee mejor como lista.",
    )
    nota = models.CharField(
        "nota al pie",
        max_length=300,
        blank=True,
        help_text="Opcional. Una aclaración corta debajo de la respuesta.",
    )
    visible = models.BooleanField("visible", default=True)

    class Meta(Ordenable.Meta):
        verbose_name = "pregunta de ayuda"
        verbose_name_plural = "preguntas de ayuda"

    def __str__(self) -> str:
        return self.pregunta

    @staticmethod
    def _lineas(texto: str) -> list[str]:
        return [linea.strip() for linea in (texto or "").splitlines() if linea.strip()]

    @property
    def parrafos(self) -> list[str]:
        return self._lineas(self.respuesta)

    @property
    def lista(self) -> list[str]:
        return self._lineas(self.puntos)


class ValueProp(Ordenable):
    """Los motivos para comprar que se muestran en el inicio."""

    # Los nombres son los iconos de lucide-react que el frontend sabe pintar.
    # Agregar uno aqui sin agregarlo tambien al mapa de ValueProps.tsx deja el
    # motivo sin icono.
    ICONOS = [
        ("hand-heart", "Mano con corazón"),
        ("palette", "Paleta de colores"),
        ("gift", "Regalo"),
        ("messages-square", "Mensajes"),
        ("sparkles", "Destellos"),
        ("truck", "Camión"),
        ("flower", "Flor"),
        ("clock", "Reloj"),
    ]

    icono = models.CharField("icono", max_length=20, choices=ICONOS, default="hand-heart")
    titulo = models.CharField("título", max_length=80)
    descripcion = models.CharField("descripción", max_length=200)
    visible = models.BooleanField("visible", default=True)

    class Meta(Ordenable.Meta):
        verbose_name = "motivo para comprar"
        verbose_name_plural = "motivos para comprar"

    def __str__(self) -> str:
        return self.titulo
