"""Base comun de los ViewSets de contenido."""

from rest_framework import viewsets


class DobleSerializerViewSet(viewsets.ModelViewSet):
    """
    Un ViewSet que habla dos idiomas segun quien pregunte.

    Leer devuelve la forma publica, que es la que consume la tienda y que no
    debe cambiar aunque el modelo cambie por dentro. Crear y editar usa la
    forma de administracion, con los campos del modelo tal cual, que es lo que
    necesita un formulario.

    La excepcion es leer desde el panel: alli hacen falta los campos completos
    (el `id` numerico, el `orden`, lo que esta oculto), asi que se pide con
    `?admin=1` y solo funciona para el equipo, porque el queryset de
    administracion tambien incluye lo que esta sin publicar.
    """

    serializer_public = None
    serializer_admin = None

    def _es_vista_admin(self) -> bool:
        usuario = self.request.user
        pidio_admin = self.request.query_params.get("admin") in {"1", "true", "yes"}
        return bool(pidio_admin and usuario.is_authenticated and usuario.is_staff)

    def get_serializer_class(self):
        if self.action in {"list", "retrieve"} and not self._es_vista_admin():
            return self.serializer_public
        return self.serializer_admin

    def get_queryset(self):
        qs = super().get_queryset()
        if self._es_vista_admin() or self.action not in {"list", "retrieve"}:
            return qs
        return self.filtrar_publicos(qs)

    def filtrar_publicos(self, qs):
        """Lo que no esta visible no sale en la tienda."""
        return qs.filter(visible=True)
