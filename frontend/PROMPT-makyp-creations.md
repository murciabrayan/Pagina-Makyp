# PROMPT PARA CLAUDE CODE — Landing / Tienda "Makyp Creations"

> Pega este archivo completo como primer mensaje en Claude Code (o guárdalo como `SPEC.md` en la raíz y escribe: *"Lee SPEC.md y constrúyelo completo"*).

---

## 0. Rol y objetivo

Actúa como frontend lead. Construye la landing + storefront de **Makyp Creations**, un emprendimiento colombiano de detalles artesanales hechos con **limpiapipas** (chenille): flores individuales, ramos, macetas, muñequitos amigurumi-style, llaveros y pedidos personalizados. Público: mujeres 18–45, compra emocional (regalo, aniversario, cumpleaños, "porque sí"). Conversión final por **WhatsApp**, no por checkout con pasarela en v1.

El resultado debe verse **artesanal, tierno y premium**: pastel lila, mucho aire, bordes suaves, cero estética "SaaS genérico".

**Reglas duras:**
- No inventes secciones fuera de las especificadas. No reordenes.
- Todo el copy va en **español** exactamente como se transcribe abajo.
- Mobile-first real: cada sección tiene su comportamiento responsive definido; impleméntalo.
- Nada de `localStorage` obligatorio para render inicial; el carrito puede ser estado en memoria + persistencia opcional.
- Accesibilidad: foco visible, `alt` en todas las imágenes, contraste AA en texto sobre lila.

---

## 1. Stack y arquitectura

```
React 18 + Vite 5 + TypeScript strict + Tailwind CSS 3.4 + react-router-dom 6 + lucide-react
Gestor de paquetes: npm
```

**Bootstrap exacto:**
```bash
npm create vite@latest makyp-creations -- --template react-ts
cd makyp-creations
npm install
npm install react-router-dom lucide-react
npm install -D tailwindcss@^3.4 postcss autoprefixer
npx tailwindcss init -p
npm run dev
```
> Usa Tailwind 3.4 con `tailwind.config.ts` (no v4 con `@theme`), para que la definición de tokens de la sección 2 aplique tal cual.

Configura en `vite.config.ts` el alias `@` → `./src` y añade `"baseUrl": "."` + `"paths": { "@/*": ["src/*"] }` en `tsconfig.json`.

### Estructura de carpetas (obligatoria, modular y de bajo acoplamiento)

```
index.html                     # fuentes de Google, <title>, meta description, favicon
src/
  main.tsx                     # createRoot + BrowserRouter + CartProvider
  App.tsx                      # rutas; "/" = composición de secciones, sin markup suelto
  styles/
    globals.css                # tokens CSS + directivas de Tailwind + base
  components/
    layout/
      AnnouncementBar.tsx
      Header.tsx
      NavDesktop.tsx
      NavMobile.tsx            # drawer
      Footer.tsx
      WhatsAppFab.tsx
    sections/
      Hero.tsx
      CategoryStrip.tsx
      FeaturedProducts.tsx
      ValueProps.tsx
      SocialGallery.tsx
    ui/
      Button.tsx               # variants: primary | outline | ghost | whatsapp
      ProductCard.tsx
      CategoryCard.tsx
      IconBadge.tsx
      SectionHeading.tsx
      Carousel.tsx             # scroll-snap horizontal reutilizable
  data/
    products.ts
    categories.ts
    navigation.ts
    site.ts                    # contacto, redes, mensajes WhatsApp
  lib/
    format.ts                  # formatCOP()
    whatsapp.ts                # buildWhatsAppUrl()
    analytics.ts               # track() con no-op por defecto
  types/
    index.ts
```

**Principios:** ninguna sección importa datos directamente por fetch; recibe props tipadas o lee de `src/data`. Cada componente `ui/` es puro y sin dependencias del dominio.

---

## 2. Design tokens

Declara todo en `globals.css` con variables CSS y expórtalo a `tailwind.config.ts` (`theme.extend`). **No hardcodees hex en componentes.**

