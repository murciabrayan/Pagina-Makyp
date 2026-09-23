import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { alPerderSesion, api, setAccessToken } from '@/lib/api'
import type { AuthContextValue, UsuarioSesion } from '@/types'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null)
  // Arranca en true: hasta que no se resuelve el primer refresco no sabemos
  // si hay sesión, y pintar el login antes de saberlo haría parpadear la
  // pantalla a quien ya estaba dentro.
  const [comprobando, setComprobando] = useState(true)

  useEffect(() => {
    let cancelado = false

    const comprobarSesion = async () => {
      try {
        const token = await api.refrescar()
        if (cancelado) return
        if (!token) {
          setUsuario(null)
          return
        }
        const yo = await api.get<UsuarioSesion>('/auth/me/')
        if (!cancelado) setUsuario(yo)
      } catch {
        if (!cancelado) setUsuario(null)
      } finally {
        if (!cancelado) setComprobando(false)
      }
    }

    void comprobarSesion()
    return () => {
      cancelado = true
    }
  }, [])

  // Si el refresco falla en cualquier petición posterior, la sesión se acabó:
  // el cliente avisa y aquí se limpia, para que el panel mande al login solo.
  useEffect(() => alPerderSesion(() => setUsuario(null)), [])

  const entrar = useCallback(async (username: string, password: string) => {
    const datos = await api.post<{ access: string; user: UsuarioSesion }>(
      '/auth/login/',
      { username, password },
      true,
    )
    setAccessToken(datos.access)
    setUsuario(datos.user)
  }, [])

  const salir = useCallback(async () => {
    try {
      await api.post('/auth/logout/')
    } finally {
      // Pase lo que pase del lado del servidor, aquí la sesión se cierra: si
      // no, un fallo de red dejaría al usuario creyendo que sigue dentro.
      setAccessToken(null)
      setUsuario(null)
    }
  }, [])

  const valor = useMemo<AuthContextValue>(
    () => ({
      usuario,
      comprobando,
      esStaff: Boolean(usuario?.is_staff),
      entrar,
      salir,
    }),
    [usuario, comprobando, entrar, salir],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
