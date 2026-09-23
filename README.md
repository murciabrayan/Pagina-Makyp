# Makyp Creations

Landing y tienda de **Makyp Creations**, un emprendimiento colombiano de detalles
artesanales hechos con limpiapipas: flores, ramos, macetas, muñequitos y llaveros.

El pedido se cierra por **WhatsApp**: no hay pasarela de pago. Cada botón arma un
mensaje con lo que el cliente eligió y abre el chat con ese texto ya escrito.

Desde el panel, el equipo administra todo lo que ve el cliente sin tocar código:
los productos, las piezas del armador de ramos y los textos de la página.

```
makyp/
  frontend/   React + Vite. La tienda y el panel.
  backend/    Django + PostgreSQL. La API.
```

## Levantarlo

Hacen falta **Node 20+**, **Python 3.11+** y **PostgreSQL** corriendo.

### 1. Base de datos

```bash
createdb -U postgres makyp
```

### 2. Backend

```bash
cd backend
py -m venv .venv                       # en Linux/Mac: python3 -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt

cp .env.example .env                   # y escribe dentro POSTGRES_PASSWORD

.venv/Scripts/python.exe manage.py migrate
.venv/Scripts/python.exe manage.py createsuperuser
.venv/Scripts/python.exe manage.py cargar_datos_iniciales
.venv/Scripts/python.exe manage.py runserver
```

La API queda en `http://localhost:8000/api/`.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

La tienda queda en `http://localhost:5173`, y el panel en `/admin/login`.

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Revisa los tipos y compila a `dist/` |
| `npm run lint` | ESLint sobre todo el proyecto |

## Cómo está organizado el frontend

```
src/
  data/        Lo poco que sigue en el código: los enlaces del menú, las
               plantillas de los mensajes de WhatsApp y el teléfono de
               respaldo. El resto del contenido vive en la base de datos.
  lib/         Lógica pura y el cliente de la API.
  hooks/       Traer datos y administrarlos.
  context/     Sesión, contenido del sitio y carrito.
  components/
    layout/    Cabecera, pie, navegación, botón flotante de WhatsApp.
    sections/  Bloques de la página de inicio.
    ui/        Piezas reutilizables.
    admin/     Las piezas del panel: formularios, tablas, ruta protegida.
  pages/       Una por ruta. `pages/admin/` son las del panel.
  styles/      Tokens de diseño en variables CSS; Tailwind los consume.
```

Los colores, tipografías, sombras y radios se definen una sola vez en
`src/styles/globals.css` y `tailwind.config.ts` los expone como utilidades
(`text-brand-700`, `shadow-card`, `font-display`…). Para cambiar la paleta de
toda la web se editan esas variables, no las clases.

## Cómo está organizado el backend

```
apps/
  accounts/   Usuarios y sesión.
  catalog/    Productos y categorías.
  builder/    Flores, envolturas, listones y la paleta de colores.
  content/    Textos, fotos del inicio, preguntas de ayuda, datos de contacto.
config/       Ajustes y rutas.
scripts/      El exportador que sacó los datos originales del frontend.
```

Cada app tiene **dos serializadores por modelo**, y la distinción importa:

- El **público** entrega los datos con la forma exacta que la tienda ya
  consumía cuando vivían escritos en el frontend. Por eso el motor de armado
  (`lib/bouquet.ts`) no cambió ni una línea: solo cambió de dónde vienen las
  piezas.
- El **de administración** trabaja con los campos del modelo tal cual, que es
  lo que necesita un formulario.

### Las direcciones

| Ruta | Para qué |
| --- | --- |
| `GET /api/bootstrap/` | Todo lo que la web necesita para pintarse, en un solo viaje |
| `GET /api/builder/bundle/` | El armador completo: flores, envolturas, listones, paleta |
| `/api/catalog/products/` | Los productos, con alta y edición para el equipo |
| `/api/catalog/categories/` | Las categorías |
| `/api/builder/flowers/` · `wrappers/` · `ribbons/` · `colors/` | Piezas del armador |
| `/api/content/hero/` · `gallery/` · `help/` · `value-props/` · `site/` | Contenido |
| `/api/auth/login/` · `refresh/` · `logout/` · `me/` | Sesión |

Leer es público. Escribir exige una cuenta con `is_staff`. El panel pide las
listas con `?admin=1`, que además devuelve lo que está sin publicar.

### Cómo funciona la sesión

