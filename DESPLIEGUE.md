# Poner Makyp Creations en internet

Guía para desplegar el sitio completo **gratis**. Calcula una hora la primera
vez; las siguientes actualizaciones son un `git push`.

## Cómo queda repartido

| Parte | Dónde | Por qué ahí |
| --- | --- | --- |
| La tienda (React) | **Firebase Hosting** | Ya está configurado y funcionando |
| La API (Django) | **Northflank** | Es el único plan gratis que **no apaga** el servicio |
| La base de datos | **Northflank** | Va incluida, en la misma red que la API |
| Las fotos que sube Maira | **Cloudflare R2** | 10 GB gratis y sin cobro por descargas |

**Por qué no Render**, que es lo más recomendado por ahí: su PostgreSQL gratis
**se borra a los 30 días** de creado, y el servicio duerme a los 15 minutos
tardando casi un minuto en despertar. Tus clientes llegan por un enlace de
WhatsApp: el primero que lo abriera se encontraría la pantalla colgada.

---

## Antes de empezar

Northflank despliega **desde GitHub**, así que el código tiene que estar
subido. A día de hoy el repositorio solo tiene el commit inicial: el backend
entero está sin subir.

```bash
cd C:\Users\User\Downloads\makyp
git add -A
git commit -m "Backend, panel de administración y armador interactivo"
git push
```

Comprueba en `github.com/murciabrayan/Pagina-Makyp` que aparece la carpeta
`backend/`. Si no está, nada de lo que sigue funcionará.

> Los archivos `.env` están excluidos del repositorio a propósito: las claves
> nunca se suben, se escriben en el panel de cada servicio.

---

## Paso 1 · Las fotos (Cloudflare R2)

