import { useCallback, useEffect, useState } from 'react'
import { ApiError, api } from '@/lib/api'

export interface EstadoCrud<T> {
  filas: T[]
  cargando: boolean
  error: string | null
  guardando: boolean
  recargar: () => void
  crear: (datos: FormData | Record<string, unknown>) => Promise<T>
  editar: (id: number | string, datos: FormData | Record<string, unknown>) => Promise<T>
  borrar: (id: number | string) => Promise<void>
}

/**
 * Lista y edita un recurso de la API.
 *
 * Pide siempre con `?admin=1`, que es lo que hace que el backend devuelva
 * también lo que está sin publicar y con todos sus campos. Sin eso el panel
 * mostraría solo lo que ve un cliente y no habría forma de volver a publicar
 * algo que se ocultó.
 *
 * Después de cada cambio recarga la lista completa en vez de parchear la
 * copia local. Es una petición más, pero evita el error clásico de un panel:
 * que la pantalla diga una cosa y la base tenga otra porque el servidor
 * ajustó algo al guardar (un slug, un orden, una imagen redimensionada).
 */
export function useCrud<T extends { id: number | string }>(ruta: string): EstadoCrud<T> {
  const [filas, setFilas] = useState<T[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async (signal?: AbortSignal) => {
    setCargando(true)
    setError(null)
    try {
      const datos = await api.get<T[]>(`${ruta}?admin=1`, signal)
      setFilas(Array.isArray(datos) ? datos : [])
    } catch (fallo) {
      if (signal?.aborted) return
      setError(fallo instanceof ApiError ? fallo.message : 'No se pudo cargar la lista.')
    } finally {
      if (!signal?.aborted) setCargando(false)
    }
  }, [ruta])

  useEffect(() => {
    const controlador = new AbortController()
    void cargar(controlador.signal)
    return () => controlador.abort()
  }, [cargar])

  const crear = useCallback(
    async (datos: FormData | Record<string, unknown>) => {
      setGuardando(true)
      try {
        const fila = await api.post<T>(ruta, datos)
        await cargar()
        return fila
      } finally {
        setGuardando(false)
      }
    },
    [ruta, cargar],
  )

  const editar = useCallback(
    async (id: number | string, datos: FormData | Record<string, unknown>) => {
      setGuardando(true)
      try {
        const fila = await api.patch<T>(`${ruta}${id}/`, datos)
        await cargar()
        return fila
      } finally {
        setGuardando(false)
      }
    },
    [ruta, cargar],
  )

  const borrar = useCallback(
    async (id: number | string) => {
      setGuardando(true)
      try {
        await api.delete(`${ruta}${id}/`)
        await cargar()
      } finally {
        setGuardando(false)
      }
    },
    [ruta, cargar],
  )

  return { filas, cargando, error, guardando, recargar: () => cargar(), crear, editar, borrar }
}