### 2.1 Color (derivado del logo)

| Token | Hex | Uso |
|---|---|---|
| `--brand-900` | `#3F3170` | Titulares display, texto sobre lila claro |
| `--brand-700` | `#6B5BAE` | **Primario**: botones, links activos, iconos |
| `--brand-500` | `#8F7FCB` | Hover, estados secundarios |
| `--brand-300` | `#C7BCE9` | Bordes decorativos, dashed |
| `--brand-100` | `#EDE7FB` | Fondo de bandas, chips, footer |
| `--brand-50`  | `#F8F5FE` | Fondo de página alterno, imágenes de producto |
| `--peri-500`  | `#7B93DA` | Azul lila del script "Creations": acentos, iconos alternos |
| `--blush-300` | `#F4B6CE` | Badge "Más vendido", lazo, detalles rosa |
| `--blush-100` | `#FBE3EE` | Gradiente del hero (lado derecho) |
| `--ink`       | `#2E2743` | Texto base |
| `--muted`     | `#6F6885` | Texto secundario / descripciones |
| `--line`      | `#E9E2F7` | Bordes de cards y divisores |
| `--wa`        | `#25D366` | WhatsApp flotante |
| `--surface`   | `#FFFFFF` | Cards y header |

**Gradientes nombrados:**
- `--grad-hero`: `linear-gradient(105deg, #FBFAFF 0%, #F3EEFD 45%, #FBE3EE 100%)`
- `--grad-cta`: `linear-gradient(135deg, #6B5BAE 0%, #7B93DA 100%)` (botón WhatsApp del header)

### 2.2 Tipografía

| Rol | Familia | Uso |
|---|---|---|
| Display | **Playfair Display** 700/800 | H1, títulos de sección |
| Script | **Parisienne** 400 | "con mucho amor", tagline del logo |
| Body/UI | **Nunito** 400/600/700 | Nav, párrafos, precios, botones |

Cárgalas en `index.html` con `<link rel="preconnect">` a `fonts.googleapis.com` y `fonts.gstatic.com` + un único `<link>` de Google Fonts con `display=swap` y solo los pesos usados. Expón `--font-display`, `--font-script`, `--font-body` en `globals.css` y mapéalas en `theme.extend.fontFamily`.

**Escala (desktop → mobile):**

| Elemento | Desktop | Mobile | Line-height | Tracking |
|---|---|---|---|---|
| H1 hero | 58px / 800 | 34px | 1.08 | -0.02em |
| Script hero | 52px | 32px | 1.1 | 0 |
| H2 sección | 30px / 700 | 24px | 1.2 | -0.01em |
| H3 card | 15px / 700 | 15px | 1.3 | 0 |
| Body | 16px | 15px | 1.65 | 0 |
| Small / subtítulo card | 12px | 12px | 1.4 | 0 |
| Nav link | 15px / 600 | 17px | 1 | 0 |
| Precio | 17px / 700 | 16px | 1 | 0 |

Ancho máximo de párrafo: **62ch**.

### 2.3 Espaciado, radios, sombras

- Grid base **8px**. Espaciados válidos: 4, 8, 12, 16, 24, 32, 40, 56, 72, 96.
- Contenedor: `max-width: 1280px; margin-inline: auto; padding-inline: 24px` (mobile 20px, ≥1536px 32px).
- Padding vertical de sección: **72px** desktop / **48px** mobile.
- Radios: `--r-sm: 10px` (botón pequeño, chip), `--r-md: 16px` (cards), `--r-lg: 24px` (bandas y paneles), `--r-full: 999px` (píldoras, avatares, FAB).
- Sombras (suaves y lilas, **nunca** grises neutras):
  - `--sh-card: 0 2px 10px rgba(107,91,174,.06)`
  - `--sh-hover: 0 10px 28px rgba(107,91,174,.14)`
  - `--sh-fab: 0 8px 24px rgba(37,211,102,.35)`
- Bordes de card: `1px solid var(--line)`.

### 2.4 Breakpoints

