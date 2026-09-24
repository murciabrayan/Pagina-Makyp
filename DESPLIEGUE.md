# Poner Makyp Creations en internet

Guía para desplegar el sitio completo **gratis y sin dar tarjeta** (salvo
Cloudflare, que ya tienes hecho). Calcula una hora la primera vez; las
siguientes actualizaciones son un `git push`.

## Cómo queda repartido

| Parte | Dónde | Por qué ahí |
| --- | --- | --- |
| La tienda (React) | **Firebase Hosting** | Ya está configurado y funcionando |
| La API (Django) | **Render** | Plan gratis sin tarjeta |
| La base de datos | **Neon** | Gratis para siempre, sin tarjeta y **no borra los datos** |
| Las fotos que sube Maira | **Cloudflare R2** | 10 GB gratis y sin cobro por descargas |

**Por qué la base va aparte y no en Render.** El PostgreSQL gratuito de Render
**se borra a los 30 días** de creado: pasado ese mes tendrías que empezar de
cero. El de Neon no caduca; se duerme si nadie lo usa, pero despierta en menos
de medio segundo y los datos siguen intactos.

**Lo único que hay que vigilar de Render** es que apaga el servicio tras 15
minutos sin visitas, y volver a encenderlo tarda casi un minuto. Como tus
clientes llegan por un enlace de WhatsApp, el primero que lo abriera se
encontraría la pantalla colgada. El **paso 6** lo resuelve con una visita
automática cada 10 minutos, gratis y sin tarjeta.

---

## Antes de empezar

Render despliega **desde GitHub**, así que el código tiene que estar subido.
Ya lo está: en `github.com/murciabrayan/Pagina-Makyp` aparecen las carpetas
`frontend/` y `backend/`, esta última con sus 56 archivos y el `Dockerfile`.

> Los archivos `.env` están excluidos del repositorio a propósito: las claves
> nunca se suben, se escriben en el panel de cada servicio.

Ten a mano el nombre del repositorio y la rama (`master`).

---

## Paso 1 · Las fotos (Cloudflare R2)

*Si ya lo hiciste, salta al paso 2; solo necesitas tener apuntados los cinco
datos del punto 5.*

