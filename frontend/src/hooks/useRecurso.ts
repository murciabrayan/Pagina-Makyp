import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { instantanea } from '@/lib/instantanea'

interface Estado<T> {
  datos: T | null
  cargando: boolean
  error: string | null
  recargar: () => void
}

/**
 * Trae algo de la API y lleva la cuenta de si está cargando o falló.
 *
 * Existe para no repetir el mismo bloque de `useState` triplicado en cada
 * pantalla. Aborta la petición al desmontar, que es lo que evita el aviso de
 * React por actualizar un componente que ya no está: pasa de verdad cuando se
 * navega rápido entre la tienda y el armador.
 *
 * Con `instantanea`, la pantalla arranca con la copia del catálogo que viaja
 * dentro de la tienda y la cambia por la versión en vivo cuando llega. Es para
 * las pantallas públicas: así nadie ve la tienda en blanco mientras el
 * servidor despierta. El panel no la usa, porque ahí se edita y tiene que ver
 * siempre lo que de verdad hay en la base.
 */
export function useRecurso<T>(
  ruta: string | null,
  opciones: { instantanea?: boolean } = {},
): Estado<T> {
  const conCopia = opciones.instantanea === true
  const [datos, setDatos] = useState<T | null>(() =>
    ruta !== null && conCopia ? instantanea<T>(ruta) : null,
  )
  const [cargando, setCargando] = useState(ruta !== null && datos === null)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  const recargar = useCallback(() => setIntento((n) => n + 1), [])

  useEffect(() => {
    if (ruta === null) {
      setCargando(false)
      return
    }

    const controlador = new AbortController()
    // Con copia no hay nada que esperar: ya se está mostrando algo completo.
    const hayCopia = conCopia && instantanea<T>(ruta) !== null
    setCargando(!hayCopia)
    setError(null)

    api
      .get<T>(ruta, controlador.signal)
      .then((respuesta) => {
        if (controlador.signal.aborted) return
        // Si lo que llega es igual a la copia se deja la copia: cambiarla
        // volvería a pintar la pantalla entera sin que nada haya cambiado.
        setDatos((previo) =>
          previo !== null && JSON.stringify(previo) === JSON.stringify(respuesta) ? previo : respuesta,
        )
      })
      .catch((fallo: unknown) => {
        if (controlador.signal.aborted) return
        // Con la copia en pantalla, un fallo no se muestra: la tienda sigue
        // completa, y es mejor eso que cambiarla por un aviso de error.
        if (hayCopia) return
        setError(fallo instanceof Error ? fallo.message : 'No se pudo cargar.')
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false)
      })

    return () => controlador.abort()
  }, [ruta, intento, conCopia])

  return { datos, cargando, error, recargar }
}
