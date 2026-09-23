"""
Llena la base con el contenido que hoy vive escrito dentro del frontend.

Se corre una vez al montar el proyecto, y se puede repetir sin miedo: todo va
por `update_or_create` contra el slug, asi que correrlo dos veces deja la base
igual que correrlo una. Eso importa porque si falla a la mitad (una foto que
no esta, un dato mal escrito) se arregla y se vuelve a lanzar, sin tener que
vaciar nada.

Las fotos NO se copian: se guarda la ruta que ya tienen dentro del frontend.
El motivo esta explicado en `apps/common.resolver_url_imagen`.

    python manage.py cargar_datos_iniciales
"""

import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.builder.models import Flower, FlowerColor, FlowerVariant, Ribbon, Wrapper
from apps.catalog.models import Category, Product
from apps.content.models import GalleryImage, HelpItem, HeroSlide, SiteSettings, ValueProp

JSON_POR_DEFECTO = Path(__file__).resolve().parents[4] / "scripts" / "datos_iniciales.json"


class Command(BaseCommand):
    help = "Carga en la base los datos que estaban escritos en frontend/src/data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--archivo",
            default=str(JSON_POR_DEFECTO),
            help="Ruta del JSON que genera scripts/exportar_datos_frontend.mjs",
        )

    def handle(self, *args, **opciones):
        ruta = Path(opciones["archivo"])
        if not ruta.exists():
            raise CommandError(
                f"No encuentro {ruta}.\n"
                "Genera el archivo antes con:\n"
                "  node scripts/exportar_datos_frontend.mjs"
            )

        datos = json.loads(ruta.read_text(encoding="utf-8"))

        # Todo o nada: si algo falla a mitad de camino, no queremos media
        # tienda cargada y medio armador sin flores.
        with transaction.atomic():
            colores = self._colores(datos)
            self._flores(datos, colores)
            self._envolturas(datos)
            self._listones(datos)
            categorias = self._categorias(datos)
            self._productos(datos, categorias)
            self._sitio(datos)
            self._inicio(datos)
            self._ayuda(datos)
            self._motivos(datos)

        self.stdout.write(self.style.SUCCESS("\nListo. La base quedó con el contenido actual."))

    # ---------------------------------------------------------------- armador

    def _colores(self, datos) -> dict[str, FlowerColor]:
        mapa = {}
        for posicion, color in enumerate(datos["colors"]):
            fila, _ = FlowerColor.objects.update_or_create(
                slug=color["id"],
                defaults={
                    "label": color["label"],
                    "swatch": color["swatch"],
                    "orden": posicion,
                },
            )
            mapa[color["id"]] = fila
        self._contar("colores", len(mapa))
        return mapa

    def _flores(self, datos, colores: dict[str, FlowerColor]) -> None:
        variantes_por_flor = datos["colorVariants"]
        total_variantes = 0

        for posicion, flor in enumerate(datos["flowers"]):
            config = variantes_por_flor.get(flor["id"])
            base = colores.get(config["base"]) if config else None
            tallo = flor.get("stem") or {}

            fila, _ = Flower.objects.update_or_create(
                slug=flor["id"],
                defaults={
                    "label": flor["label"],
                    "rol": flor["role"],
                    "imagen_ruta": flor["image"],
                    "ancho": flor["w"],
                    "alto": flor["h"],
                    "anchor_x": flor["anchor"]["x"],
                    "anchor_y": flor["anchor"]["y"],
                    "tallo_imagen_ruta": tallo.get("image", ""),
                    "tallo_ancho": tallo.get("w"),
                    "tallo_alto": tallo.get("h"),
                    "tallo_anchor_x": (tallo.get("anchor") or {}).get("x"),
                    "tallo_anchor_y": (tallo.get("anchor") or {}).get("y"),
                    "color_base": base,
                    "orden": posicion,
                },
            )

            if not config:
                continue

            for slug_color, imagenes in config["variants"].items():
                color = colores.get(slug_color)
                if color is None:
                    self.stderr.write(
                        self.style.WARNING(
                            f"  La flor {flor['id']} declara el color {slug_color}, "
                            "que no está en la paleta. Se omite esa variante."
                        )
                    )
                    continue
                FlowerVariant.objects.update_or_create(
                    flor=fila,
                    color=color,
                    defaults={
                        "imagen_ruta": imagenes["image"],
                        "tallo_imagen_ruta": imagenes.get("stem", ""),
                    },
                )
                total_variantes += 1

        self._contar("flores", len(datos["flowers"]))
        self._contar("variantes de color", total_variantes)

    def _envolturas(self, datos) -> None:
        for posicion, envoltura in enumerate(datos["wrappers"]):
            Wrapper.objects.update_or_create(
                slug=envoltura["id"],
                defaults={
                    "label": envoltura["label"],
                    "tamano": envoltura["size"],
                    "imagen_ruta": envoltura["image"],
                    "aspect": envoltura["aspect"],
                    "cluster_x": envoltura["cluster"]["x"],
                    "cluster_y": envoltura["cluster"]["y"],
                    "cluster_r": envoltura["clusterR"],
                    "escala_flores": envoltura["flowerScale"],
                    "nudo_x": envoltura["knot"]["x"],
                    "nudo_y": envoltura["knot"]["y"],
                    "nudo_ancho": envoltura["knot"]["w"],
                    "capacidad": envoltura["capacity"],
                    "orden": posicion,
                },
            )
        self._contar("envolturas", len(datos["wrappers"]))

    def _listones(self, datos) -> None:
        for posicion, liston in enumerate(datos["ribbons"]):
            Ribbon.objects.update_or_create(
                slug=liston["id"],
                defaults={
                    "label": liston["label"],
                    "imagen_ruta": liston["image"],
                    "aspect": liston["aspect"],
                    "orden": posicion,
                },
            )
        self._contar("listones", len(datos["ribbons"]))

    # ---------------------------------------------------------------- catalogo

    def _categorias(self, datos) -> dict[str, Category]:
        mapa = {}
        for posicion, categoria in enumerate(datos["categories"]):
            fila, _ = Category.objects.update_or_create(
                slug=categoria["slug"],
                defaults={
                    "titulo": categoria["title"],
                    "subtitulo": categoria.get("subtitle", ""),
                    "imagen_ruta": categoria["image"],
                    "orden": posicion,
                },
            )
            mapa[categoria["slug"]] = fila
        self._contar("categorías", len(mapa))
        return mapa

    def _productos(self, datos, categorias: dict[str, Category]) -> None:
        creados = 0
        for posicion, producto in enumerate(datos["products"]):
            categoria = categorias.get(producto["category"])
            if categoria is None:
                self.stderr.write(
                    self.style.WARNING(
                        f"  El producto '{producto['name']}' apunta a la categoría "
                        f"'{producto['category']}', que no existe. Se omite."
                    )
                )
                continue

            # El id del JSON es el que tenia en el frontend; se conserva para
            # que los enlaces y el carrito guardado sigan apuntando a lo mismo.
            Product.objects.update_or_create(
                id=producto["id"],
                defaults={
                    "nombre": producto["name"],
                    "precio": producto["price"],
                    "categoria": categoria,
                    "imagen_ruta": producto["image"],
                    "etiqueta": producto.get("badge", "") or "",
                    "descripcion": producto.get("description", "") or "",
                    "incluye": producto.get("includes", "") or "",
                    "orden": posicion,
                },
            )
            creados += 1
        self._contar("productos", creados)
        self._reiniciar_secuencia(Product)

    # ---------------------------------------------------------------- contenido

    def _sitio(self, datos) -> None:
        sitio = datos["site"]
        fila = SiteSettings.cargar()
        fila.whatsapp = sitio["whatsapp"]["phone"]
        fila.whatsapp_visible = sitio["whatsapp"]["displayPhone"]
        fila.email = sitio["email"]
        fila.instagram = sitio.get("instagram", "")
        fila.tiktok = sitio.get("tiktok", "")
        # En el frontend el enlace de Facebook era '#', un marcador de que
        # todavia no hay pagina. Como URLField eso no es valido, se deja vacio.
        facebook = sitio.get("facebook", "")
        fila.facebook = facebook if facebook.startswith("http") else ""
        fila.ubicacion = sitio.get("location", "")
        fila.save()
        self._contar("datos del negocio", 1)

    def _inicio(self, datos) -> None:
        for posicion, foto in enumerate(datos["hero"]):
            HeroSlide.objects.update_or_create(
                imagen_ruta=foto["image"],
                defaults={"alt": foto["alt"], "orden": posicion},
            )
        self._contar("fotos del inicio", len(datos["hero"]))

        for posicion, ruta in enumerate(datos["gallery"]):
            GalleryImage.objects.update_or_create(
                imagen_ruta=ruta,
                defaults={"alt": "Detalle hecho a mano por Makyp Creations", "orden": posicion},
            )
        self._contar("fotos de la galería", len(datos["gallery"]))

    def _ayuda(self, datos) -> None:
        for posicion, item in enumerate(datos["help"]):
            HelpItem.objects.update_or_create(
                slug=item["id"],
                defaults={
                    "pregunta": item["question"],
                    "respuesta": "\n".join(item.get("answer", [])),
                    "puntos": "\n".join(item.get("list", []) or []),
                    "nota": item.get("note", "") or "",
                    "orden": posicion,
                },
            )
        self._contar("preguntas de ayuda", len(datos["help"]))

    def _motivos(self, datos) -> None:
        for posicion, motivo in enumerate(datos["valueProps"]):
            ValueProp.objects.update_or_create(
                titulo=motivo["title"],
                defaults={
                    "icono": motivo["icon"],
                    "descripcion": motivo["description"],
                    "orden": posicion,
                },
            )
        self._contar("motivos para comprar", len(datos["valueProps"]))

    # ---------------------------------------------------------------- utilidades

    def _reiniciar_secuencia(self, modelo) -> None:
        """
        Pone el contador de ids por encima del mayor que acabamos de insertar.

        Los productos se cargan con el id que traian, saltandose la secuencia
        de Postgres. Si no se adelanta, el primer producto que cree el equipo
        desde el panel intentaria usar el id 1, que ya existe, y fallaria.
        """
        from django.db import connection

        tabla = modelo._meta.db_table
        with connection.cursor() as cursor:
            cursor.execute(
                f"SELECT setval(pg_get_serial_sequence('{tabla}', 'id'), "
                f"COALESCE((SELECT MAX(id) FROM {tabla}), 1))"
            )

    def _contar(self, etiqueta: str, cuantos: int) -> None:
        self.stdout.write(f"  {etiqueta:.<28} {cuantos}")
