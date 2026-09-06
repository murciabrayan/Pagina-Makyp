import type { ReactNode } from 'react'

export type ProductCategorySlug =
  | 'flores'
  | 'ramos'
  | 'macetas'
  | 'munequitos'
  | 'llaveros'
  | 'personalizados'

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
  className?: string
}

export interface CategoryStripProps {
  categories: Category[]
}

export interface ValuePropsProps {
  className?: string
}

export interface SocialGalleryProps {
  images: string[]
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
}

export interface BouquetPreviewProps {
  state: BuilderState
  wrapper: WrapperAsset
  className?: string
}