`sm 640` · `md 768` · `lg 1024` · `xl 1280` · `2xl 1536`.

---

## 3. Secciones — especificación detallada

Orden vertical exacto: **AnnouncementBar → Header → Hero → CategoryStrip → FeaturedProducts → ValueProps → SocialGallery → Footer → WhatsAppFab (fixed)**.

---

### 3.1 AnnouncementBar

- Full-bleed, `height: 40px`, fondo `--brand-100`, texto `--brand-900` 13px/600, centrado vertical y horizontalmente.
- Contenido en una línea: icono flor (`Flower2`, 14px) + `Hechas a mano con amor` + separador `|` con `--brand-300` y `margin-inline: 16px` + `Envíos a todo Colombia`.
- Mobile (<768px): oculta el segundo texto y el separador; deja solo `Hechas a mano con amor`. No la conviertas en carrusel.

---

### 3.2 Header

- `sticky top-0 z-50`, fondo `--surface`, `height: 80px` (mobile 68px), borde inferior `1px solid var(--line)`.
- Al hacer scroll >24px: añade `--sh-card`. Sin cambio de tamaño ni animación de reducción.
- Grid de 3 zonas: **logo (izq) | nav (centro-izq) | acciones (der)**, alineadas verticalmente al centro.

**Logo (izquierda):**
- Imagen `sinfondo.png` a `height: 44px`, `width: auto`, `alt="Makyp Creations"`, envuelta en `<Link to="/">` de `react-router-dom`.
- Debajo, alineado a la izquierda del logo: `Hechas con limpiapipas` en Nunito 11px/600 color `--brand-500`, seguido de icono corazón outline 11px `--blush-300`. Oculto en <1024px.

**Nav (a 40px del logo):** enlaces con `gap: 28px`, Nunito 15px/600, color `--ink`, hover `--brand-700`.
`Inicio` · `Tienda` · `Crear mi ramo` · `Personalizados` · `Nosotros` · `Contacto`

- El activo (`Inicio`) va en `--brand-700` con subrayado: pseudo-elemento `height: 2px`, `width: 100%`, `bottom: -8px`, `background: --brand-700`, `border-radius: 2px`.
- `Crear mi ramo` lleva icono flor 15px `--peri-500` **antes** del texto, `gap: 6px`.

**Acciones (derecha, `gap: 18px`):**
1. `Search` 20px, botón circular 40px, hover fondo `--brand-50`.
2. `User` 20px, mismo tratamiento.
3. `ShoppingCart` 20px con badge: círculo 18px, fondo `--brand-700`, texto blanco 11px/700, posicionado `top: -6px; right: -8px`.
4. Botón **WhatsApp**: píldora `--r-full`, `height: 44px`, `padding-inline: 22px`, fondo `--grad-cta`, texto blanco 14px/700, icono WhatsApp 18px a la izquierda, `gap: 8px`. Hover: `filter: brightness(1.06)` + `--sh-hover`.

**Mobile (<1024px):** logo + iconos carrito y búsqueda + botón hamburguesa. Nav en drawer lateral derecho (ancho 82vw, máx 340px), fondo blanco, links 17px con `gap: 22px`, y el botón WhatsApp a ancho completo al final. Bloquea el scroll del body al abrir; cierra con Esc, con click en overlay y al navegar.

---

### 3.3 Hero

- Full-bleed, fondo `--grad-hero`, **sin borde inferior** (fluye hacia el blanco de la siguiente sección).
- Altura: `min-height: 620px` desktop; en mobile la define el contenido con `padding-block: 48px 40px`.
- Grid de 2 columnas dentro del contenedor: **44% texto / 56% imagen**, `align-items: center`, `gap: 48px`.

**Columna izquierda (alineada a la izquierda, `max-width: 520px`):**

1. H1 en Playfair 800, `--brand-900`, dos líneas forzadas:
   `Detalles únicos` / `hechos a mano`
