import { useEffect } from 'react'

const MARCA = 'Makyp Creations'
const INICIO = `${MARCA} — Detalles artesanales con limpiapipas`

/**
 * Título de la pestaña según la página.
 *
 * Al ser una sola página con rutas, el `<title>` del HTML se queda fijo y
 * todas las vistas se ven igual en la pestaña, en el historial y en los
 * marcadores. Esto lo ajusta al navegar.
 *
 * No arregla la vista previa al compartir el enlace: ese rastreador no
 * ejecuta JavaScript y solo lee el HTML servido. Para eso están las etiquetas
 * Open Graph de `index.html`.
 */
export function useTitulo(titulo?: string) {
  useEffect(() => {
    document.title = titulo ? `${titulo} — ${MARCA}` : INICIO
  }, [titulo])
}
