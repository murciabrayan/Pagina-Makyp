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
import { instantanea } from '@/lib/instantanea'
import type { Bootstrap, ContentContextValue } from '@/types'

const ContentContext = createContext<ContentContextValue | null>(null)

/**
 * Lo mínimo para que la página se sostenga si no hay nada más: el contacto,
 * para que el visitante pueda escribir por WhatsApp aunque todo falle.
 *
 * En producción casi nunca se usa, porque la tienda arranca con la copia del
 * catálogo que viaja dentro de ella (ver lib/instantanea.ts). Antes se
 * arrancaba siempre vacío para no mostrar precios viejos, pero con el
 * servidor gratuito dormido eso dejaba la tienda en blanco casi un minuto,
 * que es peor: la copia solo se ve hasta que llega la versión en vivo.
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
  const [datos, setDatos] = useState<Bootstrap>(() => instantanea<Bootstrap>('/bootstrap/') ?? VACIO)
  const [cargando, setCargando] = useState(() => instantanea('/bootstrap/') === null)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async (signal?: AbortSignal) => {
    const hayCopia = instantanea('/bootstrap/') !== null
    setCargando(!hayCopia)
    setError(null)
    try {
      const bootstrap = await api.get<Bootstrap>('/bootstrap/', signal)
      // Igual que la copia: se deja la que hay para no repintar por nada.
      setDatos((previo) =>
        JSON.stringify(previo) === JSON.stringify(bootstrap) ? previo : bootstrap,
      )
    } catch (fallo) {
      if (signal?.aborted) return
      // Con la copia en pantalla la tienda sigue completa: no hay que avisar.
      if (hayCopia) return
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
