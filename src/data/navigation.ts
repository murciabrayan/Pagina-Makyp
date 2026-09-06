import type { NavLinkItem } from '@/types'

export const navLinks: NavLinkItem[] = [
  { label: 'Inicio', href: '/', icon: 'home' },
  { label: 'Tienda', href: '/tienda', icon: 'store' },
  { label: 'Crear mi ramo', href: '/crear-mi-ramo', icon: 'flower' },
  { label: 'Ayuda', href: '/ayuda', icon: 'message-circle' },
]

export const footerLinks = {
  tienda: [
    { label: 'Flores', href: '/tienda?categoria=flores' },
    { label: 'Ramos', href: '/tienda?categoria=ramos' },
    { label: 'Macetas', href: '/tienda?categoria=macetas' },
    { label: 'Muñequitos', href: '/tienda?categoria=munequitos' },
    { label: 'Llaveros', href: '/tienda?categoria=llaveros' },
    { label: 'Todos los productos', href: '/tienda' },
  ],
  informacion: [
    { label: 'Crear mi ramo', href: '/crear-mi-ramo' },
    { label: 'Envíos y entregas', href: '/ayuda#envios' },
    { label: 'Preguntas frecuentes', href: '/ayuda' },
  ],
  // Antes había un "Contacto" que apuntaba a este mismo pie, donde el
  // visitante ya está parado, así que al tocarlo no pasaba nada. Los datos
  // de contacto están aquí al lado; en su lugar va otra pregunta de Ayuda.
  ayuda: [
    { label: '¿Cómo comprar?', href: '/ayuda#como-comprar' },
    { label: 'Métodos de pago', href: '/ayuda#pagos' },
    { label: 'Cambios y devoluciones', href: '/ayuda#cambios' },
    { label: '¿Cómo cuido mi ramo?', href: '/ayuda#cuidados' },
  ],
}
