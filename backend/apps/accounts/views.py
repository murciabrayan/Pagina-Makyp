"""
Inicio de sesion con JWT y el refresh guardado en cookie httpOnly.

Por que asi: un JWT guardado en `localStorage` lo puede leer cualquier script
que entre en la pagina, y con el token robado la sesion se clona entera. La
cookie httpOnly no es accesible desde JavaScript, asi que el token largo (el
refresh, que dura dias) queda fuera del alcance de un XSS.

El corto (el access, 15 minutos) si viaja al frontend, pero se guarda en
memoria: no sobrevive a recargar la pagina, y al recargar se pide uno nuevo
con la cookie. Esa es la parte que hay que entender del flujo: el frontend
arranca sin token y lo primero que hace es llamar a `refresh`.
"""

from django.conf import settings
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import LoginSerializer, UserSerializer


def _poner_cookie_refresh(respuesta: Response, refresh: str) -> Response:
    respuesta.set_cookie(
        settings.REFRESH_COOKIE_NAME,
        refresh,
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        path="/api/auth/",
    )
    return respuesta


class LoginView(APIView):
    """Entrega el access en el cuerpo y deja el refresh en la cookie."""

    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        usuario = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(usuario)
        respuesta = Response(
            {"access": str(refresh.access_token), "user": UserSerializer(usuario).data}
        )
        return _poner_cookie_refresh(respuesta, str(refresh))


class RefreshView(APIView):
    """Cambia la cookie por un access nuevo. Es lo primero que llama el panel."""

    permission_classes = [AllowAny]
    authentication_classes: list = []

    def post(self, request):
        crudo = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
        if not crudo:
            return Response(
                {"detail": "No hay sesión iniciada."}, status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            refresh = RefreshToken(crudo)
        except TokenError:
            # cookie vencida o manipulada: se borra para no reintentar en bucle
            respuesta = Response(
                {"detail": "La sesión expiró, vuelve a entrar."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            respuesta.delete_cookie(settings.REFRESH_COOKIE_NAME, path="/api/auth/")
            return respuesta

        access = str(refresh.access_token)

        # Con la rotacion activada el refresh usado se invalida y se emite
        # otro, para que un token robado sirva una sola vez.
        if settings.SIMPLE_JWT.get("ROTATE_REFRESH_TOKENS"):
            try:
                refresh.blacklist()
            except AttributeError:
                pass
            usuario_id = refresh.payload.get("user_id")
            from django.contrib.auth import get_user_model

            usuario = get_user_model().objects.filter(pk=usuario_id).first()
            if usuario is None or not usuario.is_active:
                return Response(
                    {"detail": "La cuenta ya no está activa."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            nuevo = RefreshToken.for_user(usuario)
            respuesta = Response({"access": str(nuevo.access_token)})
            return _poner_cookie_refresh(respuesta, str(nuevo))

        return Response({"access": access})


class LogoutView(APIView):
    """Invalida el refresh y borra la cookie."""

    permission_classes = [AllowAny]
    authentication_classes: list = []

    def post(self, request):
        crudo = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
        if crudo:
            try:
                RefreshToken(crudo).blacklist()
            except (TokenError, AttributeError):
                # ya estaba vencido o en la lista negra: el resultado que
                # busca quien cierra sesion es el mismo
                pass

        respuesta = Response(status=status.HTTP_204_NO_CONTENT)
        respuesta.delete_cookie(settings.REFRESH_COOKIE_NAME, path="/api/auth/")
        return respuesta


class MeView(APIView):
    """Quien soy. El panel la usa para pintar el nombre y comprobar permisos."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class CambiarPasswordView(APIView):
    permission_classes = [IsAuthenticated]

    class _Entrada(serializers.Serializer):
        actual = serializers.CharField()
        nueva = serializers.CharField(min_length=8)

    def post(self, request):
        entrada = self._Entrada(data=request.data)
        entrada.is_valid(raise_exception=True)

        if not request.user.check_password(entrada.validated_data["actual"]):
            return Response(
                {"actual": ["La contraseña actual no coincide."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError

        try:
            validate_password(entrada.validated_data["nueva"], request.user)
        except DjangoValidationError as error:
            return Response({"nueva": list(error.messages)}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(entrada.validated_data["nueva"])
        request.user.save(update_fields=["password"])
        return Response(status=status.HTTP_204_NO_CONTENT)