2. Debajo, misma caja: `con mucho amor` en Parisienne 52px, `--brand-700`, con un corazón outline `--brand-500` 26px a la derecha, `margin-left: 12px`, rotado `-8deg`. Margen superior 4px.
3. Párrafo a 24px del bloque anterior, 16px/1.65, `--muted`, con salto controlado:
   `Flores, ramos, muñequitos y más, hechos` / `a mano con limpiapipas para cada ocasión.`
4. Botonera a 32px, `gap: 16px`:
   - **Primario** `Ver productos` — fondo `--brand-700`, texto blanco 15px/700, `height: 52px`, `padding-inline: 28px`, `--r-sm` (10px), icono bolsa 18px a la **derecha**, `--sh-card`. Hover: `--brand-900` + `translateY(-1px)`.
   - **Outline** `Crear mi ramo` — fondo blanco, borde `1.5px solid --brand-700`, texto `--brand-700`, misma altura, icono flor 18px a la derecha. Hover: fondo `--brand-50`.
5. Fila de confianza a 40px, `gap: 32px`, tres ítems inline (icono outline 20px `--brand-500` + texto 13px/600 `--ink`, `gap: 8px`):
   `Hecho a mano` (corazón) · `Material de calidad` (hoja) · `Envíos seguros` (camión)

**Columna derecha:**
- Imagen del ramo (PNG con transparencia) centrada, `max-height: 480px`, `object-fit: contain`.
- Detrás: mancha orgánica en `--blush-100` (blob SVG o `border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%`), rotada `-12deg`, tamaño ~520×480px, `z-index: 0`.
- Doodles decorativos SVG en `--brand-300`, `stroke-width: 1.5`, `opacity: .6`, `aria-hidden`, en posiciones absolutas: corazón arriba-derecha, estrella pequeña izquierda-media, dos ramitas abajo-derecha y abajo-izquierda.
- Micro-animación única en toda la página: la imagen flota `translateY(0 → -10px)` en 6s `ease-in-out infinite alternate`. Respeta `prefers-reduced-motion: reduce` (desactívala).

**Mobile:** una columna, **imagen primero** (max-height 300px), luego texto centrado; botones a ancho completo apilados con `gap: 12px`; la fila de confianza pasa a grid 3 columnas con iconos arriba y texto de 11px centrado.

---

### 3.4 CategoryStrip

- Fondo blanco. `padding-block: 40px`. Sin título de sección (es una tira de acceso rápido).
- 7 tarjetas en fila: 6 categorías + 1 CTA. Desktop: `display: grid; grid-template-columns: repeat(7, 1fr); gap: 16px`.

**CategoryCard (×6):** `height: 190px`, fondo `--surface`, borde `1px --line`, `--r-md`, `padding: 16px 12px`, contenido centrado en columna.
- Imagen cuadrada 96×96px arriba, `object-fit: contain`, sobre fondo transparente.
- Título 14px/700 `--ink` a 12px de la imagen.
- Subtítulo 11px `--muted` a 2px del título.
- Hover: `translateY(-4px)`, `--sh-hover`, borde `--brand-300`. Transición 180ms ease.

| Título | Subtítulo | slug |
|---|---|---|
| Flores | Individuales | `flores` |
| Ramos | Hechos a mano | `ramos` |
| Macetas | Decorativas | `macetas` |
| Muñequitos | Hechos con amor | `munequitos` |
| Llaveros | Pequeños detalles | `llaveros` |
| Personalizados | Creamos para ti | `personalizados` |

**Card CTA (séptima):** misma altura, fondo `--brand-50`, borde **dashed** `1.5px --brand-300`, `--r-md`. Contenido centrado: `Crear mi ramo` en 15px/700 `--brand-700`, `Diseña tu detalle ideal` en 12px `--muted` a 6px, y a 14px un botón circular 36px con borde `1px --brand-300`, fondo blanco e icono `ChevronRight` 16px `--brand-700`. Hover: fondo `--brand-100`.

**Responsive:** `lg` 4 columnas · `md` 3 · `<640px` scroll horizontal con `scroll-snap-type: x mandatory`, cards de `width: 132px`, padding lateral 20px y sin scrollbar visible.

---

