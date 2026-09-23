import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Decide a qué altura queda la página al navegar.
 *
 * React Router no reinicia el scroll por su cuenta: si entrabas a la tienda
 * desde una categoría del inicio, caías a media página o hasta abajo, en la
 * misma altura donde venías.
 *
 * Reacciona solo al cambio de ruta, no de los parámetros: así filtrar por
 * categoría dentro de la tienda no da saltos. Y si la navegación viene del
 * enlace de Contacto, en vez de subir baja hasta el pie.
 */
export function ScrollToTop() {
  const { pathname, state, hash } = useLocation()
  // si la URL trae ancla, manda la página de destino (por ejemplo Ayuda, que
  // además abre la pregunta correspondiente)
  const hasHashRef = useRef(Boolean(hash))
  hasHashRef.current = Boolean(hash)
  // el destino se lee en una referencia para que el efecto dependa solo de la
  // ruta; si dependiera del estado, cualquier cambio de parámetros lo dispararía
  const goToContact = Boolean((state as { scrollToContact?: boolean } | null)?.scrollToContact)
  const goToContactRef = useRef(goToContact)
  goToContactRef.current = goToContact

  useEffect(() => {
    // con ancla no se toca nada: la página de destino lleva al punto exacto
    if (hasHashRef.current) return
    if (!goToContactRef.current) {
      window.scrollTo(0, 0)
      return
    }
    // Se ajusta un par de veces: al entrar, la página todavía está cargando
    // imágenes y el pie se sigue moviendo hacia abajo, así que una sola
    // llamada se queda corta.
    const bajarAlPie = () => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })
    const raf = window.requestAnimationFrame(bajarAlPie)
    const t1 = window.setTimeout(bajarAlPie, 350)
    const t2 = window.setTimeout(bajarAlPie, 900)
    return () => {
      window.cancelAnimationFrame(raf)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [pathname])

  return null
}
