import { useCallback } from 'react'
import type { MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'

/**
 * Navegación con transición entre páginas.
 *
 * Usa la API de transiciones de vista del navegador: el fundido lo hace el
 * compositor, no JavaScript, así que no pesa ni suma librerías.
 *
 * `flushSync` es necesario: la API toma una foto del antes, ejecuta el cambio
 * y toma la del después. Si React aplaza el renderizado, la segunda foto sale
 * igual que la primera y no se ve ninguna transición.
 *
 * Si el navegador no la soporta, o si el sistema pide menos animación, navega
 * normal y ya.
 */
export function useViewTransition() {
  const navigate = useNavigate()

  return useCallback(
    (to: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      // clic con Ctrl/Cmd, rueda o similar: que el navegador abra otra pestaña
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      event.preventDefault()

      const start = document.startViewTransition?.bind(document)
      const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (!start || menosMovimiento) {
        navigate(to)
        return
      }

      start(() => {
        flushSync(() => navigate(to))
      })
    },
    [navigate],
  )
}
