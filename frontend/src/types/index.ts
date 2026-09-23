import type { ReactNode } from 'react'

/**
 * El slug de una categoria. Era una lista cerrada cuando las categorias
 * vivian en el codigo; ahora el equipo las crea desde el panel, asi que es
 * texto. Lo que antes vigilaba el compilador lo vigila ahora el backend, que
 * es donde se crean.
 */
export type ProductCategorySlug = string

export interface Product {
  id: number
  name: string
  price: number
  category: ProductCategorySlug
  image: string
  badge?: string
  description?: string
  includes?: string
}

export interface Category {
  slug: ProductCategorySlug
  title: string
  subtitle: string
  image: string
}

export type NavIconName = 'flower' | 'home' | 'store' | 'message-circle'

export interface NavLinkItem {
  label: string
  href: string
  icon?: NavIconName
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface CartContextValue {
  items: CartItem[]
  count: number
  total: number
  addItem: (product: Product) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
}

export interface WhatsAppMessageParams {
  phone: string
  message: string
}

export interface SocialLink {
  label: string
  href: string
  icon: ReactNode
}

// ---- Component prop interfaces ----

export interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'outline' | 'ghost' | 'whatsapp'
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  href?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  fullWidth?: boolean
  className?: string
  ariaLabel?: string
}

export interface CategoryCardProps {
  category: Category
}

export interface ProductModalProps {
  product: Product | null
  onClose: () => void
}

export interface IconBadgeProps {
  icon: ReactNode
  size?: number
  className?: string
}

export interface SectionHeadingProps {
  id?: string
  eyebrow?: ReactNode
  title: string
  action?: ReactNode
  align?: 'left' | 'center'
  className?: string
}


export interface HeaderProps {
  className?: string
}

export interface NavDesktopProps {
  links: NavLinkItem[]
  activeHref: string
}

export interface NavMobileProps {
  links: NavLinkItem[]
  activeHref: string
  isOpen: boolean
  onClose: () => void
}

export interface FooterProps {
  className?: string
}

export interface WhatsAppFabProps {
  className?: string
}

export interface HeroProps {
  className?: string
}

export interface HeroCarouselProps {
  slides: HeroSlideItem[]
  className?: string
}

export interface CategoryStripProps {
  categories: Category[]
}

export interface ValuePropsProps {
  items: ValuePropItem[]
  className?: string
}

export interface SocialGalleryProps {
  images: GalleryItem[]
  instagramUrl: string
}

export interface LayoutProps {
  children: ReactNode
}

// ---- Armador de ramos ----

/**
 * Papel de cada flor dentro del ramo. Define dónde va y cómo se coloca:
 * - face: flor abierta y grande, va abajo y al frente (la cara del ramo)
 * - stem: flor de tallo, va arriba y parada, en arco
 * - spike: espiga alta, va al fondo del arco
 * - filler: flor pequeña, va en la costura entre niveles
 * - green: follaje, va al fondo abriéndose hacia los lados
 */
export type FlowerRole = 'face' | 'stem' | 'spike' | 'filler' | 'green'

export interface FlowerAsset {
  id: string
  label: string
  image: string
  role: FlowerRole
  /**
   * Versión con tallo. El motor la usa cuando la flor queda en la parte
   * alta del ramo, para que el tallo baje y la conecte con el resto.
   */
  stem?: { image: string; w: number; h: number; anchor: { x: number; y: number } }
  /** Ancho de la imagen en unidades de escenario (escenario = 1000), a escala real entre flores. */
  w: number
  /** Alto de la imagen en unidades de escenario. */
  h: number
  /** Centro de la cabeza de la flor, en fracción de la imagen. Calculado desde el PNG. */
  anchor: { x: number; y: number }
}

