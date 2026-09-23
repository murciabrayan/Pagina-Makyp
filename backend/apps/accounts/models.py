from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Usuario del sistema.

    Se define propio desde el primer día aunque hoy no agregue casi nada:
    cambiar el modelo de usuario con la base ya en marcha obliga a migrar a
    mano todas las tablas que apuntan a él. Hacerlo ahora es gratis.

    Quien administra el contenido es `is_staff`. No hay registro abierto: las
    cuentas las crea el equipo.
    """

    email = models.EmailField("correo", unique=True)
    telefono = models.CharField("teléfono", max_length=30, blank=True)

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    class Meta:
        verbose_name = "usuario"
        verbose_name_plural = "usuarios"

    def __str__(self) -> str:
        return self.get_full_name() or self.username
