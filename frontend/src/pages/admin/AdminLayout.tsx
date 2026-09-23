import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ExternalLink,
  Flower2,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Tags,
  Type,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useContent } from '@/context/ContentContext'
import { useTitulo } from '@/lib/useTitulo'

const SECCIONES = [
  { a: '/admin', etiqueta: 'Resumen', icono: LayoutDashboard, exacto: true },
  { a: '/admin/productos', etiqueta: 'Productos', icono: Package },
  { a: '/admin/categorias', etiqueta: 'Categorías', icono: Tags },
  { a: '/admin/armador', etiqueta: 'Armador', icono: Flower2 },
  { a: '/admin/contenido', etiqueta: 'Contenido', icono: Type },
]

/**
 * El armazon del panel.
 *
 * La navegacion va arriba, en horizontal, y no en una columna lateral. El
 * motivo es el espacio: una columna se come entre 240 y 280 pixeles de ancho
 * de forma permanente para mostrar cinco enlaces que casi nunca cambian. En
 * horizontal ocupan una franja que ya existia, y todo ese ancho queda para lo
 * que de verdad se mira, que son las fotos de los productos y las flores.
 *
 * La franja es oscura y el lienzo claro: separa de un vistazo "donde estoy"
 * de "que estoy editando", sin necesidad de bordes ni lineas.
 */
export function AdminLayout() {
  useTitulo('Panel')
  const { usuario, salir } = useAuth()
  const { recargar } = useContent()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)

  // Al cambiar de sección en el teléfono, el menú se cierra solo. Sin esto
  // queda tapando la pantalla a la que se acaba de entrar.
  useEffect(() => setMenuAbierto(false), [ubicacion.pathname])

  const cerrarSesion = async () => {
    await salir()
    navegar('/admin/login', { replace: true })
  }

  const iniciales = (usuario?.nombre ?? 'M').trim().charAt(0).toUpperCase()

  const enlace = (isActive: boolean) =>
    `relative flex items-center gap-2 rounded-full px-4 py-2.5 text-[13.5px] font-bold transition-all duration-200 ${
      isActive
        ? 'bg-white text-brand-900 shadow-soft'
        : 'text-white/70 hover:bg-white/12 hover:text-white'
    }`

  return (
    <div className="min-h-screen bg-grad-panel">
      {/* ---------- franja de navegación ---------- */}
      <header className="sticky top-0 z-40 bg-grad-menu shadow-soft">
        <div className="mx-auto flex h-[68px] max-w-[1600px] items-center gap-4 px-4 md:px-7">
          <Link to="/admin" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/95 shadow-sm">
              <img src="/logo/favicon.png" alt="" className="h-6 w-6 object-contain" />
            </span>
            <span className="hidden font-display text-[15px] font-bold leading-tight text-white sm:block">
              Makyp
              <span className="block text-[10.5px] font-normal text-white/55">Panel</span>
            </span>
          </Link>

          <nav className="mx-2 hidden flex-1 items-center gap-1.5 lg:flex">
            {SECCIONES.map(({ a, etiqueta, icono: Icono, exacto }) => (
              <NavLink key={a} to={a} end={exacto} className={({ isActive }) => enlace(isActive)}>
                <Icono size={15} aria-hidden="true" />
                {etiqueta}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/"
              onClick={() => recargar()}
              className="hidden items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-[12.5px] font-bold text-white/80 transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white md:inline-flex"
            >
              <ExternalLink size={14} />
              Ver la tienda
            </Link>

            <div className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-1 md:pr-2">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blush-300 text-[13px] font-bold text-white"
              >
                {iniciales}
              </span>
              <span className="hidden max-w-[110px] truncate text-[13px] font-bold text-white md:inline">
                {usuario?.nombre}
              </span>
              <button
                type="button"
                onClick={cerrarSesion}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/65 transition-colors hover:bg-white/15 hover:text-white"
              >
                <LogOut size={15} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMenuAbierto((v) => !v)}
              aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuAbierto}
              className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/12 text-white transition-colors hover:bg-white/22 lg:hidden"
            >
              {menuAbierto ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {/* En pantallas medianas y pequeñas las secciones bajan a su propia
            franja deslizable, en vez de esconderse tras un menú. Así siguen a
            un toque de distancia. */}
        {menuAbierto && (
          <nav className="flex gap-1.5 overflow-x-auto border-t border-white/10 px-4 py-2.5 lg:hidden">
            {SECCIONES.map(({ a, etiqueta, icono: Icono, exacto }) => (
              <NavLink
                key={a}
                to={a}
                end={exacto}
                className={({ isActive }) => `flex-none ${enlace(isActive)}`}
              >
                <Icono size={15} aria-hidden="true" />
                {etiqueta}
              </NavLink>
            ))}
            <Link
              to="/"
              onClick={() => recargar()}
              className="flex flex-none items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-[13.5px] font-bold text-white/75"
            >
              <ExternalLink size={14} /> Ver la tienda
            </Link>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 pb-20 md:px-7 md:py-8">
        <Outlet />
      </main>
    </div>
  )
}
