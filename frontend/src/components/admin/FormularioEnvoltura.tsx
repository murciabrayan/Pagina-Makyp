import { useMemo, useRef, useState } from 'react'
import { Check, ImagePlus, Loader2, Move } from 'lucide-react'
import { ApiError, api } from '@/lib/api'
import { useRecurso } from '@/hooks/useRecurso'
import { layoutBouquet } from '@/lib/bouquet'
import { Ventana } from './Ventana'
import type { BuilderBundle, WrapperAsset } from '@/types'

interface Props {
  inicial?: Record<string, unknown> | null
  guardando: boolean
  onGuardar: (datos: FormData) => Promise<unknown>
  onCerrar: () => void
}

interface Analisis {
  aspect: number
  ancho_px: number
  alto_px: number
  sugerencia: {
    cluster_x: number
    cluster_y: number
    cluster_r: number
    nudo_x: number
    nudo_y: number
    nudo_ancho: number
    escala_flores: number
  }
}

const TAMANOS = ['Pequeña', 'Mediana', 'Grande'] as const

/**
 * El alta de una envoltura, con el ramo montado encima mientras se ajusta.
 *
 * Una envoltura se define por donde se apoya el ramo, que tan ancho es y
 * donde amarra el lazo. Eso antes se pedia como ocho coordenadas escritas a
 * mano; luego paso a marcarse sobre la foto, pero con circulos de colores que
 * seguian siendo una abstraccion.
 *
 * Ahora lo que se ve encima de la foto son las flores de verdad, colocadas
 * por el mismo motor que usa la tienda. Al mover el punto o estirar el ancho,
 * el ramo se rehace al instante. Ya no hay que imaginarse nada: si el ramo
 * queda torcido o se sale del papel, se ve.
 */
