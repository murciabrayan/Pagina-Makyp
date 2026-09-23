import { Link } from 'react-router-dom'
import { ArrowRight, Flower2, Gift, Package, Tags, TriangleAlert } from 'lucide-react'
import { EstadoCarga } from '@/components/ui/EstadoCarga'
import { FondoFloral, Petalos } from '@/components/admin/Adornos'
import { useRecurso } from '@/hooks/useRecurso'
import { useAuth } from '@/context/AuthContext'
import type { BuilderBundle, CategoriaAdmin, Product } from '@/types'

/**
 * Cada tarjeta lleva su propio color.
 *
 * Cuatro recuadros idénticos con un número dentro obligan a leer la etiqueta
 * de cada uno para saber cuál es cuál. Con un color por sección, la vista los
 * distingue antes de leerlos, y el color se repite luego en su pantalla, así
 * que acaba funcionando como una señal: lila es el catálogo, rosa las
 * categorías, azul el armador.
 */
const TONOS = {
  lila: {
    icono: 'bg-gradient-to-br from-brand-500 to-brand-900',
    halo: 'bg-brand-100',
    numero: 'text-brand-900',
  },
  rosa: {
    icono: 'bg-gradient-to-br from-blush-300 to-brand-500',
    halo: 'bg-blush-100',
    numero: 'text-brand-900',
  },
  azul: {
    icono: 'bg-gradient-to-br from-peri-500 to-brand-700',
    halo: 'bg-brand-100',
    numero: 'text-brand-900',
  },
  malva: {
    icono: 'bg-gradient-to-br from-brand-300 to-blush-300',
    halo: 'bg-blush-100',
    numero: 'text-brand-900',
  },
} as const

