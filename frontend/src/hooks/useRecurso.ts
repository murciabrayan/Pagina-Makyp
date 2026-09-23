import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'

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
 */
export function useRecurso<T>(ruta: string | null): Estado<T> {
  const [datos, setDatos] = useState<T | null>(null)
  const [cargando, setCargando] = useState(ruta !== null)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  const recargar = useCallback(() => setIntento((n) => n + 1), [])

  useEffect(() => {
    if (ruta === null) {
      setCargando(false)
      return
    }

    const controlador = new AbortController()
    setCargando(true)
    setError(null)

    api
      .get<T>(ruta, controlador.signal)
      .then((respuesta) => {
        if (!controlador.signal.aborted) setDatos(respuesta)
      })
      .catch((fallo: unknown) => {
        if (controlador.signal.aborted) return
        setError(fallo instanceof Error ? fallo.message : 'No se pudo cargar.')
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false)
      })

    return () => controlador.abort()
  }, [ruta, intento])

  return { datos, cargando, error, recargar }
}
