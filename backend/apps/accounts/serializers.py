from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    nombre = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "nombre", "is_staff", "is_superuser"]
        read_only_fields = fields

    def get_nombre(self, obj) -> str:
        return obj.get_full_name() or obj.username


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, datos):
        usuario = authenticate(
            request=self.context.get("request"),
            username=datos["username"],
            password=datos["password"],
        )

        # Un mensaje unico para usuario inexistente y clave incorrecta: si se
        # distinguieran, cualquiera podria averiguar que cuentas existen.
        if usuario is None:
            raise serializers.ValidationError(
                {"detail": "Usuario o contraseña incorrectos."}, code="authorization"
            )
        if not usuario.is_active:
            raise serializers.ValidationError(
                {"detail": "Esta cuenta está desactivada."}, code="authorization"
            )
        if not usuario.is_staff:
            raise serializers.ValidationError(
                {"detail": "Esta cuenta no tiene acceso al panel."}, code="authorization"
            )

        datos["user"] = usuario
        return datos
