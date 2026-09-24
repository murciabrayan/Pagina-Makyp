"""
Mantiene despierto el servidor gratuito de Render.

Render apaga el servicio tras quince minutos sin visitas, y volver a
encenderlo tarda casi un minuto. Este programa corre al lado de Django, en el
mismo contenedor, y cada diez minutos visita la API por su direccion publica.
Esa visita entra por la puerta de Render como la de cualquier cliente, asi
que cuenta como actividad y el servicio no llega nunca a dormirse.

Visita /api/salud/, que responde sin tocar la base de datos. Si visitara
algo que consulta la base, la mantendria encendida tambien a ella las
veinticuatro horas, y Neon cobra por horas encendida, no por uso.

Tiene un punto debil, y por eso no va solo: si Render apagara el servicio por
cualquier otro motivo, este programa se apaga con el, y no queda nadie que lo
despierte. Para eso esta la tarea de GitHub (.github/workflows/despertar.yml),
que hace la misma visita desde fuera.

Solo usa la libreria estandar, a proposito: no carga Django ni abre la base,
y no puede tumbar el servidor si algo sale mal aqui.
"""

import os
import sys
import time
import urllib.request

# Render pone esta variable sola en cada servicio web, con su direccion
# publica. Fuera de Render no existe, y entonces no hay nada que mantener.
BASE = os.environ.get("RENDER_EXTERNAL_URL", "").rstrip("/")
RUTA = "/api/salud/"

# Diez minutos deja cinco de margen antes de los quince del apagado.
CADA_SEGUNDOS = 10 * 60
# Se espera un poco al arrancar para no visitar un servidor que aun no escucha.
ESPERA_INICIAL = 60


def avisar(texto: str) -> None:
    # flush: sin el, los registros de Render lo mostrarian a trozos o nunca.
    print(f"despertador: {texto}", flush=True)


def visitar() -> None:
    inicio = time.monotonic()
    peticion = urllib.request.Request(BASE + RUTA, headers={"User-Agent": "makyp-despertador"})
    with urllib.request.urlopen(peticion, timeout=90) as respuesta:
        respuesta.read()
        milisegundos = (time.monotonic() - inicio) * 1000
        avisar(f"ok, HTTP {respuesta.status} en {milisegundos:.0f} ms")


def main() -> None:
    if not BASE:
        avisar("sin RENDER_EXTERNAL_URL, no hace falta mantener nada despierto")
        return

    avisar(f"visitara {BASE}{RUTA} cada {CADA_SEGUNDOS // 60} minutos")
    time.sleep(ESPERA_INICIAL)
    while True:
        # Nada de aqui dentro puede cortar el bucle: una visita fallida es
        # solo eso, y la siguiente se intenta igual.
        try:
            visitar()
        except Exception as fallo:  # noqa: BLE001
            avisar(f"fallo la visita ({fallo}); se reintenta en el siguiente turno")
        time.sleep(CADA_SEGUNDOS)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)
