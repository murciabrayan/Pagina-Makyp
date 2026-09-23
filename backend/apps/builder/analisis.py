"""
Mide una foto de flor para que nadie tenga que medirla a mano.

Antes, dar de alta una flor pedía cuatro números que solo se sacan abriendo
la imagen en un editor: el ancho y el alto del contenido real, y dónde cae el
centro de la cabeza. Pedírselo a quien administra la tienda es pedirle que
haga de tecnico, y un numero mal puesto no falla al guardar: falla despues,
con esa flor encimada sobre las otras dentro del ramo.

Todo eso está en la propia foto y se puede leer:

- **El contorno real.** Las fotos vienen con transparencia alrededor. El
  recuadro de píxeles opacos es el cuerpo de la flor, y de ahí sale la
  proporción entre alto y ancho.
- **El centro de la cabeza.** Es lo que el motor coloca, y no es el centro de
  la imagen: en una flor con tallo, la cabeza está arriba y el tallo ocupa la
  mitad de abajo. Se distingue por el ancho de cada fila — la cabeza es ancha,
  el tallo es una línea fina.

Lo único que NO se puede deducir es el tamaño real frente a las demás flores:
una foto de un girasol y una de una margarita pueden tener los mismos píxeles.
Eso lo elige una persona con una talla (pequeña, mediana, grande), que es un
juicio que cualquiera puede hacer de un vistazo.

No hace falta un modelo de inteligencia artificial para esto. Medir píxeles da
el mismo resultado siempre, tarda milisegundos y no se equivoca en el caso
raro; un modelo costaría dinero por foto, tardaría segundos y habría que
revisarlo igual.
"""

from dataclasses import dataclass, asdict

from PIL import Image

# Por debajo de esto un píxel se considera fondo. No es cero porque los bordes
# suavizados de un recorte dejan un halo casi transparente que, si contara,
# agrandaría el contorno unos píxeles por cada lado.
UMBRAL_ALFA = 12

# Qué tan ancha tiene que ser una fila, comparada con la más ancha, para
# considerarla parte de la cabeza. Un tallo ronda el 5% del ancho de la flor;
# los pétalos de abajo, que sí son cabeza, andan por encima del 40%.
CORTE_CABEZA = 0.38

# Tallas en unidades de escenario (el escenario mide 1000). Salen de las
# flores ya medidas a mano: margarita pequeña 110, rosa 151, margarita grande
# 200, gerbera 235, girasol 285, lirio 300.
TALLAS = {
    "pequena": 130,
    "mediana": 200,
    "grande": 270,
    "extra": 300,
}

ETIQUETAS_TALLA = {
    "pequena": "Pequeña — como una margarita de relleno",
    "mediana": "Mediana — como una rosa o una margarita grande",
    "grande": "Grande — como una gerbera o un girasol",
    "extra": "Extra grande — como un lirio",
}


@dataclass
class Medidas:
    """Lo que se saca de una foto."""

    #: Ancho del contenido real, en píxeles.
    ancho_px: int
    #: Alto del contenido real, en píxeles.
    alto_px: int
    #: alto / ancho del contenido real.
    proporcion: float
    #: Centro de la cabeza, en fracción del contorno recortado.
    anchor_x: float
    anchor_y: float
    #: Cuánto del alto ocupa la cabeza. Cerca de 1 = la flor es toda cabeza.
    porcion_cabeza: float
    #: True si la foto parece traer tallo (una zona fina y larga bajo la cabeza).
    tiene_tallo: bool
    #: Cuánto sobra alrededor del contenido. Mucho margen = conviene recortar.
    margen_desperdiciado: float

    def como_dict(self) -> dict:
        return asdict(self)


def _perfil_de_anchura(alfa: Image.Image) -> list[int]:
    """Cuántos píxeles opacos tiene cada fila, de arriba abajo."""
    ancho, alto = alfa.size
    datos = alfa.load()
    perfil = []
    for y in range(alto):
        cuenta = 0
        for x in range(ancho):
            if datos[x, y] >= UMBRAL_ALFA:
                cuenta += 1
        perfil.append(cuenta)
    return perfil