### 3.5 FeaturedProducts

- Fondo blanco, `padding-block: 56px 72px`.
- Cabecera en fila, `justify-content: space-between; align-items: center`, `margin-bottom: 28px`:
  - Izquierda: `Productos destacados` en Playfair 30px/700 `--brand-900` + icono flor 20px `--brand-300` a 10px a la derecha del texto.
  - Derecha: botón outline píldora `Ver toda la tienda` — `height: 44px`, `padding-inline: 22px`, borde `1px --line`, texto 14px/600 `--ink`, flecha `ArrowRight` 16px a la derecha. Hover: borde `--brand-300`, texto `--brand-700`.

**Carrusel:** track horizontal con `scroll-snap`, 6 cards visibles ~5.5 en 1280px. `gap: 16px`. Card `width: 210px` fija (`flex: 0 0 210px`).

**ProductCard:**
- Fondo `--surface`, borde `1px --line`, `--r-md`, `overflow: hidden`, `--sh-card`.
- Zona imagen: relación **1:1**, fondo `--brand-50`, imagen con `padding: 12px` y `object-fit: contain`.
- Badge opcional arriba-izquierda: `Más vendido`, fondo `--blush-300`, texto blanco 11px/700, `padding: 5px 12px`, `border-radius: 0 0 12px 0` (esquina superior izquierda a ras).
- Cuerpo `padding: 14px`: nombre 14px/700 `--ink` (máx 2 líneas, `line-clamp`); debajo a 8px, fila `space-between` con precio 17px/700 `--brand-900` y botón cuadrado 34px, `--r-sm`, borde `1px --brand-300`, icono carrito 16px `--brand-700`. Hover del botón: fondo `--brand-700`, icono blanco.
- Hover de la card: `translateY(-4px)` + `--sh-hover`.

**Flecha de navegación:** botón circular 44px, fondo blanco, borde `1px --line`, `--sh-card`, icono `ChevronRight` 20px `--brand-700`, posicionado `position: absolute; right: -12px; top: 42%`. Muestra también la flecha izquierda cuando `scrollLeft > 0`. Ocultas en touch (<768px), donde manda el swipe.

**Datos (`src/data/products.ts`, precios en COP):**

| id | nombre | precio | categoría | badge |
|---|---|---|---|---|
| 1 | Ramo Girasoles | 48000 | ramos | Más vendido |
| 2 | Maceta Lavanda | 38000 | macetas | — |
| 3 | Ramo Tulipanes | 42000 | ramos | — |
| 4 | Oso con Flores | 35000 | munequitos | — |
| 5 | Llavero Abejita | 12000 | llaveros | — |
| 6 | Rosa Individual | 8000 | flores | — |

Formatea con `formatCOP()` → `$48.000` (punto como separador de miles, sin decimales, `es-CO`).

---

### 3.6 ValueProps

- Panel dentro del contenedor: fondo `--brand-100`, `--r-lg` (24px), `padding: 32px 40px`, `margin-block: 8px 72px`.
- 4 columnas iguales con divisores verticales `1px solid --brand-300` (`opacity: .5`) entre ellas, `gap: 32px`.
- Cada ítem: fila con icono outline 30px `--brand-700` a la izquierda + bloque de texto (`gap: 14px`, `align-items: flex-start`).
  - Título 14px/700 `--ink` (puede ir en 2 líneas).
  - Descripción 12.5px/1.5 `--muted` a 6px.

| Icono (lucide) | Título | Descripción |
|---|---|---|
| `HandHeart` | 100% Artesanal | Cada pieza está hecha a mano con dedicación. |
| `Palette` | Colores vibrantes | Usamos materiales de calidad para que duren más. |
| `Gift` | Perfecto para cualquier ocasión | Cumpleaños, aniversarios, detalles y más. |
| `MessagesSquare` | Atención personalizada | Te asesoramos para crear el detalle perfecto. |

**Responsive:** `lg` 2×2 sin divisores verticales (usa divisor horizontal entre filas) · `<640px` 1 columna, `padding: 24px 20px`.