1. Entra en [dash.cloudflare.com](https://dash.cloudflare.com) y crea una
   cuenta. En **R2** te pedirá una tarjeta para activarlo; no cobra nada
   dentro de los 10 GB.
2. **Create bucket**, nómbralo `makyp-fotos`, región automática.
3. Dentro del bucket, pestaña **Settings** → **Public access** → habilita
   **R2.dev subdomain**. Copia la dirección que te da, algo como
   `https://pub-xxxxx.r2.dev`.
4. Vuelve a **R2** → **Manage API Tokens** → **Create API Token**:
   - Permiso: **Object Read & Write**
   - Alcance: solo el bucket `makyp-fotos`
5. Apunta estos cuatro datos, que no se vuelven a mostrar:
   - **Access Key ID**
   - **Secret Access Key**
   - **Endpoint** (sale como `https://<id-de-cuenta>.r2.cloudflarestorage.com`)
   - La dirección pública del punto 3

---

## Paso 2 · La base de datos (Northflank)

1. Entra en [northflank.com](https://northflank.com) y regístrate con GitHub.
   Pedirá tarjeta; el plan **Sandbox** es gratis para siempre y no cobra
   mientras no subas de plan.
2. **Create new** → **Project**, nómbralo `makyp`, región la más cercana.
3. Dentro del proyecto: **Add new** → **Addon** → **PostgreSQL**.
   - Plan: el gratuito del Sandbox
   - Versión: 16 o superior
4. Cuando termine de crearse, entra en el addon → pestaña **Connection
   Details** y copia la **connection string** (empieza por `postgres://`).

---

## Paso 3 · La API (Northflank)

1. En el proyecto: **Add new** → **Service** → **Combined service**.
2. Conecta tu repositorio de GitHub y elige la rama `master`.
3. Configuración de la construcción:
   - **Build type:** Dockerfile
   - **Dockerfile path:** `/backend/Dockerfile`
   - **Build context:** `/backend`
4. **Port:** `8000`, protocolo HTTP, y marca **Publicly accessible**.
5. En **Environment variables**, añade estas. Las tres primeras son las que
   más se olvidan y las que dejan el sitio roto:

```
DJANGO_SECRET_KEY        (genérala en el paso 3.1, más abajo)
DJANGO_DEBUG             False
DJANGO_ALLOWED_HOSTS     tu-servicio.northflank.app
DJANGO_CORS_ALLOWED_ORIGINS   https://makyp-6ed4d.web.app,https://makyp-6ed4d.firebaseapp.com
DJANGO_CSRF_TRUSTED_ORIGINS   https://makyp-6ed4d.web.app,https://makyp-6ed4d.firebaseapp.com
DATABASE_URL             (la del paso 2.4)
R2_BUCKET                makyp-fotos
R2_ENDPOINT              (el del paso 1.5)
R2_ACCESS_KEY            (el del paso 1.5)
R2_SECRET_KEY            (el del paso 1.5)
R2_DOMINIO_PUBLICO       pub-xxxxx.r2.dev      ← sin https://
FRONTEND_ASSET_BASE_URL  https://makyp-6ed4d.web.app
```

**3.1 · La clave secreta.** Es lo que firma las sesiones; si se filtra,
cualquiera puede entrar al panel. Genera una nueva, distinta de la de tu
máquina, en tu terminal:

```bash
cd backend
.venv\Scripts\python.exe -c "from django.core.management.utils import get_random_secret_key as k; print(k())"
```

6. **Deploy**. El primer despliegue tarda unos minutos: instala las
   dependencias, aplica las migraciones y arranca el servidor.

Cuando termine, abre `https://tu-servicio.northflank.app/api/bootstrap/`.
Debe responder un bloque de JSON. Si responde, la API y la base están bien.

> `FRONTEND_ASSET_BASE_URL` es lo que hace que las fotos que ya vivían en el
> sitio (las 130 del armador) sigan viéndose: la API devuelve sus direcciones
> apuntando a Firebase, mientras que las nuevas irán a R2.

---

## Paso 4 · Llenar la base

La base nueva está vacía: tiene las tablas pero ningún producto. En el panel
de Northflank, entra en tu servicio → pestaña **Shell** y ejecuta:

```bash
python manage.py createsuperuser
python manage.py cargar_datos_iniciales
```

El primero crea tu usuario (ponle el mismo nombre que usas en local). El
segundo carga los 17 productos, las 6 categorías, las 11 flores con sus 54
variantes de color, las envolturas, los listones y todos los textos.

---

## Paso 5 · La tienda (Firebase)

1. Abre `frontend/.env.production` y pon la dirección real de tu API:

```
VITE_API_URL=https://tu-servicio.northflank.app/api
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

## Comprobaciones

Repasa esto antes de darlo por bueno:

- [ ] La tienda carga y **se ven los productos** (si salen vacíos, es CORS:
      revisa que `DJANGO_CORS_ALLOWED_ORIGINS` lleve exactamente el dominio
      de Firebase, con `https://` y sin barra final)
- [ ] El armador muestra las flores y deja armar un ramo
- [ ] `/admin/login` te deja entrar con el usuario del paso 4
- [ ] Desde el panel, **sube una foto** a un producto y compruebas que se ve
      (esa ya vive en R2)
- [ ] Vuelve a entrar al día siguiente: la foto sigue ahí

Ese último punto es el que confirma que el almacenamiento está bien puesto.
Si la foto desapareció, es que se guardó en el disco del servidor y se perdió
en el siguiente despliegue: repasa las cinco variables `R2_`.

---

## Después

**Para actualizar el backend**, un `git push` a `master`: Northflank
reconstruye y redespliega solo, aplicando las migraciones nuevas.

**Para actualizar la tienda**, `npm run build` y `firebase deploy`.

### Si algún día tienes dominio propio

Hay que cambiar la dirección en cuatro sitios, y olvidarse de uno deja el
sitio a medias:

1. `DJANGO_ALLOWED_HOSTS`, `DJANGO_CORS_ALLOWED_ORIGINS` y
   `DJANGO_CSRF_TRUSTED_ORIGINS` en Northflank
2. `FRONTEND_ASSET_BASE_URL` en Northflank
3. Las etiquetas `og:` de `frontend/index.html` (la vista previa al compartir
   por WhatsApp)
4. `frontend/public/robots.txt` y `frontend/public/sitemap.xml`

### Los límites del plan gratis

| | Límite | Qué pasa al llegar |
| --- | --- | --- |
| Northflank | 2 servicios, 1 base de datos | No puedes añadir un tercer servicio |
| Cloudflare R2 | 10 GB y 1 millón de subidas al mes | Empieza a cobrar por GB (unos 0,015 $) |
| Firebase Hosting | 10 GB de tráfico al mes | Se corta hasta el mes siguiente |

Con el tamaño de tu tienda (10 MB de base de datos y 6 MB de fotos) vas
sobrado durante años. Lo primero que se quedaría corto sería el tráfico de
Firebase, y eso solo con muchas visitas, que sería una buena noticia.
