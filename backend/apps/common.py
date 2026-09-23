"""Piezas que comparten todas las apps de contenido."""

from django.conf import settings
from django.db import models


class Ordenable(models.Model):
    """
    Casi todo lo que administra el equipo se muestra en un orden que ellos
    deciden: las categorías del inicio, las flores del armador, las preguntas
    de ayuda. Se guarda un número y se ordena por él, para que reacomodar la
    página no dependa del nombre ni de la fecha de creación.
    """

    orden = models.PositiveIntegerField("orden", default=0, db_index=True)
    creado = models.DateTimeField("creado", auto_now_add=True)
    actualizado = models.DateTimeField("actualizado", auto_now=True)

    class Meta:
        abstract = True
        ordering = ["orden", "id"]


def resolver_url_imagen(instancia, campo_subido: str, campo_ruta: str) -> str:
    """
    Devuelve la URL de una imagen, venga de donde venga.

    El sitio nació con las fotos dentro del frontend (`/builder/flores/rosa.webp`
    y demás, unas 130 piezas del armador). Migrarlas todas a la base de datos
    no aportaría nada: son parte del diseño, no del catálogo, y servirlas desde
    Django solo las haría más lentas.

    Por eso cada imagen tiene dos campos. `*_ruta` es la foto que ya vive en el
    frontend y se sirve como archivo estático. `*_imagen` es lo que sube el
    equipo desde el panel, que sí va a la base de datos. Si hay subida, manda
    la subida; si no, se usa la ruta de siempre. Así se puede reemplazar
    cualquier foto original sin migrar nada de antemano.
    """

    subida = getattr(instancia, campo_subido, None)
    if subida:
        return subida.url

    ruta = getattr(instancia, campo_ruta, "") or ""
    if not ruta:
        return ""
    base = settings.FRONTEND_ASSET_BASE_URL.rstrip("/")
    return f"{base}{ruta}" if base else ruta