---

### 3.7 SocialGallery

- Fondo blanco, `padding-block: 8px 64px`.
- Título centrado: `Síguenos y descubre más creaciones` en Playfair 26px/700 `--brand-900` + corazón outline 18px `--brand-300` al final. `margin-bottom: 24px`.
- Grid de **7 imágenes cuadradas**, `grid-template-columns: repeat(7, 1fr)`, `gap: 12px`, cada una `aspect-ratio: 1`, `--r-md`, `object-fit: cover`.
- Hover: overlay `rgba(107,91,174,.35)` con icono Instagram blanco 22px centrado, fade 160ms. Cada tile enlaza al perfil de Instagram (`target="_blank" rel="noopener"`).

**Responsive:** `lg` 4 columnas (7 tiles, la última fila ocupa 3) · `<640px` scroll horizontal con tiles de 140px y snap.

---

### 3.8 Footer

- Full-bleed, fondo `--brand-100`, `padding-block: 48px 0`, borde superior `1px solid --brand-300` (`opacity: .5`).
- Grid de 5 columnas: `2fr 1fr 1.2fr 1.2fr 1.6fr`, `gap: 40px`, `align-items: start`.

**Columna 1 — marca:**
- Logo `height: 46px`.
- `Hechas con limpiapipas` 11px/600 `--brand-500` + corazón lleno 11px `--blush-300`.
- A 14px, descripción 13px/1.6 `--muted`, máx 240px:
  `Creamos detalles únicos hechos a mano para regalar amor y felicidad.`
- A 18px, 4 botones circulares 34px, fondo blanco, borde `1px --brand-300`, icono 16px `--brand-700`, `gap: 10px`: Instagram, Facebook, TikTok, WhatsApp. Hover: fondo `--brand-700`, icono blanco.

**Columnas 2–4 —** encabezado 14px/700 `--brand-900`, `margin-bottom: 14px`; links 13px `--muted`, `gap: 9px` vertical, hover `--brand-700`.

| Tienda | Información | Ayuda |
|---|---|---|
| Flores | Crear mi ramo | Contacto |
| Ramos | Personalizados | ¿Cómo comprar? |
| Macetas | Sobre nosotros | Métodos de pago |
| Muñequitos | Envíos y entregas | Cambios y devoluciones |
| Llaveros | Políticas de compra | |
| Todos los productos | Preguntas frecuentes | |

**Columna 5 — contacto:** panel fondo blanco (o `--brand-50`), `--r-md`, `padding: 20px`, borde `1px --brand-300`.
- `¿Tienes dudas?` 15px/700 `--brand-900`.
- `Escríbenos por WhatsApp` 13px `--muted` a 4px.
- A 14px, botón ancho completo: fondo `--grad-cta`, texto blanco 14px/700, `height: 46px`, `--r-sm`, icono WhatsApp 18px → `Ir a WhatsApp`.
- A 16px, tres filas con icono 15px `--brand-500` + texto 13px `--ink`, `gap: 9px`:
  `+57 300 123 4567` (`tel:`) · `makyp.creations@gmail.com` (`mailto:`) · `Colombia`

**Barra inferior:** a 32px del grid, borde superior `1px --brand-300` (`opacity: .4`), `padding-block: 18px`, `space-between`, texto 12px `--muted`:
- Izquierda: `© 2024 Makyp Creations. Todos los derechos reservados.` (usa el año dinámico).
- Derecha: `Diseñado con` + corazón lleno 12px `--brand-700` + `y limpiapipas`.

**Responsive:** `lg` 2 columnas (marca + contacto arriba, listas abajo) · `<640px` 1 columna, barra inferior centrada en dos líneas.

---

### 3.9 WhatsAppFab

- `position: fixed; right: 24px; bottom: 24px; z-index: 60` (mobile: 16px/16px).
- Círculo 58px (mobile 54px), fondo `--wa`, icono WhatsApp blanco 28px, `--sh-fab`.
- Hover: `scale(1.06)`. Focus visible con anillo `--brand-700`.
- `aria-label="Escríbenos por WhatsApp"`.
- Aparece con fade tras 400px de scroll (sin animación si `prefers-reduced-motion`).

