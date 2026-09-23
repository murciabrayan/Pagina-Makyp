import { type ReactNode } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Petalos } from './Adornos'

export interface Ficha {
  id: number | string
  /** La foto. Sin ella se pinta un hueco con el nombre. */
  imagen?: string
  /** Un color plano en vez de foto, para la paleta. */
  color?: string
  titulo: string
  /** Una o dos líneas bajo el título. */
  detalle?: string
  /** La etiqueta de estado, arriba a la derecha. */
  visible?: boolean
  /** Dato destacado: el precio, el cupo… */
  destacado?: ReactNode
}

interface Props {
  fichas: Ficha[]
  /** Nombre en singular, para los textos. */
  singular: string
  onCrear: () => void
  onEditar: (id: number | string) => void
  onBorrar: (id: number | string) => void
  /** Cuántas caben por fila en pantalla ancha. Las fotos altas piden menos. */
  columnas?: 'normal' | 'estrecha'
}

/**
 * La vista de una seccion: tarjetas con foto, no filas de texto.
 *
 * Todo lo que se administra aqui —productos, flores, envolturas, listones—
 * es algo que se mira. Una lista obliga a leer el nombre de cada fila para
 * saber cual es cual, cuando la foto lo dice de un vistazo; y una tienda de
 * flores administrada como una hoja de calculo se siente ajena a lo que
 * vende.
 *
 * Los botones de editar y borrar solo aparecen al acercarse a la tarjeta,
 * para que la rejilla se lea limpia. En pantallas tactiles, donde no hay
 * "acercarse", estan siempre visibles: por eso el `opacity` se activa con
 * `sm:`, que no se aplica en el telefono.
 */
export function Rejilla({
  fichas,
  singular,
  onCrear,
  onEditar,
  onBorrar,
  columnas = 'normal',
}: Props) {
  const rejilla =
    columnas === 'estrecha'
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5'
      : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'

  if (fichas.length === 0) {
    return (
      <div className="relative mt-6 overflow-hidden rounded-[26px] border border-white/80 bg-grad-card px-5 py-20 text-center shadow-soft">
        <Petalos className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 text-brand-300/20" />
        <Petalos className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 text-blush-300/20" />
        <div className="relative">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-grad-boton text-white shadow-boton">
            <Plus size={26} />
          </span>
          <p className="mt-5 font-display text-[20px] font-bold text-brand-900">
            Todavía no hay nada aquí
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-[1.65] text-muted">
            Agrega {singular === 'flor' || singular === 'envoltura' ? 'tu primera' : 'tu primer'}{' '}
            {singular} y aparecerá en esta rejilla.
          </p>
          <button
            type="button"
            onClick={onCrear}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-grad-boton px-6 py-3 text-[14px] font-bold text-white shadow-boton transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
          >
            <Plus size={18} /> Agregar {singular}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`mt-5 grid gap-3.5 ${rejilla}`}>
      {/* Crear va dentro de la rejilla, como una tarjeta más: está donde se
          está mirando, no en una esquina de la pantalla. */}
      <button
        type="button"
        onClick={onCrear}
        className="group flex min-h-[210px] flex-col items-center justify-center gap-2.5 rounded-[20px] border-2 border-dashed border-brand-300 bg-grad-card p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:border-brand-700 hover:shadow-card"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-brand-100 text-brand-700 transition-all duration-200 group-hover:bg-grad-boton group-hover:text-white group-hover:shadow-boton">
          <Plus size={22} />
        </span>
        <span className="text-[13px] font-bold text-brand-700">Agregar {singular}</span>
      </button>

      {fichas.map((ficha, i) => (
        <article
          key={ficha.id}
          style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}
          className="group relative flex flex-col overflow-hidden rounded-[20px] border border-white/80 bg-grad-card shadow-soft transition-all duration-200 animate-entrar hover:-translate-y-1 hover:shadow-lift"
        >
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-brand-50 to-white">
            {ficha.color ? (
              <span
                aria-hidden="true"
                className="absolute inset-0"
                style={{ backgroundColor: ficha.color }}
              />
            ) : ficha.imagen ? (
              <img
                src={ficha.imagen}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center px-3 text-center text-[12px] text-muted">
                Sin foto
              </span>
            )}

            {ficha.visible === false && (
              <span className="absolute left-2.5 top-2.5 rounded-full bg-ink/70 px-2.5 py-1 text-[10.5px] font-bold text-white backdrop-blur-sm">
                Oculto
              </span>
            )}

            {ficha.destacado !== undefined && (
              <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-bold text-brand-900 shadow-soft backdrop-blur-sm">
                {ficha.destacado}
              </span>
            )}

            <div className="absolute right-2.5 top-2.5 flex gap-1.5 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <button
                type="button"
                onClick={() => onEditar(ficha.id)}
                aria-label={`Editar ${ficha.titulo}`}
                className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white/95 text-brand-700 shadow-soft backdrop-blur-sm transition-colors hover:bg-brand-700 hover:text-white"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => onBorrar(ficha.id)}
                aria-label={`Borrar ${ficha.titulo}`}
                className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white/95 text-muted shadow-soft backdrop-blur-sm transition-colors hover:bg-blush-300 hover:text-white"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="flex flex-1 flex-col p-3.5">
            <h3 className="text-[14px] font-bold leading-tight text-ink">{ficha.titulo}</h3>
            {ficha.detalle && (
              <p className="mt-1 text-[12px] leading-[1.45] text-muted">{ficha.detalle}</p>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}
