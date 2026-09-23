import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/api'
import { useTitulo } from '@/lib/useTitulo'
import { Lazo, Petalos, Ramita } from '@/components/admin/Adornos'

export function Login() {
  useTitulo('Entrar al panel')
  const { entrar, esStaff, comprobando } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const destino = (ubicacion.state as { destino?: string } | null)?.destino ?? '/admin'

  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    document.getElementById('usuario')?.focus()
  }, [])

  // Si ya hay sesión, no tiene sentido pedir la clave otra vez.
  if (!comprobando && esStaff) return <Navigate to={destino} replace />

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await entrar(usuario.trim(), clave)
      navegar(destino, { replace: true })
    } catch (fallo) {
      if (fallo instanceof ApiError) {
        // El backend responde lo mismo para usuario inexistente y clave mala,
        // a propósito: distinguirlos permitiría averiguar qué cuentas existen.
        setError(
          fallo.status === 429
            ? 'Demasiados intentos seguidos. Espera un minuto y vuelve a probar.'
            : fallo.message,
        )
      } else {
        setError('No pudimos conectar con el servidor. Revisa que esté encendido.')
      }
    } finally {
      setEnviando(false)
    }
  }

  const campo =
    'w-full rounded-[13px] border border-line bg-grad-campo px-4 py-3.5 text-[14.5px] text-ink ' +
    'shadow-[inset_0_1px_2px_rgba(63,49,112,0.06)] transition-all duration-200 ' +
    'hover:border-brand-300 focus:border-brand-500 focus:bg-white focus:outline-none ' +
    'focus:ring-4 focus:ring-brand-700/10'

  return (
    /*
      La pantalla se parte en dos: a la izquierda la marca, a la derecha el
      formulario. Antes era una tarjeta suelta en medio de un fondo, que es lo
      que hace que un login parezca una plantilla. Con la mitad ocupada por el
      lila de la casa, lo primero que se ve al entrar es de quién es esto.

      En el teléfono no cabe esa mitad, así que se reduce a una franja de
      color arriba: la misma idea, sin robarle sitio al formulario.
    */
    <main className="flex min-h-screen flex-col lg:flex-row">
      {/* ---------- lado de la marca ---------- */}
      <div className="relative flex shrink-0 items-end overflow-hidden bg-grad-menu px-7 py-8 lg:w-[46%] lg:px-12 lg:py-12">
        <Petalos className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 text-white/[0.07] motion-safe:animate-deriva" />
        <Ramita className="pointer-events-none absolute -bottom-10 left-10 h-56 w-56 text-white/[0.06] motion-safe:animate-deriva [animation-delay:-6s]" />
        <Lazo className="pointer-events-none absolute right-16 top-1/3 h-32 w-32 text-blush-300/20 motion-safe:animate-deriva [animation-delay:-10s]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent"
        />

        <div className="relative w-full">
          <img
            src="/logo/makyp-logo.webp"
            alt="Makyp Creations"
            className="h-12 w-auto brightness-0 invert lg:h-16"
          />
          <p className="mt-6 font-script text-[26px] leading-none text-blush-300 lg:mt-10 lg:text-[34px]">
            Detalles hechos a mano
          </p>
          <h2 className="mt-2 max-w-md font-display text-[26px] font-extrabold leading-tight text-white lg:text-[38px]">
            El panel de tu tienda
          </h2>
          <p className="mt-3 hidden max-w-sm text-[14px] leading-[1.7] text-white/70 lg:block">
            Aquí cambias los productos, las flores del armador y los textos de la página, sin tocar
            código.
          </p>
        </div>
      </div>

      {/* ---------- lado del formulario ---------- */}
      <div className="flex flex-1 items-center justify-center bg-grad-panel px-5 py-10 lg:px-12">
        <div className="w-full max-w-[380px] animate-entrar">
          <h1 className="font-display text-[28px] font-bold leading-tight text-brand-900">
            Hola de nuevo
          </h1>
          <p className="mt-1.5 text-[14px] text-muted">Entra con tu usuario y contraseña.</p>

          <form onSubmit={enviar} className="mt-8 flex flex-col gap-5">
            <div>
              <label htmlFor="usuario" className="block text-[13px] font-bold text-ink">
                Usuario
              </label>
              <input
                id="usuario"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className={`mt-2 ${campo}`}
              />
            </div>

            <div>
              <label htmlFor="clave" className="block text-[13px] font-bold text-ink">
                Contraseña
              </label>
              <div className="relative mt-2">
                <input
                  id="clave"
                  name="password"
                  type={verClave ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  className={`${campo} pr-[3.25rem]`}
                />
                {/*
                  Mostrar la contraseña. Es la diferencia entre equivocarse
                  tres veces en el teléfono y entrar a la primera.
                  `aria-pressed` porque es un interruptor: quien usa lector de
                  pantalla necesita oír si está activado, no solo el nombre.
                */}
                <button
                  type="button"
                  onClick={() => setVerClave((v) => !v)}
                  aria-label={verClave ? 'Ocultar la contraseña' : 'Mostrar la contraseña'}
                  aria-pressed={verClave}
                  title={verClave ? 'Ocultar' : 'Mostrar'}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[10px] text-muted transition-colors hover:bg-brand-100 hover:text-brand-700"
                >
                  {verClave ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-[13px] border border-blush-300 bg-blush-100/70 px-4 py-3 text-[13px] leading-[1.55] text-ink"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-grad-boton text-[15px] font-bold text-white shadow-boton transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0 disabled:opacity-60"
            >
              {enviando ? (
                <>
                  <Loader2 size={17} className="animate-spin" /> Entrando…
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[13px]">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 font-bold text-brand-700 transition-colors hover:text-brand-900"
            >
              <ArrowLeft size={15} /> Volver a la tienda
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