---

## 4. Lógica y utilidades

**`lib/whatsapp.ts`**
```ts
buildWhatsAppUrl({ phone, message }): string  // https://wa.me/57XXXXXXXXXX?text=<encoded>
```
Mensajes en `data/site.ts`:
- General: `Hola Makyp Creations 💜 Quiero más información sobre sus detalles.`
- Producto: `Hola 💜 Me interesa el/la {nombre} ({precio}). ¿Está disponible?`

Todos los CTA de WhatsApp (header, footer, FAB, card de producto) usan esta misma función. Un solo número, un solo lugar.

**`lib/format.ts`** → `formatCOP(value: number)` con `Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 })`, limpiando el espacio tras `$`.

**`lib/analytics.ts`** → `track(event: string, payload?: Record<string, unknown>)`; por defecto `console.debug` en dev y no-op en prod. Instrumenta como mínimo: `cta_hero_ver_productos`, `cta_hero_crear_ramo`, `category_click`, `product_add_to_cart`, `whatsapp_click` (con `source`: header|footer|fab|product).

**Carrito v1:** contexto en memoria (`CartProvider`) que solo expone `items`, `count`, `addItem`. El badge del header lee `count`. Sin página de checkout.

---

## 5. Assets

Coloca los assets en `public/`:
```
public/
  logo/makyp-logo.png          # sinfondo.png provisto
  hero/ramo-hero.png
  categories/{flores,ramos,macetas,munequitos,llaveros,personalizados}.png
  products/{1..6}.png
  gallery/{1..7}.jpg
```
Si un archivo no existe, genera un placeholder SVG con fondo `--brand-50` y una silueta de flor en `--brand-300`; **no rompas el layout ni uses servicios externos de placeholder**. Usa `<img>` nativo con `width`/`height` explícitos para reservar espacio y evitar CLS: `loading="eager"` + `fetchPriority="high"` solo en la imagen del hero y del logo, `loading="lazy"` + `decoding="async"` en todo lo demás. Referencia los assets por ruta absoluta desde `public/` (ej. `/products/1.png`), no con `import`.

---

## 6. Calidad — criterios de aceptación

1. Sin scroll horizontal en 320px, 375px, 768px, 1024px, 1440px y 1920px.
2. Lighthouse ≥ 95 en Performance y Accessibility en desktop.
3. `:focus-visible` con anillo de 2px `--brand-700` y `offset: 2px` en todo elemento interactivo.
4. Cero `any` en TypeScript; props de cada componente con interfaz exportada en `types/`.
5. Cero valores de color, radio o sombra escritos a mano fuera de los tokens.
6. Todos los textos exactamente como se transcriben en este documento, con sus tildes y signos de apertura.
7. `prefers-reduced-motion: reduce` desactiva flotación del hero, fades y transiciones de transform.
8. HTML semántico: un solo `<h1>`, secciones con `<section aria-labelledby>`, navegación en `<nav>`, footer en `<footer>`.

---

## 7. Orden de construcción

1. Setup: scaffolding de Vite según el bloque de comandos de la sección 1, alias `@`, fuentes en `index.html`, `globals.css` con tokens, `tailwind.config.ts`, `main.tsx` con `BrowserRouter`. Verifica que `npm run dev` levante antes de seguir.
2. `ui/` (Button, SectionHeading, IconBadge, Carousel) + `lib/`.
3. `data/` completo con los datos de este spec.
4. Layout: AnnouncementBar, Header (desktop + drawer), Footer, WhatsAppFab.
5. Secciones en orden: Hero → CategoryStrip → FeaturedProducts → ValueProps → SocialGallery.
6. Pase responsive por breakpoint y pase de accesibilidad.
7. Reporte final: árbol de archivos y lista de decisiones tomadas donde el spec dejaba libertad.

Trabaja por bloques y muéstrame cada bloque terminado antes de continuar con el siguiente.
