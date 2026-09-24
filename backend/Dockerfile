# Imagen del backend de Makyp Creations.
#
# Se usa un Dockerfile explicito y no la deteccion automatica de la
# plataforma porque asi el despliegue es igual aqui que alla: la misma
# version de Python, las mismas dependencias y el mismo arranque. Cuando algo
# falla al desplegar, se puede reproducir en local con un solo comando en vez
# de adivinar que hizo el constructor de la plataforma.

FROM python:3.13-slim

# Sin buffer en la salida, para que los registros aparezcan al momento y no
# a trozos cuando el proceso se cierra. Sin .pyc, que no aportan nada en un
# contenedor que se reconstruye entero cada vez.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Las dependencias se copian e instalan antes que el codigo: mientras
# requirements.txt no cambie, esta capa se reaprovecha y cada despliegue
# tarda segundos en vez de minutos.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# El puerto real lo pone la plataforma en la variable PORT; este es solo el
# valor de respaldo para arrancar en local.
ENV PORT=8000
EXPOSE 8000

# El arranque hace cuatro cosas, en este orden:
#   1. migrate      pone la base al dia antes de atender nada
#   2. collectstatic reune los archivos del panel de Django
#   3. despertador  queda de fondo visitando la API cada diez minutos, para
#                   que el plan gratuito no apague el servicio (ver
#                   scripts/despertador.py)
#   4. gunicorn     sirve la aplicacion
#
# El despertador va entre llaves con su & dentro. Sin las llaves, el & se
# llevaria al fondo toda la cadena anterior, migraciones incluidas, y
# gunicorn arrancaria sin esperar a que terminen. `exec` hace que gunicorn
# reemplace al shell y reciba directamente la orden de apagado de Render.
#
# collectstatic va aqui y no en la construccion porque necesita la
# configuracion real (la clave secreta, la base), y esa solo existe al
# desplegar.
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && { python scripts/despertador.py & } && exec gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 60 --access-logfile - --error-logfile -"]