def medir(archivo) -> Medidas:
    """
    Mide una foto de flor.

    `archivo` es cualquier cosa que Pillow sepa abrir: una ruta o el archivo
    que llega de un formulario.
    """
    imagen = Image.open(archivo)
    imagen = imagen.convert("RGBA")
    ancho_original, alto_original = imagen.size

    alfa = imagen.getchannel("A")

    # El recuadro del contenido real. `getbbox` sobre una máscara binaria
    # ignora el fondo transparente, que es justo lo que sobra en estas fotos.
    mascara = alfa.point(lambda v: 255 if v >= UMBRAL_ALFA else 0)
    caja = mascara.getbbox()
    if caja is None:
        raise ValueError(
            "La imagen está completamente transparente o vacía. "
            "Asegúrate de subir un PNG o WebP con la flor recortada."
        )

    izquierda, arriba, derecha, abajo = caja
    ancho_px = derecha - izquierda
    alto_px = abajo - arriba

    recorte = mascara.crop(caja)
    perfil = _perfil_de_anchura(recorte)
    maximo = max(perfil) or 1

    # La cabeza: las filas anchas. Se busca desde arriba, porque una flor con
    # tallo tiene la cabeza arriba, y se corta en cuanto el ancho se desploma.
    limite = maximo * CORTE_CABEZA
    filas_cabeza = [i for i, cuenta in enumerate(perfil) if cuenta >= limite]

    if not filas_cabeza:
        # No debería pasar (la fila más ancha siempre pasa el corte), pero si
        # pasara, el centro geométrico es una respuesta razonable.
        centro_y = alto_px / 2
        primera = 0
        ultima = alto_px - 1
    else:
        primera = filas_cabeza[0]
        # Solo el primer tramo continuo: si la flor tiene hojas anchas abajo
        # del tallo, no son cabeza y no deben arrastrar el centro hacia abajo.
        ultima = primera
        for fila in filas_cabeza:
            if fila - ultima > max(2, alto_px * 0.04):
                break
            ultima = fila

        # Centro de masa del tramo, no su punto medio: los pétalos no se
        # reparten parejo y el centro de masa cae donde está el grueso.
        peso_total = sum(perfil[primera : ultima + 1]) or 1
        centro_y = (
            sum(perfil[y] * (y + 0.5) for y in range(primera, ultima + 1)) / peso_total
        )

    alto_cabeza = ultima - primera + 1
    porcion_cabeza = alto_cabeza / alto_px if alto_px else 1.0

    # El centro horizontal se mide solo sobre la cabeza, por el mismo motivo:
    # un tallo inclinado correría el centro de la imagen entera hacia un lado.
    datos = recorte.load()
    suma_x = 0.0
    peso_x = 0
    for y in range(primera, ultima + 1):
        for x in range(ancho_px):
            if datos[x, y] >= UMBRAL_ALFA:
                suma_x += x + 0.5
                peso_x += 1
    centro_x = suma_x / peso_x if peso_x else ancho_px / 2

    # ¿Trae tallo? Si bajo la cabeza sigue habiendo cuerpo pero mucho más
    # estrecho, eso es un tallo. Es lo que decide si la flor puede ir arriba
    # del ramo mostrando de dónde cuelga.
    filas_bajo = perfil[ultima + 1 :]
    hay_cuerpo_abajo = len(filas_bajo) > alto_px * 0.12
    estrecho = bool(filas_bajo) and (sum(filas_bajo) / len(filas_bajo)) < maximo * 0.35
    tiene_tallo = hay_cuerpo_abajo and estrecho

    area_original = ancho_original * alto_original
    margen = 1 - (ancho_px * alto_px) / area_original if area_original else 0.0

    return Medidas(
        ancho_px=ancho_px,
        alto_px=alto_px,
        proporcion=round(alto_px / ancho_px, 4) if ancho_px else 1.0,
        anchor_x=round(centro_x / ancho_px, 4) if ancho_px else 0.5,
        anchor_y=round(centro_y / alto_px, 4) if alto_px else 0.5,
        porcion_cabeza=round(porcion_cabeza, 4),
        tiene_tallo=tiene_tallo,
        margen_desperdiciado=round(margen, 4),
    )


def sugerir_campos(medidas: Medidas, talla: str) -> dict:
    """
    Traduce las medidas a los valores que guarda el modelo.

    La talla es lo único que pone la persona: el ancho en unidades de
    escenario sale de ahí, y el alto se deriva de la proporción de la foto
    para que la flor no salga deformada.
    """
    ancho = TALLAS.get(talla, TALLAS["mediana"])
    return {
        "ancho": float(ancho),
        "alto": round(ancho * medidas.proporcion, 1),
        "anchor_x": medidas.anchor_x,
        "anchor_y": medidas.anchor_y,
    }


def rol_sugerido(medidas: Medidas, talla: str) -> str | None:
    """
    Propone un papel dentro del ramo, pero solo cuando la forma no deja duda.

    Devuelve `None` casi siempre, y es a proposito. Se probo adivinarlo por la
    silueta contra las once flores ya cargadas y acertaba siete: confundia los
    lirios con flores de tallo y la rosa con una flor de cara. Un acierto de
    siete sobre once no sirve aqui, porque el papel es lo que decide donde va
    la flor y como se inclina; una sugerencia que falla un tercio de las veces
    invita a aceptarla sin mirar y el error aparece despues, en el ramo.

    Lo unico que la forma dice sin ambiguedad es la espiga: una pieza mas de
    dos veces y media mas alta que ancha solo puede ser una flor de linea, de
    las que suben por encima del ramo. Esa si se propone.

    Para el resto, el formulario pregunta con palabras que cualquiera entiende
    y no fuerza ninguna opcion de entrada.
    """
    if medidas.proporcion >= 2.6:
        return "spike"
    return None
