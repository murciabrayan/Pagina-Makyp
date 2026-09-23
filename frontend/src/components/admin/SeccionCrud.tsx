import { useMemo, useState, type ReactNode } from 'react'
import { Search, Trash2 } from 'lucide-react'
import { EstadoCarga } from '@/components/ui/EstadoCarga'
import { useCrud } from '@/hooks/useCrud'
import { FormularioRecurso } from './FormularioRecurso'
import { Rejilla, type Ficha } from './Rejilla'
import type { Campo } from './campos'

interface PropsFormulario {
  inicial: Record<string, unknown> | null
  guardando: boolean
  onGuardar: (datos: FormData | Record<string, unknown>) => Promise<unknown>
  onCerrar: () => void
}

interface Props<T extends { id: number | string }> {
  titulo: string
  descripcion?: string
  /** Ruta del recurso en la API, terminada en barra. */
  ruta: string
  campos: Campo[]
  /** Cómo se ve cada elemento dentro de la rejilla. */
  aFicha: (fila: T) => Ficha
  /** Nombre en singular, para los botones y los mensajes. */
  singular: string
  columnas?: 'normal' | 'estrecha'
  /**
   * Un formulario propio, cuando el genérico no basta. El del armador es el
   * caso: en vez de pedir las medidas, sube la foto y las calcula.
   */
  formulario?: (props: PropsFormulario) => ReactNode
}

/**
 * Una seccion completa del panel: la rejilla, el alta, la edicion y la baja.
 *
 * Cada entidad declara como se ve una de sus piezas (`aFicha`) y que campos
 * tiene (`campos`); el resto —buscar, crear, editar, borrar, los estados de
 * carga y de error— esta aqui una sola vez. Es lo que mantiene el panel
 * coherente: todas las secciones se comportan igual porque son la misma.
 */
export function SeccionCrud<T extends { id: number | string }>({
  titulo,
  descripcion,
  ruta,
  campos,
  aFicha,
  singular,
  columnas = 'normal',
  formulario,
}: Props<T>) {
  const { filas, cargando, error, guardando, recargar, crear, editar, borrar } = useCrud<T>(ruta)
  const [editando, setEditando] = useState<T | null>(null)
  const [creando, setCreando] = useState(false)
  const [aBorrar, setABorrar] = useState<T | null>(null)
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')

  const fichas = useMemo(() => filas.map((fila) => ({ fila, ficha: aFicha(fila) })), [filas, aFicha])

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return fichas
    return fichas.filter(
      ({ ficha }) =>
        ficha.titulo.toLowerCase().includes(q) || (ficha.detalle ?? '').toLowerCase().includes(q),
    )
  }, [fichas, busqueda])

  const porId = (id: number | string) => filas.find((f) => f.id === id) ?? null

  const confirmarBorrado = async () => {
    if (!aBorrar) return
    setErrorBorrado(null)
    try {
      await borrar(aBorrar.id)
      setABorrar(null)
    } catch (fallo) {
      // El caso típico: un producto que impide borrar su categoría. El
      // backend lo rechaza y hay que contarlo, no dejar el diálogo mudo.
      setErrorBorrado(
        fallo instanceof Error
          ? fallo.message
          : 'No se pudo borrar. Puede que algo más lo esté usando.',
      )
    }
  }

  const guardar = (datos: FormData | Record<string, unknown>) =>
    creando ? crear(datos) : editar((editando as T).id, datos)

  const cerrar = () => {
    setCreando(false)
    setEditando(null)
  }

  const femenino = singular === 'categoría' || singular === 'flor' || singular === 'envoltura'

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2.5 font-display text-[23px] font-bold text-brand-900">
            {titulo}
            {filas.length > 0 && (
              <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[12px] font-bold text-brand-700">
                {filas.length}
              </span>
            )}
          </h2>
          {descripcion && (
            <p className="mt-1 max-w-prose text-[13px] leading-[1.6] text-muted">{descripcion}</p>
          )}
        </div>

        {/* Buscar aparece solo cuando hay suficiente como para perderse. */}
        {filas.length > 7 && (
          <div className="relative w-full sm:w-[280px]">
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={`Buscar ${singular}…`}
              aria-label={`Buscar ${singular}`}
              className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-4 text-[13.5px] text-ink shadow-soft transition-colors placeholder:text-muted/70 hover:border-brand-300 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-700/10"
            />
          </div>
        )}
      </div>

      {cargando || error ? (
        <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />
      ) : busqueda && visibles.length === 0 ? (
        <p className="mt-8 rounded-[20px] border border-dashed border-brand-300 bg-grad-card px-5 py-14 text-center text-[13.5px] text-muted shadow-soft">
          No encontramos nada con “{busqueda.trim()}”.
        </p>
      ) : (
        <Rejilla
          fichas={visibles.map((v) => v.ficha)}
          singular={singular}
          columnas={columnas}
          onCrear={() => setCreando(true)}
          onEditar={(id) => setEditando(porId(id))}
          onBorrar={(id) => {
            setErrorBorrado(null)
            setABorrar(porId(id))
          }}
        />
      )}

      {(creando || editando) &&
        (formulario ? (
          formulario({
            inicial: editando as Record<string, unknown> | null,
            guardando,
            onGuardar: guardar,
            onCerrar: cerrar,
          })
        ) : (
          <FormularioRecurso
            titulo={creando ? `Agregar ${singular}` : `Editar ${singular}`}
            subtitulo={
              creando ? `Se añadirá a ${titulo.toLowerCase()}.` : 'Los cambios se ven al guardar.'
            }
            campos={campos}
            inicial={editando as Record<string, unknown> | null}
            guardando={guardando}
            onGuardar={guardar}
            onCerrar={cerrar}
          />
        ))}

      {aBorrar && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-ink/45 p-4 backdrop-blur-[3px]">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="borrar-titulo"
            className="w-full max-w-md overflow-hidden rounded-[24px] border border-white/70 bg-grad-card shadow-lift"
          >
            <div className="bg-gradient-to-br from-blush-100 to-white px-6 pb-5 pt-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-white shadow-soft">
                <Trash2 size={20} className="text-brand-700" aria-hidden="true" />
              </span>
              <h3
                id="borrar-titulo"
                className="mt-3.5 font-display text-[20px] font-bold text-brand-900"
              >
                ¿Borrar {femenino ? 'esta' : 'este'} {singular}?
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-[1.65] text-muted">
                Esta acción no se puede deshacer. Si solo quieres que deje de verse, puedes
                esconderlo en vez de borrarlo.
              </p>
            </div>

            {errorBorrado && (
              <p
                role="alert"
                className="mx-6 rounded-[12px] border border-blush-300 bg-blush-100/70 px-3.5 py-2.5 text-[13px] text-ink"
              >
                {errorBorrado}
              </p>
            )}

            <div className="flex justify-end gap-2.5 px-6 py-5">
              <button
                type="button"
                onClick={() => setABorrar(null)}
                className="rounded-full px-5 py-2.5 text-[13.5px] font-bold text-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarBorrado}
                disabled={guardando}
                className="rounded-full bg-grad-boton px-5 py-2.5 text-[13.5px] font-bold text-white shadow-boton transition-all hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-60"
              >
                {guardando ? 'Borrando…' : 'Sí, borrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