1. Entra en [dash.cloudflare.com](https://dash.cloudflare.com) y crea una
   cuenta. En **R2** te pedirá una tarjeta para activarlo; no cobra nada
   dentro de los 10 GB.
2. **Create bucket**, nómbralo `makyp-fotos`, región automática.
3. Dentro del bucket, pestaña **Settings**, busca el apartado **Public
   Development URL** y habilítalo. Copia la dirección que te da, algo como
   `https://pub-xxxxx.r2.dev`.

   > En la documentación y en muchos tutoriales esto aparece como "R2.dev
   > subdomain": es lo mismo, Cloudflare le cambió el nombre. Si ves
   > *"The public development URL is disabled for this bucket"*, estás en el
   > sitio correcto.
4. Vuelve a **R2** → **Manage API Tokens** → **Create API Token**:
   - Permiso: **Object Read & Write**
   - Alcance: solo el bucket `makyp-fotos`
5. Apunta estos cuatro datos, que no se vuelven a mostrar:
   - **Access Key ID**
   - **Secret Access Key**
   - **Endpoint**: en el apartado **S3 API** del bucket verás algo como
     `https://<id-de-cuenta>.r2.cloudflarestorage.com/makyp-fotos`. Copia
     solo hasta `.com`, **sin** `/makyp-fotos` al final: el nombre del
     bucket va aparte, en su propia variable.
   - La dirección pública del punto 3

---

## Paso 2 · La base de datos (Neon)

1. Entra en [neon.tech](https://neon.tech) y regístrate con GitHub. **No pide
   tarjeta**: el plan gratuito lo tienes activo desde el primer momento.
2. Te crea un proyecto de entrada. Si te deja elegir, ponle `makyp` y escoge
   la región más cercana a Colombia (**AWS us-east-1**, Virginia).
3. Nada más crearse te muestra la **connection string**, algo así:

```
postgresql://usuario:clave@ep-algo-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
```

   Cópiala entera y guárdala; la vas a usar dos veces, en los pasos 3 y 4. Si
   cierras la ventana, está en **Dashboard** → **Connect**.

> Neon apaga la base tras cinco minutos sin consultas y la reenciende sola al
> llegar la siguiente. No se pierde nada y no hay que tocar nada: la primera
> visita del día tarda medio segundo más.

---

## Paso 3 · La API (Render)

1. Entra en [render.com](https://render.com) y regístrate con GitHub. El plan
   gratuito **no pide tarjeta**.
2. **New** → **Web Service** → conecta tu repositorio y elige la rama
   `master`.
3. Configuración:
   - **Language / Runtime:** `Docker`
   - **Root Directory:** `backend`
   - **Dockerfile Path:** `backend/Dockerfile`
   - **Instance Type:** **Free**

   > Con *Root Directory* en `backend`, Render construye solo esa carpeta: no
   > reconstruye nada cuando lo que cambias es la tienda.

4. **Health Check Path:** `/api/salud/`
5. En **Environment Variables**, añade estas. Las tres primeras son las que
   más se olvidan y las que dejan el sitio roto:

```
DJANGO_SECRET_KEY        (genérala en el paso 3.1, más abajo)
DJANGO_DEBUG             False
DJANGO_ALLOWED_HOSTS     tu-servicio.onrender.com
DJANGO_CORS_ALLOWED_ORIGINS   https://makyp-6ed4d.web.app,https://makyp-6ed4d.firebaseapp.com
DJANGO_CSRF_TRUSTED_ORIGINS   https://makyp-6ed4d.web.app,https://makyp-6ed4d.firebaseapp.com
DATABASE_URL             (la del paso 2.3, entera)
R2_BUCKET                makyp-fotos
R2_ENDPOINT              (el del paso 1.5)
R2_ACCESS_KEY            (el del paso 1.5)
R2_SECRET_KEY            (el del paso 1.5)
R2_DOMINIO_PUBLICO       pub-xxxxx.r2.dev      ← sin https://
FRONTEND_ASSET_BASE_URL  https://makyp-6ed4d.web.app
```

   El nombre exacto de `DJANGO_ALLOWED_HOSTS` lo sabrás al crear el servicio:
   Render te da la dirección arriba del todo. Si te equivocas, la API
   responde *"DisallowedHost"* y se arregla corrigiendo la variable.

**3.1 · La clave secreta.** Es lo que firma las sesiones; si se filtra,
cualquiera puede entrar al panel. Genera una nueva, distinta de la de tu
máquina, en tu terminal:

```bash
cd backend
.venv\Scripts\python.exe -c "from django.core.management.utils import get_random_secret_key as k; print(k())"
```

6. **Create Web Service**. El primer despliegue tarda unos minutos: construye
   la imagen, aplica las migraciones y arranca el servidor.

Cuando termine, abre `https://tu-servicio.onrender.com/api/bootstrap/`. Debe
responder un bloque de JSON. Si responde, la API y la base están bien.

> `FRONTEND_ASSET_BASE_URL` es lo que hace que las fotos que ya vivían en el
> sitio (las 130 del armador) sigan viéndose: la API devuelve sus direcciones
> apuntando a Firebase, mientras que las nuevas irán a R2.

---

## Paso 4 · Llenar la base

La base nueva está vacía: tiene las tablas pero ningún producto.

El plan gratuito de Render **no incluye terminal**, así que esto se hace
**desde tu máquina**, conectándote a la base de Neon. Es lo mismo y de hecho
es más cómodo. En tu terminal, dentro de `backend`:

```bash
cd backend
set DATABASE_URL=postgresql://...la-del-paso-2.3...
.venv\Scripts\python.exe manage.py createsuperuser
.venv\Scripts\python.exe manage.py cargar_datos_iniciales
```

El primero crea tu usuario (ponle el mismo nombre que usas en local). El
segundo carga los 17 productos, las 6 categorías, las 11 flores con sus 54
variantes de color, las envolturas, los listones y todos los textos.

> Ese `set DATABASE_URL=...` solo vale para esa ventana de terminal. Al
> cerrarla, tu `.env` vuelve a mandar y sigues trabajando contra tu base
> local sin tocar la de producción. Si usas PowerShell, la línea es
> `$env:DATABASE_URL = "postgresql://..."`.

---

## Paso 5 · La tienda (Firebase)

1. Abre `frontend/.env.production` y pon la dirección real de tu API:

```
VITE_API_URL=https://tu-servicio.onrender.com/api
```

2. Compila y publica:

```bash
cd frontend
npm run build
cd ..
firebase deploy
```

Listo: `https://makyp-6ed4d.web.app`.

---

## Paso 6 · Que no se duerma

Render apaga la API a los 15 minutos sin visitas, y despertarla tarda casi un
minuto. La tienda **ya no se queda en blanco** mientras tanto: arranca con una
copia del catálogo que va dentro de ella (ver *Después*). Pero durante ese
minuto no llegan los cambios que Maira haya hecho desde la última
publicación, y el panel sí tiene que esperar. Con esto no se llega a dormir.

1. Entra en [cron-job.org](https://cron-job.org) y crea una cuenta. Es
   gratis y **no pide tarjeta**.
2. **Create cronjob**:
   - **Title:** `Despertar Makyp`
   - **URL:** `https://tu-servicio.onrender.com/api/salud/`
   - **Schedule:** cada **10 minutos**
3. Guardar. A los pocos minutos verás la primera ejecución en verde.

Con una visita cada 10 minutos el servicio no llega nunca a los 15 de
inactividad, así que se queda despierto.

`/api/salud/` existe justo para esto: responde `{"estado": "ok"}` **sin
consultar la base**. Si el ping apuntara a `/api/bootstrap/`, mantendría
encendida también a Neon las 24 horas, y Neon se cobra por horas encendida.
Así la base solo despierta cuando entra una persona de verdad. El plan gratuito de Render da 750
horas de servicio al mes y un mes tiene 730, así que estar encendido las 24
horas **cabe justo** dentro de lo gratuito. Por eso conviene tener un solo
servicio gratuito en esa cuenta: dos encendidos a la vez sí se pasarían.

---

## Comprobaciones

Repasa esto antes de darlo por bueno:

- [ ] Desde el panel, **cambia el nombre de un producto** y comprueba que
      la tienda muestra el nombre nuevo. Mirar solo si se ven productos ya no
      sirve: salen de la copia aunque la API esté rota. Si sigue el nombre
      viejo, es CORS: revisa que `DJANGO_CORS_ALLOWED_ORIGINS` lleve
      exactamente el dominio de Firebase, con `https://` y sin barra final.
- [ ] El armador muestra las flores y deja armar un ramo
- [ ] `/admin/login` te deja entrar con el usuario del paso 4
- [ ] Desde el panel, **sube una foto** a un producto y compruebas que se ve
      (esa ya vive en R2)
- [ ] Vuelve a entrar al día siguiente: la foto sigue ahí y la tienda abre
      **al momento**, sin esperas

Los dos últimos puntos son los que confirman que el almacenamiento y el ping
están bien puestos. Si la foto desapareció, es que se guardó en el disco del
servidor y se perdió en el siguiente despliegue: repasa las cinco variables
`R2_`. Si la tienda tardó casi un minuto en abrir, mira las ejecuciones del
cron-job: alguna estará en rojo.

---

## Después

**Para actualizar el backend**, un `git push` a `master`: Render reconstruye y
redespliega solo, aplicando las migraciones nuevas.

**Para actualizar la tienda**, `npm run build` y `firebase deploy`.

**La copia del catálogo.** Antes de compilar, `npm run build` pide el
catálogo a la API y guarda una copia en `frontend/src/data/instantanea.json`,
que viaja dentro de la tienda. Es lo que se ve en el primer instante, y lo que
evita la tienda en blanco si Render está dormido o caído; en cuanto la API
responde, se cambia por la versión en vivo.

Esa copia se queda como estaba en la última publicación. Si Maira hace
cambios grandes (productos nuevos, precios), vale la pena volver a publicar
la tienda para renovarla, aunque no hayas tocado código. Si al compilar la API
no responde, se conserva la copia anterior y la compilación sigue: nunca se
publica una copia vacía.

### Si algún día tienes dominio propio

Hay que cambiar la dirección en cuatro sitios, y olvidarse de uno deja el
sitio a medias:

1. `DJANGO_ALLOWED_HOSTS`, `DJANGO_CORS_ALLOWED_ORIGINS` y
   `DJANGO_CSRF_TRUSTED_ORIGINS` en Render
2. `FRONTEND_ASSET_BASE_URL` en Render
3. Las etiquetas `og:` de `frontend/index.html` (la vista previa al compartir
   por WhatsApp)
4. `frontend/public/robots.txt` y `frontend/public/sitemap.xml`

### Los límites del plan gratis

| | Límite | Qué pasa al llegar |
| --- | --- | --- |
| Render | 750 horas de servicio al mes | El servicio se apaga hasta el mes siguiente |
| Neon | 0,5 GB de base y 100 horas de cómputo al mes | Deja de aceptar escrituras; **los datos no se borran** |
| Cloudflare R2 | 10 GB y 1 millón de subidas al mes | Empieza a cobrar por GB (unos 0,015 $) |
| Firebase Hosting | 10 GB de tráfico al mes | Se corta hasta el mes siguiente |

Con el tamaño de tu tienda (10 MB de base de datos y 6 MB de fotos) vas
sobrado durante años. Las **horas de cómputo de Neon** solo corren mientras
alguien está usando la tienda de verdad, porque ni el chequeo de Render ni el
ping del paso 6 tocan la base: suman unas tres horas al día de uso continuo
antes de acercarse al límite.