El token de acceso dura 15 minutos y **vive solo en memoria** del navegador. No
se guarda en `localStorage` a propósito: cualquier script que se cuele en la
página puede leer `localStorage`, y con el token robado se clona la sesión.

El token largo (el refresh, 7 días) viaja en una cookie `httpOnly`, que
JavaScript no puede leer. Al recargar la página, el frontend cambia esa cookie
por un token nuevo. Por eso lo primero que hace al arrancar es llamar a
`/auth/refresh/`, y por eso el panel espera un instante antes de decidir si
mandarte al login.

## El armador de ramos

Es la parte más densa del proyecto y ahora vive en dos sitios:

- **La base de datos** guarda las piezas. El ancho, el alto y el anclaje de
  cada flor **no son valores a ojo**: salen de medir la foto recortada al
  contenido real y de ubicar el centro de la cabeza. El ancho está a escala
  real entre flores (un lirio de 300 es de verdad casi tres veces más ancho que
  una margarita de 110). Si se carga una flor nueva con medidas inventadas, el
  motor la coloca encima de las vecinas o fuera del ramo. El panel lo advierte
  en esa pantalla.
- **`frontend/src/lib/bouquet.ts`** es el motor. No coloca las flores en una
  cuadrícula: para cada una prueba 160 posiciones y se queda con la que mejor
  calza contra las que ya están puestas. Cada pieza ocupa la elipse real de su
  foto, las margaritas de relleno se meten en las junturas entre flores
  grandes, y el follaje se abre en abanico desde el amarre. El azar es
  determinista: el mismo ramo se ve siempre igual.

El `rol` de cada flor (cara, tallo, espiga, relleno, follaje) decide dónde y
cómo participa.

## Las fotos

Hay dos orígenes y conviene entender por qué:

- Las que ya venían con el sitio (unas 130 piezas del armador, más los
  productos) viven en `frontend/public/` y se referencian por su ruta. Son
  parte del diseño, no del catálogo, y servirlas desde Django solo las haría
  más lentas.
- Las que sube el equipo desde el panel van a `backend/media/`.

Cada modelo tiene los dos campos. Si hay una foto subida, manda esa; si no, se
usa la ruta de siempre. Así se puede reemplazar cualquier foto original desde
el panel sin migrar nada de antemano.

## Despliegue

El frontend va a Firebase Hosting (proyecto `makyp-6ed4d`):

```bash
cd frontend && npm run build
firebase deploy
```

Las cabeceras de caché de `firebase.json` van en tres grupos, y la distinción
importa:

- `/assets/**` — los bundles que genera Vite llevan un hash en el nombre, así
  que su contenido nunca cambia: caché de un año, `immutable`.
- Las imágenes — viven en `public/` y **conservan su nombre** al cambiar de
  contenido. Por eso caducan a diario en vez de ser `immutable`: si no,
  reemplazar la foto de un producto no le llegaría durante un año a quien ya
  visitó el sitio.
- `index.html` — `no-cache`, porque es el que reparte las rutas nuevas de los
  bundles.

El backend necesita un servidor aparte (Firebase Hosting solo sirve archivos).
Antes de publicarlo hay que poner `DJANGO_DEBUG=False`, una `DJANGO_SECRET_KEY`
nueva, los dominios reales en `DJANGO_ALLOWED_HOSTS` y `DJANGO_CORS_ALLOWED_ORIGINS`,
y servir `media/` desde el servidor web o un bucket, no desde Django.

## Pendientes conocidos

- **Categorías sin productos.** `flores` y `llaveros` están en el menú sin
  productos. Ahora se ve avisado en el resumen del panel, y esas vistas ofrecen
  encargar por WhatsApp en lugar de quedar en blanco.
- **Variantes de color de las flores.** Se administran desde el admin de
  Django (`/admin`), dentro de cada flor. El panel propio todavía no tiene esa
  pantalla.
- **Imagen para compartir.** El `og:image` apunta a `/hero/ramo-hero.webp`
  (900×981). Lo ideal es una imagen dedicada de 1200×630. Si algún día hay
  dominio propio, hay que cambiar la URL absoluta en `frontend/index.html`,
  `frontend/public/robots.txt` y `frontend/public/sitemap.xml`.
- **Medición.** `frontend/src/lib/analytics.ts` entrega los eventos a
  `window.dataLayer` si existe. Para activarla basta pegar el snippet de Google
  Tag Manager en `index.html`; no hay que tocar ninguna llamada a `track()`.