export interface WrapperAsset {
  id: string
  label: string
  /** Tamaño en palabras, para que el nombre bonito no esconda el dato práctico. */
  size: string
  image: string
  /** ancho / alto de la imagen recortada. */
  aspect: number
  /** Centro del ramo dentro de la envoltura, en fracción de la caja de la envoltura. */
  cluster: { x: number; y: number }
  /** Radio del ramo, en fracción del ancho de la envoltura. */
  clusterR: number
  /** Cuánto se ven las flores respecto a esta envoltura (una envoltura pequeña las hace ver más grandes). */
  flowerScale: number
  /** Dónde amarra el listón, en fracción de la caja. */
  knot: { x: number; y: number; w: number }
  /** Cuántas flores caben de verdad en esta envoltura. */
  capacity: number
}

export interface RibbonAsset {
  id: string
  label: string
  image: string
  aspect: number
}

/** Una pieza ya ubicada por el motor, lista para pintar. */
export interface PlacedPiece {
  key: string
  /**
   * De qué flor salió esta pieza y qué ejemplar es (el 0, el 1…).
   *
   * Va aparte de la clave aunque se pueda deducir de ella, porque deducirlo
   * exige partir el texto por guiones y hay flores cuyo nombre ya los lleva
   * ("lirio-rosa"). Teniéndolo suelto, quitar una flor concreta del ramo es
   * mirar un campo en vez de adivinar dónde acaba el nombre.
   */
  flowerId: string
  indice: number
  image: string
  /** % del ancho de la envoltura. */
  left: number
  /** % del alto de la envoltura. */
  top: number
  /** % del ancho de la envoltura. */
  width: number
  rotate: number
  zIndex: number
  anchor: { x: number; y: number }
  /**
   * Punto sobre el que gira, en fracción de la imagen. Es la base del tallo,
   * no la cabeza: una flor se abre desde donde la sostiene la mano, así la
   * cabeza sale hacia afuera y no hacia adentro del ramo.
   */
  origin: { x: number; y: number }
  /** Se pinta espejada. El follaje apunta a un solo lado en su foto. */
  flip?: boolean
  /** true si el cliente la movió o le cambió la capa. */
  movida?: boolean
  /**
   * Qué tan al frente está, de 0 (el fondo) a 1 (lo más cercano). Sirve para
   * darle luz y sombra: lo del fondo queda en penumbra bajo lo de adelante.
   */
  depth: number
  alt: string
}

export interface BuilderState {
  wrapperId: string
  ribbonId: string
  /** id de flor -> cantidad */
  quantities: Record<string, number>
  /** Color general del ramo: lo toman todas las flores por defecto. */
  paletteColor: string
  /** id de flor -> color propio, cuando se quiere una distinta al resto. */
  flowerColors: Record<string, string>
  /**
   * Lo que el cliente movió a mano, por pieza. Vacío mientras no toque nada:
   * el ramo se arma solo y esto son solo los retoques encima.
   */
  ajustes: Record<string, AjustePieza>
  /**
   * Dónde quedaron las piezas que ya estaban, para que agregar una flor no
   * mueva las demás. Se llena al tocar el ramo y se vacía al reacomodar.
   */
  fijadas: Record<string, PosicionFija>
}

export interface BouquetPreviewProps {
  state: BuilderState
  wrapper: WrapperAsset
  /** Las piezas llegan por props: ahora las administra el equipo y vienen de la API. */
  flowers: FlowerAsset[]
  ribbons: RibbonAsset[]
  colorVariants: Record<string, FlowerColorConfig>
  /**
   * Si se pasa, el cliente puede mover las flores y cambiarlas de capa. Sin
   * esto la vista es solo para mirar.
   */
  onAjustar?: (clave: string, ajuste: AjustePieza | null) => void
  /** Quita del ramo el ejemplar que se está señalando. */
  onQuitar?: (flowerId: string, indice: number) => void
  /** Avisa de dónde quedó cada pieza, para poder congelarlas después. */
  onPiezas?: (piezas: PlacedPiece[]) => void
  className?: string
}


// ---- API ----

export interface UsuarioSesion {
  id: number
  username: string
  email: string
  nombre: string
  is_staff: boolean
  is_superuser: boolean
}