export function FormularioEnvoltura({ inicial, guardando, onGuardar, onCerrar }: Props) {
  const editando = Boolean(inicial?.id)
  const lienzoRef = useRef<HTMLDivElement>(null)
  const entradaFoto = useRef<HTMLInputElement>(null)
  const { datos: bundle } = useRecurso<BuilderBundle>('/builder/bundle/')

  const [nombre, setNombre] = useState(String(inicial?.label ?? ''))
  const [tamano, setTamano] = useState(String(inicial?.tamano ?? 'Mediana'))
  const [capacidad, setCapacidad] = useState(Number(inicial?.capacidad ?? 12))
  const [visible, setVisible] = useState(inicial?.visible !== false)

  const [foto, setFoto] = useState<File | null>(null)
  const [vistaPrevia, setVistaPrevia] = useState(String(inicial?.imagen_url ?? ''))
  const [aspect, setAspect] = useState(Number(inicial?.aspect ?? 0.5))
  const [midiendo, setMidiendo] = useState(false)

  const [ramo, setRamo] = useState({
    x: Number(inicial?.cluster_x ?? 0.5),
    y: Number(inicial?.cluster_y ?? 0.3),
    r: Number(inicial?.cluster_r ?? 0.42),
  })
  const [nudo, setNudo] = useState({
    x: Number(inicial?.nudo_x ?? 0.5),
    y: Number(inicial?.nudo_y ?? 0.56),
    w: Number(inicial?.nudo_ancho ?? 0.4),
  })
  const [escalaFlores, setEscalaFlores] = useState(Number(inicial?.escala_flores ?? 1))

  /** Qué se está colocando al tocar la foto. */
  const [modo, setModo] = useState<'ramo' | 'nudo'>('ramo')
  const [conFlores, setConFlores] = useState(true)
  // En una referencia y no en el estado: el manejador de movimiento se crea
  // en el render anterior, asi que leyendo el estado se perderia el primer
  // tramo del gesto. El estado paralelo solo sirve para el aspecto del cursor.
  const arrastrando = useRef(false)
  const [arrastrandoVisual, setArrastrandoVisual] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string[]>>({})

  /** La envoltura tal como quedaría con lo que hay puesto ahora mismo. */
  const envolturaPrueba: WrapperAsset = useMemo(
    () => ({
      id: '__prueba__',
      label: nombre || 'Envoltura',
      size: tamano,
      image: vistaPrevia,
      aspect: aspect || 0.5,
      cluster: { x: ramo.x, y: ramo.y },
      clusterR: ramo.r,
      flowerScale: escalaFlores,
      knot: { x: nudo.x, y: nudo.y, w: nudo.w },
      capacity: capacidad,
    }),
    [nombre, tamano, vistaPrevia, aspect, ramo, escalaFlores, nudo, capacidad],
  )

  /**
   * Un ramo de muestra que llena mas o menos la envoltura. Se usa lo que ya
   * existe en el armador, no piezas inventadas: asi lo que se ve encima de la
   * foto es lo que de verdad va a colocarse ahi.
   */
  const piezas = useMemo(() => {
    if (!conFlores || !bundle?.flowers.length || !vistaPrevia) return []
    const cantidades: Record<string, number> = {}
    const porPapel = new Map<string, string>()
    for (const flor of bundle.flowers) {
      if (!porPapel.has(flor.role)) porPapel.set(flor.role, flor.id)
    }
    // Una receta parecida a la de un ramo real, ajustada al cupo.
    const reparto: [string | undefined, number][] = [
      [porPapel.get('face'), Math.max(1, Math.round(capacidad * 0.3))],
      [porPapel.get('stem'), Math.max(1, Math.round(capacidad * 0.3))],
      [porPapel.get('filler'), Math.max(1, Math.round(capacidad * 0.2))],
      [porPapel.get('green'), Math.max(2, Math.round(capacidad * 0.2))],
    ]
    let libre = capacidad
    for (const [id, pedido] of reparto) {
      if (!id) continue
      const cabe = Math.min(pedido, libre)
      if (cabe <= 0) break
      cantidades[id] = cabe
      libre -= cabe
    }
    return layoutBouquet(bundle.flowers, cantidades, envolturaPrueba)
  }, [conFlores, bundle, vistaPrevia, capacidad, envolturaPrueba])

  const liston = bundle?.ribbons[0] ?? null

  const elegirFoto = async (archivo: File | null) => {
    if (!archivo) return
    setFoto(archivo)
    setVistaPrevia(URL.createObjectURL(archivo))
    setMidiendo(true)
    setError(null)
    try {
      const cuerpo = new FormData()
      cuerpo.append('imagen', archivo)
      const r = await api.post<Analisis>('/builder/wrappers/analizar/', cuerpo)
      setAspect(r.aspect)
      // Solo se proponen posiciones al crear: al editar, las que ya estaban
      // son el trabajo de alguien y no se pisan.
      if (!editando) {
        setRamo({ x: r.sugerencia.cluster_x, y: r.sugerencia.cluster_y, r: r.sugerencia.cluster_r })
        setNudo({ x: r.sugerencia.nudo_x, y: r.sugerencia.nudo_y, w: r.sugerencia.nudo_ancho })
        setEscalaFlores(r.sugerencia.escala_flores)
      }
    } catch (fallo) {
      setError(
        fallo instanceof ApiError
          ? fallo.campos.imagen?.[0] ?? fallo.message
          : 'No pudimos leer la foto.',
      )
    } finally {
      setMidiendo(false)
    }
  }

  /**
   * Coloca lo que se este moviendo donde apunte el dedo o el raton.
   *
   * Funciona tanto con un toque suelto como arrastrando: al pulsar se coloca
   * de una vez, y mientras no se suelte se sigue el movimiento. Antes solo
   * respondia al clic, asi que afinar la posicion era una tanda de toques a
   * ciegas en vez de ver el ramo moverse con la mano.
   */
  const colocar = (clientX: number, clientY: number) => {
    const caja = lienzoRef.current?.getBoundingClientRect()
    if (!caja) return
    const x = Math.min(1, Math.max(0, (clientX - caja.left) / caja.width))
    const y = Math.min(1, Math.max(0, (clientY - caja.top) / caja.height))
    if (modo === 'ramo') setRamo((prev) => ({ ...prev, x, y }))
    else setNudo((prev) => ({ ...prev, x, y }))
  }

  const alPulsar = (e: React.PointerEvent<HTMLDivElement>) => {
    arrastrando.current = true
    setArrastrandoVisual(true)
    colocar(e.clientX, e.clientY)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const alMover = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!arrastrando.current) return
    colocar(e.clientX, e.clientY)
  }

  const alSoltar = (e: React.PointerEvent<HTMLDivElement>) => {
    arrastrando.current = false
    setArrastrandoVisual(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault()
    setError(null)
    setErrores({})

    if (!foto && !inicial?.imagen_url) {
      setError('Sube la foto de la envoltura.')
      return
    }

    const datos = new FormData()
    datos.append('label', nombre.trim())
    datos.append('tamano', tamano)
    datos.append('capacidad', String(capacidad))
    datos.append('visible', visible ? 'true' : 'false')
    datos.append('aspect', String(aspect))
    datos.append('cluster_x', String(ramo.x))
    datos.append('cluster_y', String(ramo.y))
    datos.append('cluster_r', String(ramo.r))
    datos.append('nudo_x', String(nudo.x))
    datos.append('nudo_y', String(nudo.y))
    datos.append('nudo_ancho', String(nudo.w))
    datos.append('escala_flores', String(escalaFlores))
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

  const deslizador =
    'mt-1.5 h-2 w-full cursor-pointer appearance-none rounded-full bg-brand-100 accent-[rgb(var(--brand-700-rgb))]'
  const campo =
    'w-full rounded-[12px] border border-line bg-grad-campo px-4 py-3 text-[14.5px] text-ink ' +
    'shadow-[inset_0_1px_2px_rgba(63,49,112,0.06)] transition-all duration-200 ' +
    'hover:border-brand-300 focus:border-brand-500 focus:bg-white focus:outline-none ' +
    'focus:ring-4 focus:ring-brand-700/10'

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
        form="formulario-envoltura"
        disabled={guardando || midiendo}
        className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-full bg-grad-boton px-6 py-3 text-[13.5px] font-bold text-white shadow-boton transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0 disabled:opacity-60"
      >
        {guardando ? (
          <>
            <Loader2 size={15} className="animate-spin" /> Guardando…
          </>
        ) : editando ? (
          'Guardar cambios'
        ) : (
          'Agregar envoltura'
        )}
      </button>
    </div>
  )

  return (
    <Ventana
      titulo={editando ? 'Editar envoltura' : 'Agregar una envoltura'}
      subtitulo="Arrastra sobre la foto para colocar el ramo y el lazo."
      tamano="extra"
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        {/* ================= lienzo ================= */}
        <div className="lg:sticky lg:top-0 lg:self-start">
          <div className="rounded-[18px] border border-line/70 bg-white p-4">
            <p className="text-[13px] font-bold text-ink">La envoltura con un ramo dentro</p>
            <p className="mt-0.5 text-[11.5px] leading-[1.5] text-muted">
              Las flores se colocan con el mismo motor que ve el cliente.
            </p>

            {!vistaPrevia ? (
              <button
                type="button"
                onClick={() => entradaFoto.current?.click()}
                className="mt-3 flex aspect-[3/4] w-full items-center justify-center rounded-[16px] border-2 border-dashed border-brand-300 bg-gradient-to-br from-white to-brand-50 transition-all hover:border-brand-700 hover:shadow-card"
              >
                <span className="flex flex-col items-center gap-2 px-4 text-center text-muted">
                  <ImagePlus size={30} className="text-brand-500" />
                  <span className="text-[12.5px] font-semibold">Toca para elegir la foto</span>
                </span>
              </button>
            ) : (
              <>
                <div
                  ref={lienzoRef}
                  onPointerDown={alPulsar}
                  onPointerMove={alMover}
                  onPointerUp={alSoltar}
                  onPointerCancel={alSoltar}
                  role="presentation"
                  className={`relative mt-3 touch-none select-none overflow-hidden rounded-[16px] border border-line bg-gradient-to-b from-brand-50 to-white shadow-soft ${
                    arrastrandoVisual ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  style={{ aspectRatio: String(aspect || 0.5) }}
                >
                  <img
                    src={vistaPrevia}
                    alt=""
                    className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                    style={{ zIndex: 1 }}
                  />

                  {/* Las flores de muestra, con el motor real. */}
                  {piezas.map((pieza) => (
                    <img
                      key={pieza.key}
                      src={pieza.image}
                      alt=""
                      className="pointer-events-none absolute"
                      style={{
                        left: `${pieza.left}%`,
                        top: `${pieza.top}%`,
                        width: `${pieza.width}%`,
                        height: 'auto',
                        zIndex: pieza.zIndex,
                        transformOrigin: `${pieza.origin.x * 100}% ${pieza.origin.y * 100}%`,
                        transform: `translate(${-pieza.anchor.x * 100}%, ${-pieza.anchor.y * 100}%) rotate(${pieza.rotate}deg)${pieza.flip ? ' scaleX(-1)' : ''}`,
                        filter: 'drop-shadow(0 2px 3px rgba(76,48,66,0.22))',
                      }}
                    />
                  ))}

                  {liston && (
                    <img
                      src={liston.image}
                      alt=""
                      className="pointer-events-none absolute"
                      style={{
                        left: `${nudo.x * 100}%`,
                        top: `${nudo.y * 100}%`,
                        width: `${nudo.w * 100}%`,
                        height: 'auto',
                        zIndex: 600,
                        transform: 'translate(-50%, -34%)',
                        filter: 'drop-shadow(0 2px 4px rgba(76,48,66,0.28))',
                      }}
                    />
                  )}

                  {/* El marcador de lo que se está moviendo. Solo se ve el
                      activo: dos guías a la vez ensucian la vista. */}
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute rounded-full border-2 border-dashed transition-all duration-150 ${
                      modo === 'ramo' ? 'border-brand-700' : 'border-blush-300'
                    } ${arrastrandoVisual ? 'opacity-100' : 'opacity-70'}`}
                    style={{
                      zIndex: 700,
                      left: `${(modo === 'ramo' ? ramo.x : nudo.x) * 100}%`,
                      top: `${(modo === 'ramo' ? ramo.y : nudo.y) * 100}%`,
                      width: `${(modo === 'ramo' ? ramo.r * 2 : nudo.w) * 100}%`,
                      height: `${(modo === 'ramo' ? ramo.r * 2 : nudo.w * 0.7) * 100 * (aspect || 0.5)}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-[11.5px] text-muted">
                    <Move size={13} className="shrink-0 text-brand-500" />
                    Arrastra para mover{' '}
                    <strong className="text-ink">
                      {modo === 'ramo' ? 'el ramo' : 'el lazo'}
                    </strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => entradaFoto.current?.click()}
                    className="shrink-0 text-[11.5px] font-bold text-brand-700 hover:underline"
                  >
                    Cambiar foto
                  </button>
                </div>
              </>
            )}

            <input
              ref={entradaFoto}
              type="file"
              accept="image/png,image/webp,image/*"
              className="sr-only"
              onChange={(e) => elegirFoto(e.target.files?.[0] ?? null)}
            />

            {midiendo && (
              <p className="mt-2 flex items-center justify-center gap-2 text-[12.5px] font-semibold text-brand-700">
                <Loader2 size={14} className="animate-spin" /> Midiendo la envoltura…
              </p>
            )}
            {vistaPrevia && !midiendo && (
              <p className="mt-2 flex items-center gap-1.5 text-[11.5px] font-bold text-brand-900">
                <Check size={13} /> Proporción medida automáticamente
              </p>
            )}

            {vistaPrevia && (
              <label className="mt-2.5 flex cursor-pointer items-center gap-2.5 text-[11.5px] text-muted">
                <input
                  type="checkbox"
                  checked={conFlores}
                  onChange={(e) => setConFlores(e.target.checked)}
                  className="h-4 w-4 shrink-0 accent-[rgb(var(--brand-700-rgb))]"
                />
                Mostrar un ramo de muestra dentro
              </label>
            )}
          </div>
        </div>

        {/* ================= datos ================= */}
        <form id="formulario-envoltura" onSubmit={enviar} className="flex flex-col gap-4">
          <div className="rounded-[16px] border border-line/70 bg-white p-4">
            <label htmlFor="env-nombre" className="block text-[13px] font-bold text-ink">
              ¿Cómo se llama?
            </label>
            <input
              id="env-nombre"
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Noche Azul, Dulce Aurora…"
              className={`mt-2 ${campo}`}
            />
            {errores.slug?.[0] && (
              <p role="alert" className="mt-1.5 text-[12px] font-semibold text-brand-700">
                Ya existe una envoltura con ese nombre.
              </p>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[13px] font-bold text-ink">Tamaño</p>
                <div className="mt-2 flex gap-2">
                  {TAMANOS.map((opcion) => (
                    <button
                      key={opcion}
                      type="button"
                      onClick={() => setTamano(opcion)}
                      aria-pressed={tamano === opcion}
                      className={`flex-1 rounded-[12px] border px-2 py-2.5 text-[12.5px] font-bold transition-all ${
                        tamano === opcion
                          ? 'border-brand-700 bg-brand-50 text-brand-900 shadow-card'
                          : 'border-line bg-white text-muted hover:border-brand-300'
                      }`}
                    >
                      {opcion}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="env-cupo" className="block text-[13px] font-bold text-ink">
                  ¿Cuántas flores caben?
                </label>
                <input
                  id="env-cupo"
                  type="number"
                  min={1}
                  max={60}
                  required
                  value={capacidad}
                  onChange={(e) => setCapacidad(Number(e.target.value))}
                  className={`mt-2 ${campo}`}
                />
                <p className="mt-1 text-[11px] text-muted">
                  El ramo de muestra se llena con esta cantidad.
                </p>
              </div>
            </div>
          </div>

          {/* ---------- colocación ---------- */}
          <div className="rounded-[16px] border border-line/70 bg-white p-4">
            <p className="text-[13px] font-bold text-ink">Dónde va cada cosa</p>
            <p className="mt-0.5 text-[12px] leading-[1.5] text-muted">
              Elige qué mover, toca la foto de al lado y ajusta el tamaño aquí.
            </p>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setModo('ramo')}
                aria-pressed={modo === 'ramo'}
                className={`flex-1 rounded-full px-3 py-2.5 text-[12.5px] font-bold transition-all ${
                  modo === 'ramo'
                    ? 'bg-grad-boton text-white shadow-boton'
                    : 'border border-line bg-white text-muted hover:border-brand-300'
                }`}
              >
                Las flores
              </button>
              <button
                type="button"
                onClick={() => setModo('nudo')}
                aria-pressed={modo === 'nudo'}
                className={`flex-1 rounded-full px-3 py-2.5 text-[12.5px] font-bold transition-all ${
                  modo === 'nudo'
                    ? 'bg-blush-300 text-white shadow-card'
                    : 'border border-line bg-white text-muted hover:border-brand-300'
                }`}
              >
                El lazo
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <label className="block">
                <span className="flex items-center justify-between text-[12px] font-bold text-muted">
                  Qué tan ancho es el ramo
                  <span className="font-mono text-[11px]">{Math.round(ramo.r * 100)}%</span>
                </span>
                <input
                  type="range"
                  min={15}
                  max={70}
                  value={Math.round(ramo.r * 100)}
                  onChange={(e) => setRamo((p) => ({ ...p, r: Number(e.target.value) / 100 }))}
                  className={deslizador}
                />
              </label>

              <label className="block">
                <span className="flex items-center justify-between text-[12px] font-bold text-muted">
                  Qué tan grandes se ven las flores
                  <span className="font-mono text-[11px]">{escalaFlores.toFixed(2)}×</span>
                </span>
                <input
                  type="range"
                  min={40}
                  max={260}
                  value={Math.round(escalaFlores * 100)}
                  onChange={(e) => setEscalaFlores(Number(e.target.value) / 100)}
                  className={deslizador}
                />
                <span className="mt-1 block text-[11px] leading-[1.5] text-muted">
                  Una envoltura pequeña hace ver las flores más grandes.
                </span>
              </label>

              <label className="block">
                <span className="flex items-center justify-between text-[12px] font-bold text-muted">
                  Tamaño del lazo
                  <span className="font-mono text-[11px]">{Math.round(nudo.w * 100)}%</span>
                </span>
                <input
                  type="range"
                  min={10}
                  max={80}
                  value={Math.round(nudo.w * 100)}
                  onChange={(e) => setNudo((p) => ({ ...p, w: Number(e.target.value) / 100 }))}
                  className={deslizador}
                />
              </label>
            </div>
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
            {visible ? 'Disponible en el armador' : 'Oculta para el cliente'}
          </button>
        </form>
      </div>
    </Ventana>
  )
}
