import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '@/lib/api'
import { contactoDeRespaldo } from '@/data/respaldo'
import type { Bootstrap, ContentContextValue } from '@/types'

const ContentContext = createContext<ContentContextValue | null>(null)

/**
 * Lo mínimo para que la página no aparezca vacía mientras carga, y para que
 * siga sirviendo de algo si el servidor no responde.
 *
 * Lleva solo el teléfono, y es deliberado: si el backend se cae, el visitante
 * tiene que poder escribir por WhatsApp de todos modos, porque ahí es donde
 * se cierra la venta. Lo que NO lleva son productos ni precios. Un catálogo
 * de respaldo se quedaría viejo sin que nadie lo note, y un cliente pidiendo
 * a un precio que ya no existe es peor que una tienda que avisa que no cargó.
 */
const VACIO: Bootstrap = {
  site: contactoDeRespaldo,
  categories: [],
  hero: [],
  gallery: [],
  valueProps: [],
  help: [],
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [datos, setDatos] = useState<Bootstrap>(VACIO)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async (signal?: AbortSignal) => {
    setCargando(true)
    setError(null)
    try {
      const bootstrap = await api.get<Bootstrap>('/bootstrap/', signal)
      setDatos(bootstrap)
    } catch (fallo) {
      if (signal?.aborted) return
      setError(fallo instanceof Error ? fallo.message : 'No se pudo cargar el contenido.')
    } finally {
      if (!signal?.aborted) setCargando(false)
    }
  }, [])

  useEffect(() => {
    const controlador = new AbortController()
    void cargar(controlador.signal)
    return () => controlador.abort()
  }, [cargar])

  const valor = useMemo<ContentContextValue>(
    () => ({ ...datos, cargando, error, recargar: () => cargar() }),
    [datos, cargando, error, cargar],
  )

  return <ContentContext.Provider value={valor}>{children}</ContentContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useContent(): ContentContextValue {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent debe usarse dentro de ContentProvider')
  return ctx
}
