import { Loader2 } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

/**
 * Deja pasar solo al equipo.
 *
 * Mientras se comprueba si habia sesion no decide nada: si mandara al login
 * de inmediato, quien ya estaba dentro veria el formulario un instante en
 * cada recarga, porque el token vive en memoria y se recupera con la cookie
 * un momento despues de arrancar.
 *
 * Esto es comodidad, no seguridad. Lo que de verdad protege los datos es el
 * backend, que exige `is_staff` en cada peticion: aunque alguien forzara la
 * ruta en el navegador, no veria ni cambiaria nada.
 */
export function RutaProtegida({ children }: { children: React.ReactNode }) {
  const { esStaff, comprobando } = useAuth()
  const ubicacion = useLocation()

  if (comprobando) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen flex-col items-center justify-center gap-3 text-muted"
      >
        <Loader2 size={28} className="animate-spin text-brand-500" aria-hidden="true" />
        <p className="text-[13.5px]">Comprobando tu sesión…</p>
      </div>
    )
  }

  if (!esStaff) {
    // Se recuerda a dónde iba, para volver ahí después de entrar en vez de
    // dejarlo siempre en el tablero.
    return <Navigate to="/admin/login" replace state={{ destino: ubicacion.pathname }} />
  }

  return <>{children}</>
}
