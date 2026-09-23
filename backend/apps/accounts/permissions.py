from rest_framework import permissions


class LecturaPublicaEscrituraStaff(permissions.BasePermission):
    """
    Cualquiera puede leer; solo el equipo puede escribir.

    Es el permiso por defecto de toda la API: la tienda y el armador tienen
    que verse sin iniciar sesión, pero crear, editar o borrar exige una cuenta
    del equipo (`is_staff`).
    """

    def has_permission(self, request, view) -> bool:
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class SoloStaff(permissions.BasePermission):
    """Para lo que no debe verse desde fuera ni de lectura."""

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)
