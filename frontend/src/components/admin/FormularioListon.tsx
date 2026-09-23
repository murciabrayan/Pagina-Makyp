import { useMemo, useRef, useState } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'
import { ApiError } from '@/lib/api'
import { useRecurso } from '@/hooks/useRecurso'
import { Ventana } from './Ventana'
import { VistaPreviaRamo } from './VistaPreviaRamo'
import type { BuilderBundle, RibbonAsset } from '@/types'

interface Props {
  inicial?: Record<string, unknown> | null
  guardando: boolean
  onGuardar: (datos: FormData) => Promise<unknown>
  onCerrar: () => void
}

/**
 * El alta de un liston.
 *
 * Es la pieza mas sencilla del armador —un nombre y una foto— pero se muestra
 * igualmente sobre un ramo montado, porque el liston no se ve solo: se ve
 * amarrado, y su tamano lo decide la envoltura, no el. Lo que hay que
 * comprobar al subirlo es que el lazo case con el papel, y eso solo se
 * aprecia con el ramo puesto.
 *
 * La proporcion la mide el servidor al guardar, asi que aqui no se pregunta.
 */
export function FormularioListon({ inicial, guardando, onGuardar, onCerrar }: Props) {
  const editando = Boolean(inicial?.id)
  const entradaFoto = useRef<HTMLInputElement>(null)
  const { datos: bundle } = useRecurso<BuilderBundle>('/builder/bundle/')

  const [nombre, setNombre] = useState(String(inicial?.label ?? ''))
  const [visible, setVisible] = useState(inicial?.visible !== false)
  const [foto, setFoto] = useState<File | null>(null)
  const [vistaPrevia, setVistaPrevia] = useState(String(inicial?.imagen_url ?? ''))
  const [envolturaId, setEnvolturaId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string[]>>({})

  const envoltura = useMemo(() => {
    if (!bundle?.wrappers.length) return null
    return bundle.wrappers.find((w) => w.id === envolturaId) ?? bundle.wrappers[0]
  }, [bundle, envolturaId])

  /** El listón que se está creando, para pintarlo antes de existir. */
  const listonPrueba: RibbonAsset | null = vistaPrevia
    ? { id: '__nuevo__', label: nombre || 'Listón', image: vistaPrevia, aspect: 0.97 }
    : null

  /** Un ramo de muestra, para que el lazo no se vea flotando solo. */
  const { flores, cantidades } = useMemo(() => {
    if (!bundle?.flowers.length || !envoltura) return { flores: [], cantidades: {} }
    const cantidades: Record<string, number> = {}
    const porPapel = new Map<string, string>()
    for (const flor of bundle.flowers) {
      if (!porPapel.has(flor.role)) porPapel.set(flor.role, flor.id)
    }
    const cupo = envoltura.capacity
    for (const [papel, parte] of [
      ['face', 0.3],
      ['stem', 0.3],
      ['filler', 0.2],
      ['green', 0.2],
    ] as const) {
      const id = porPapel.get(papel)
      if (id) cantidades[id] = Math.max(1, Math.round(cupo * parte))
    }
    return { flores: bundle.flowers, cantidades }
  }, [bundle, envoltura])

  const elegirFoto = (archivo: File | null) => {
    if (!archivo) return
    setFoto(archivo)
    setVistaPrevia(URL.createObjectURL(archivo))
  }

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault()
    setError(null)
    setErrores({})

    if (!foto && !inicial?.imagen_url) {
      setError('Sube la foto del listón.')
      return
    }

    const datos = new FormData()
    datos.append('label', nombre.trim())
    datos.append('visible', visible ? 'true' : 'false')
    if (foto) datos.append('imagen', foto)

    try {
      await onGuardar(datos)
      onCerrar()
    } catch (fallo) {
      if (fallo instanceof ApiError) {
        setErrores(fallo.campos)
        setError(Object.keys(fallo.campos).length === 0 ? fallo.message : null)
      } else {
        setError('No se pudo guardar. Inténtalo otra vez.')
      }
    }
  }

  const pie = (
    <div className="flex items-center justify-end gap-2.5">
      <button
        type="button"
        onClick={onCerrar}
        className="rounded-full px-5 py-2.5 text-[13.5px] font-bold text-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="formulario-liston"
        disabled={guardando}
        className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-full bg-grad-boton px-6 py-3 text-[13.5px] font-bold text-white shadow-boton transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0 disabled:opacity-60"
      >
        {guardando ? (
          <>
            <Loader2 size={15} className="animate-spin" /> Guardando…
          </>
        ) : editando ? (
          'Guardar cambios'
        ) : (
          'Agregar listón'
        )}
      </button>
    </div>
  )

  return (
    <Ventana
      titulo={editando ? 'Editar listón' : 'Agregar un listón'}
      subtitulo="Míralo amarrado antes de guardarlo."
      tamano="ancha"
      pie={pie}
      onCerrar={onCerrar}
    >
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-[13px] border border-blush-300 bg-blush-100/70 px-4 py-3 text-[13px] text-ink"
        >
          {error}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-[1fr_minmax(0,320px)]">
        <form id="formulario-liston" onSubmit={enviar} className="flex flex-col gap-4">
          <div className="rounded-[16px] border border-line/70 bg-white p-4">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => entradaFoto.current?.click()}
                className="flex h-[110px] w-[110px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] border-2 border-dashed border-brand-300 bg-gradient-to-br from-white to-brand-50 transition-all hover:border-brand-700 hover:shadow-card"
              >
                {vistaPrevia ? (
                  <img src={vistaPrevia} alt="" className="h-full w-full object-contain p-2" />
                ) : (
                  <span className="flex flex-col items-center gap-1.5 px-2 text-center text-muted">
                    <ImagePlus size={24} className="text-brand-500" />
                    <span className="text-[11px] font-semibold leading-tight">Elegir foto</span>
                  </span>
                )}
              </button>
              <input
                ref={entradaFoto}
                type="file"
                accept="image/png,image/webp,image/*"
                className="sr-only"
                onChange={(e) => elegirFoto(e.target.files?.[0] ?? null)}
              />

              <div className="min-w-0 flex-1">
                <label htmlFor="liston-nombre" className="block text-[13px] font-bold text-ink">
                  ¿Cómo se llama?
                </label>
                <p className="mt-0.5 text-[12px] text-muted">
                  Como lo ve el cliente al elegir: Rosado, Azul…
                </p>
                <input
                  id="liston-nombre"
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Rosado"
                  className="mt-2 w-full rounded-[12px] border border-line bg-grad-campo px-4 py-3 text-[14.5px] text-ink shadow-[inset_0_1px_2px_rgba(63,49,112,0.06)] transition-all duration-200 hover:border-brand-300 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10"
                />
                {errores.label?.[0] && (
                  <p role="alert" className="mt-1.5 text-[12px] font-semibold text-brand-700">
                    {errores.label[0]}
                  </p>
                )}
              </div>
            </div>

            <p className="mt-3 text-[11.5px] leading-[1.5] text-muted">
              PNG o WebP con fondo transparente. Su proporción la medimos nosotros al guardar.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={visible}
            onClick={() => setVisible((v) => !v)}
            className={`inline-flex w-fit items-center gap-2.5 rounded-full border px-3.5 py-2.5 text-[13px] font-bold transition-colors ${
              visible
                ? 'border-brand-700 bg-brand-50 text-brand-900'
                : 'border-line bg-white text-muted'
            }`}
          >
            <span
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                visible ? 'bg-brand-700' : 'bg-brand-300'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                  visible ? 'left-[18px]' : 'left-0.5'
                }`}
              />
            </span>
            {visible ? 'Disponible en el armador' : 'Oculto para el cliente'}
          </button>
        </form>

        <div>
          <div className="rounded-[18px] border border-line/70 bg-white p-4">
            <p className="text-[13px] font-bold text-ink">Así se verá amarrado</p>

            {envoltura && bundle ? (
              <>
                <VistaPreviaRamo
                  className="mt-3"
                  wrapper={envoltura}
                  flores={flores}
                  cantidades={cantidades}
                  ribbon={listonPrueba}
                />

                <label className="mt-3 block text-[11.5px] font-bold text-muted">
                  Envoltura de referencia
                  <select
                    value={envoltura.id}
                    onChange={(e) => setEnvolturaId(e.target.value)}
                    className="mt-1 w-full cursor-pointer rounded-[10px] border border-line bg-white px-3 py-2 text-[12.5px] font-normal text-ink focus:border-brand-500 focus:outline-none"
                  >
                    {bundle.wrappers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="mt-2 text-[11px] leading-[1.5] text-muted">
                  El tamaño del lazo lo decide cada envoltura, no el listón.
                </p>
              </>
            ) : (
              <p className="mt-3 rounded-[12px] bg-brand-50 px-3 py-8 text-center text-[12px] text-muted">
                Cargando el armador…
              </p>
            )}
          </div>
        </div>
      </div>
    </Ventana>
  )
}