export interface AuthContextValue {
  usuario: UsuarioSesion | null
  /** true mientras se comprueba si habia sesion abierta. */
  comprobando: boolean
  esStaff: boolean
  entrar: (username: string, password: string) => Promise<void>
  salir: () => Promise<void>
}

export interface SiteInfo {
  whatsapp: { phone: string; displayPhone: string }
  email: string
  instagram: string
  tiktok: string
  facebook: string
  ubicacion: string
}

export interface HeroSlideItem {
  id: number
  image: string
  alt: string
}

export interface GalleryItem {
  id: number
  image: string
  alt: string
}

export interface ValuePropItem {
  id: number
  icon: string
  title: string
  description: string
}

export interface AyudaItem {
  id: string
  question: string
  answer: string[]
  list?: string[]
  note?: string
}

/** Lo que devuelve /api/bootstrap/: lo que la web necesita para pintarse. */
export interface Bootstrap {
  site: SiteInfo
  categories: Category[]
  hero: HeroSlideItem[]
  gallery: GalleryItem[]
  valueProps: ValuePropItem[]
  help: AyudaItem[]
}

export interface ContentContextValue extends Bootstrap {
  cargando: boolean
  error: string | null
  recargar: () => void
}

/** Lo que devuelve /api/builder/bundle/: el armador completo. */
export interface BuilderBundle {
  flowers: FlowerAsset[]
  wrappers: WrapperAsset[]
  ribbons: RibbonAsset[]
  colors: FlowerColorOption[]
  colorVariants: Record<string, FlowerColorConfig>
}

export interface FlowerColorOption {
  id: string
  label: string
  swatch: string
}

export interface FlowerColorConfig {
  base: string
  variants: Record<string, { image: string; stem?: string }>
}

/** Una pagina de resultados de la API. */
export interface Pagina<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/**
 * Una categoria tal como la devuelve la API con `?admin=1`.
 *
 * NO es lo mismo que `Category`: la vista publica traduce los nombres al
 * ingles (`title`, `image`) porque ese es el contrato que consume la tienda,
 * mientras que la de administracion entrega los campos del modelo en espanol.
 * Tenerlos separados evita el fallo que hubo: leer `title` de una respuesta
 * que trae `titulo` no da error de compilacion, solo deja la pantalla en
 * blanco sin decir por que.
 */
export interface CategoriaAdmin {
  id: number
  slug: string
  titulo: string
  subtitulo: string
  imagen_url: string
  imagen_ruta: string
  visible: boolean
  orden: number
  productos_count: number
}

/**
 * Un retoque del cliente sobre una pieza del ramo.
 *
 * El motor arma el ramo solo; esto es lo que el cliente cambió después. Va
 * aparte de la colocación automática a propósito: quitar el retoque devuelve
 * exactamente lo que había, y agregar flores no pelea con lo ya movido.
 */
/**
 * Donde quedo colocada una pieza, para que no se mueva al tocar el ramo.
 *
 * El motor arma el ramo entero de una vez: cambia una flor y recalcula todo,
 * porque el tamaño y el reparto dependen de cuantas haya. Eso esta bien la
 * primera vez, pero no cuando el cliente ya acomodo el ramo a su gusto y solo
 * quiere añadir una flor mas: todo lo demas se le movia debajo.
 *
 * Guardando donde acabo cada pieza, el motor las vuelve a poner ahi y calcula
 * sitio solo para las nuevas, esquivando a las que ya estaban.
 */
export interface PosicionFija {
  left: number
  top: number
  width: number
  rotate: number
  zIndex: number
}

export interface AjustePieza {
  /** Cuánto se corrió, en % del ancho de la envoltura. */
  dx?: number
  dy?: number
  /** La capa en la que quedó. Sin esto, manda la que decidió el motor. */
  z?: number
  /**
   * Cuánto se agrandó o encogió, como multiplicador. 1 es el tamaño que le
   * dio el motor; 0.7 la deja más pequeña y 1.4 más grande.
   */
  escala?: number
}
