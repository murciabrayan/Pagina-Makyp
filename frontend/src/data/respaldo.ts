import type { SiteInfo } from '@/types'

/**
 * Datos de contacto de respaldo.
 *
 * Los de verdad vienen de la API y el equipo los edita desde el panel. Esta
 * copia existe para un solo caso: que el servidor no responda. Ahí la página
 * se sigue viendo y el visitante todavía puede escribir por WhatsApp, que es
 * donde se cierra la venta.
 *
 * Si el número cambia, hay que cambiarlo también aquí. Es la única duplicación
 * que se deja a propósito en todo el proyecto.
 */
export const contactoDeRespaldo: SiteInfo = {
  whatsapp: {
    phone: '573203684500',
    displayPhone: '+57 320 368 4500',
  },
  email: 'makyp.creations@gmail.com',
  instagram: 'https://www.instagram.com/makyp_creations/',
  tiktok: 'https://www.tiktok.com/@makyp_creations',
  facebook: '',
  ubicacion: 'Colombia',
}