export function Panel() {
  const { usuario } = useAuth()
  const productos = useRecurso<Product[]>('/catalog/products/?admin=1')
  const categorias = useRecurso<CategoriaAdmin[]>('/catalog/categories/?admin=1')
  const armador = useRecurso<BuilderBundle>('/builder/bundle/')

  const cargando = productos.cargando || categorias.cargando || armador.cargando
  const error = productos.error ?? categorias.error ?? armador.error

  const tarjetas = [
    {
      a: '/admin/productos',
      etiqueta: 'Productos',
      icono: Package,
      cuantos: productos.datos?.length ?? 0,
      pie: 'en la tienda',
      tono: TONOS.lila,
    },
    {
      a: '/admin/categorias',
      etiqueta: 'Categorías',
      icono: Tags,
      cuantos: categorias.datos?.length ?? 0,
      pie: 'en el menú',
      tono: TONOS.rosa,
    },
    {
      a: '/admin/armador',
      etiqueta: 'Flores',
      icono: Flower2,
      cuantos: armador.datos?.flowers.length ?? 0,
      pie: 'para armar ramos',
      tono: TONOS.azul,
    },
    {
      a: '/admin/armador',
      etiqueta: 'Envolturas',
      icono: Gift,
      cuantos: armador.datos?.wrappers.length ?? 0,
      pie: 'disponibles',
      tono: TONOS.malva,
    },
  ]

  // Una categoría sin productos es un camino que muere: el cliente llega
  // desde el inicio y encuentra la nada. Conviene verlo al entrar.
  const vacias = (categorias.datos ?? []).filter((categoria) => categoria.productos_count === 0)

  const atajos = [
    { a: '/admin/productos', texto: 'Agregar un producto', icono: Package },
    { a: '/admin/armador', texto: 'Subir una flor', icono: Flower2 },
    { a: '/admin/contenido', texto: 'Cambiar el contacto', icono: Tags },
  ]

  const nombre = usuario?.nombre?.split(' ')[0] ?? 'equipo'

  return (
    <div>
      {/* ---------- saludo ---------- */}
      <header className="relative overflow-hidden rounded-[28px] bg-grad-cta p-7 shadow-lift animate-entrar md:p-10 xl:p-12">
        <FondoFloral />
        {/* Velo de luz en diagonal: le da al bloque una superficie, como si
            la luz entrara por arriba a la izquierda. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent"
        />

        <div className="relative">
          <p className="font-script text-[26px] leading-none text-white/90 md:text-[30px]">Hola,</p>
          <h1 className="mt-1 font-display text-[34px] font-extrabold leading-none text-white md:text-[44px]">
            {nombre}
          </h1>
          <p className="mt-3.5 max-w-[46ch] text-[14.5px] leading-[1.7] text-white/85">
            Desde aquí cambias lo que ve el cliente: los productos de la tienda, las flores del
            armador y los textos de la página.
          </p>
        </div>
      </header>

      {cargando || error ? (
        <EstadoCarga cargando={cargando} error={error} onReintentar={productos.recargar} />
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4 2xl:gap-4">
            {tarjetas.map(({ a, etiqueta, icono: Icono, cuantos, pie, tono }, i) => (
              <Link
                key={etiqueta}
                to={a}
                style={{ animationDelay: `${60 + i * 70}ms` }}
                className="group relative overflow-hidden rounded-[20px] border border-white/80 bg-grad-card p-4 shadow-soft transition-all duration-300 animate-entrar hover:-translate-y-1.5 hover:shadow-lift md:p-5"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
                />
                {/* Halo que despierta al pasar por encima. */}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl transition-all duration-500 group-hover:scale-150 ${tono.halo}`}
                />
                <Petalos
                  className={`pointer-events-none absolute -bottom-5 -right-4 h-20 w-20 text-brand-300/15 transition-transform duration-500 group-hover:rotate-45`}
                />

                <span
                  className={`relative flex h-12 w-12 items-center justify-center rounded-[14px] text-white shadow-boton transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${tono.icono}`}
                >
                  <Icono size={21} aria-hidden="true" />
                </span>
                <p
                  className={`relative mt-4 font-display text-[38px] font-extrabold leading-none ${tono.numero}`}
                >
                  {cuantos}
                </p>
                <p className="relative mt-2 text-[13.5px] font-bold text-ink">{etiqueta}</p>
                <p className="relative text-[12px] text-muted">{pie}</p>
              </Link>
            ))}
          </div>

          {vacias.length > 0 && (
            <div className="relative mt-5 flex items-start gap-4 overflow-hidden rounded-[20px] border border-blush-300/70 bg-gradient-to-br from-blush-100 via-white to-brand-50 p-5 shadow-soft animate-entrar [animation-delay:340ms]">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-white shadow-soft">
                <TriangleAlert size={20} className="text-brand-700" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-ink">
                  {vacias.length === 1
                    ? 'Hay una categoría sin productos'
                    : `Hay ${vacias.length} categorías sin productos`}
                </p>
                <p className="mt-1 text-[13px] leading-[1.65] text-muted">
                  <strong className="font-bold text-ink">
                    {vacias.map((c) => c.titulo).join(', ')}
                  </strong>
                  . Aparecen en el menú y en el inicio, pero quien entre no encontrará nada que
                  comprar. Puedes agregarles productos o esconderlas.
                </p>
                <Link
                  to="/admin/categorias"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[12.5px] font-bold text-brand-700 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
                >
                  Ir a Categorías <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}

          <section className="mt-8 animate-entrar [animation-delay:420ms]">
            <h2 className="flex items-center gap-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-muted">
              Lo que se hace más seguido
              <span aria-hidden="true" className="h-px flex-1 bg-line" />
            </h2>
            <div className="mt-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {atajos.map(({ a, texto, icono: Icono }) => (
                <Link
                  key={texto}
                  to={a}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-[18px] border border-white/80 bg-grad-card px-4 py-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1 bg-grad-boton opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-brand-50 text-brand-700 transition-all duration-300 group-hover:bg-grad-boton group-hover:text-white">
                    <Icono size={17} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-ink">
                    {texto}
                  </span>
                  <ArrowRight
                    size={15}
                    className="shrink-0 text-brand-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-700"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
