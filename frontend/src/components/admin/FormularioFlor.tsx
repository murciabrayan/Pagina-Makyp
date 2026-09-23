import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ImagePlus,
  Loader2,
  Move,
  Ruler,
  Sparkles,
} from 'lucide-react'
import { ApiError, api } from '@/lib/api'
import { useRecurso } from '@/hooks/useRecurso'
import { Ventana } from './Ventana'
import { VistaPreviaRamo } from './VistaPreviaRamo'
import type { BuilderBundle, FlowerAsset } from '@/types'

interface Medicion {
  medidas: {
    ancho_px: number
    alto_px: number
    proporcion: number
    anchor_x: number
    anchor_y: number
    porcion_cabeza: number
    tiene_tallo: boolean
    margen_desperdiciado: number
  }
  campos: { ancho: number; alto: number; anchor_x: number; anchor_y: number }
  rol_sugerido: string | null
  tiene_tallo: boolean
  avisos: string[]
}

interface Props {
  inicial?: Record<string, unknown> | null
  guardando: boolean
  onGuardar: (datos: FormData) => Promise<unknown>
  onCerrar: () => void
}

const ROLES = [
  { valor: 'face', nombre: 'Al frente', detalle: 'Grande y abierta. Forma el cuerpo del ramo.' },
  { valor: 'stem', nombre: 'Arriba, con tallo', detalle: 'Se acomoda en lo alto, parada y en arco.' },
  { valor: 'spike', nombre: 'Espiga alta', detalle: 'Sube por encima y marca la silueta.' },
  { valor: 'filler', nombre: 'De relleno', detalle: 'Pequeña. Rellena los huecos entre las grandes.' },
  { valor: 'green', nombre: 'Follaje', detalle: 'Hojas y ramitas. Van detrás, hacia los lados.' },
]

/** Referencias de tamaño que el equipo reconoce de un vistazo. */
const REFERENCIAS = [
  { ancho: 110, nombre: 'margarita' },
  { ancho: 151, nombre: 'rosa' },
  { ancho: 235, nombre: 'gerbera' },
  { ancho: 285, nombre: 'girasol' },
]

const ANCHO_MIN = 70
const ANCHO_MAX = 360

/** Del nombre al slug: "Lirio rosado" -> "lirio-rosado". */
function aSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Con qué flor conocida se parece en tamaño. */
function comparar(ancho: number): string {
  const cerca = REFERENCIAS.reduce((mejor, ref) =>
    Math.abs(ref.ancho - ancho) < Math.abs(mejor.ancho - ancho) ? ref : mejor,
  )
  const dif = ancho - cerca.ancho
  if (Math.abs(dif) <= 14) return `Como una ${cerca.nombre}`
  return dif > 0 ? `Más grande que una ${cerca.nombre}` : `Más pequeña que una ${cerca.nombre}`
}

/**
 * El alta de una flor, con el ramo delante mientras se decide.
 *
 * Antes se elegia el tamano de una lista —pequena, mediana, grande— y habia
 * que imaginarse como quedaria. Eso no se puede imaginar: el tamano de una
 * flor solo significa algo comparado con las otras y dentro de la envoltura.
 * Ahora se estira con un control y el ramo se rehace al instante al lado, con
 * el mismo motor que usa la tienda. Lo que se ve es lo que habra.
 *
 * Las medidas finas —el contorno, el centro de la cabeza— las sigue sacando
 * el servidor de la foto. Lo unico que se decide a mano es lo unico que una
 * foto no puede saber: como de grande es esta flor frente a las demas.
 */
export function FormularioFlor({ inicial, guardando, onGuardar, onCerrar }: Props) {
  const editando = Boolean(inicial?.id)
  const { datos: bundle } = useRecurso<BuilderBundle>('/builder/bundle/')

  const [nombre, setNombre] = useState(String(inicial?.label ?? ''))
  const [slug, setSlug] = useState(String(inicial?.slug ?? ''))
  const [slugTocado, setSlugTocado] = useState(editando)
  const [rol, setRol] = useState(String(inicial?.rol ?? ''))
  const [visible, setVisible] = useState(inicial?.visible !== false)

  const [foto, setFoto] = useState<File | null>(null)
  const [vistaPrevia, setVistaPrevia] = useState(String(inicial?.imagen_url ?? ''))
  const [fotoTallo, setFotoTallo] = useState<File | null>(null)
  const [vistaTallo, setVistaTallo] = useState(String(inicial?.tallo_imagen_url ?? ''))

  const [midiendo, setMidiendo] = useState(false)
  const [medicion, setMedicion] = useState<Medicion | null>(null)
  const [proporcion, setProporcion] = useState(
    Number(inicial?.alto ?? 1) / Number(inicial?.ancho ?? 1) || 1,
  )
  const [avanzado, setAvanzado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string[]>>({})

  const [medidas, setMedidas] = useState({
    ancho: Number(inicial?.ancho ?? 200),
    alto: Number(inicial?.alto ?? 200),
    anchor_x: Number(inicial?.anchor_x ?? 0.5),
    anchor_y: Number(inicial?.anchor_y ?? 0.5),
  })
  const [medidasTallo, setMedidasTallo] = useState({
    tallo_ancho: Number(inicial?.tallo_ancho ?? 0) || 0,
    tallo_alto: Number(inicial?.tallo_alto ?? 0) || 0,
    tallo_anchor_x: Number(inicial?.tallo_anchor_x ?? 0.5),
    tallo_anchor_y: Number(inicial?.tallo_anchor_y ?? 0.5),
  })

  // La envoltura contra la que se compara.
  const [envolturaId, setEnvolturaId] = useState('')
  // Arranca con una sola flor y sin acompañamiento: con el ramo lleno no se
  // distingue cuál es la que se está subiendo ni queda sitio para moverla.
  // Acompañarla sirve después, para comprobar el tamaño frente a las otras.
  const [cuantas, setCuantas] = useState(1)
  const [conReferencia, setConReferencia] = useState(false)

  const entradaFoto = useRef<HTMLInputElement>(null)
  const entradaTallo = useRef<HTMLInputElement>(null)

  const envoltura = useMemo(() => {
    if (!bundle?.wrappers.length) return null
    return bundle.wrappers.find((w) => w.id === envolturaId) ?? bundle.wrappers[0]
  }, [bundle, envolturaId])

  /**
   * El ramo de muestra: la flor que se esta creando, repetida, y algunas de
   * las que ya existen para dar escala. Sin esas otras, una flor sola llena
   * la envoltura y parece del tamano correcto siempre.
   */
  const { floresMuestra, cantidadesMuestra } = useMemo(() => {
    const flores: FlowerAsset[] = []
    const cantidades: Record<string, number> = {}

    if (vistaPrevia) {
      flores.push({
        id: '__nueva__',
        label: nombre || 'Flor nueva',
        image: vistaPrevia,
        role: (rol || 'face') as FlowerAsset['role'],
        w: medidas.ancho,
        h: medidas.alto,
        anchor: { x: medidas.anchor_x, y: medidas.anchor_y },
      })
      cantidades.__nueva__ = cuantas
    }

    if (conReferencia && bundle) {
      // Una de cada papel, saltándose la que se está editando para no
      // compararla consigo misma.
      const vistos = new Set<string>()
      for (const flor of bundle.flowers) {
        if (flor.id === inicial?.slug) continue
        if (vistos.has(flor.role)) continue
        if (vistos.size >= 3) break
        vistos.add(flor.role)
        flores.push(flor)
        cantidades[flor.id] = 2
      }
    }

    return { floresMuestra: flores, cantidadesMuestra: cantidades }
  }, [nombre, vistaPrevia, rol, medidas, cuantas, conReferencia, bundle, inicial?.slug])

  /** Manda la foto al servidor para que la mida. */
  const medirFoto = async (archivo: File, esTallo: boolean) => {
    setMidiendo(true)
    setError(null)
    try {
      const cuerpo = new FormData()
      cuerpo.append('imagen', archivo)
      cuerpo.append('talla', 'mediana')
      const r = await api.post<Medicion>('/builder/flowers/analizar/', cuerpo)

      if (esTallo) {
        setMedidasTallo({
          tallo_ancho: medidas.ancho,
          tallo_alto: Math.round(medidas.ancho * r.medidas.proporcion * 10) / 10,
          tallo_anchor_x: r.campos.anchor_x,
          tallo_anchor_y: r.campos.anchor_y,
        })
      } else {
        setMedicion(r)
        setProporcion(r.medidas.proporcion)
        // Se conserva el ancho que ya hubiera (al editar) y solo se recalcula
        // el alto, para no deshacer un ajuste hecho a mano.
        const ancho = editando ? medidas.ancho : r.campos.ancho
        setMedidas({
          ancho,
          alto: Math.round(ancho * r.medidas.proporcion * 10) / 10,
          anchor_x: r.campos.anchor_x,
          anchor_y: r.campos.anchor_y,
        })
        if (r.rol_sugerido && !rol) setRol(r.rol_sugerido)
      }
    } catch (fallo) {
      setError(
        fallo instanceof ApiError
          ? fallo.campos.imagen?.[0] ?? fallo.message
          : 'No pudimos medir la foto. Revisa la conexión.',
      )
    } finally {
      setMidiendo(false)
    }
  }

  const elegirFoto = (archivo: File | null, esTallo: boolean) => {
    if (!archivo) return
    const url = URL.createObjectURL(archivo)
    if (esTallo) {
      setFotoTallo(archivo)
      setVistaTallo(url)
    } else {
      setFoto(archivo)
      setVistaPrevia(url)
    }
    void medirFoto(archivo, esTallo)
  }

  /** Cambiar el ancho recalcula el alto con la proporción ya medida. */
  const cambiarAncho = (ancho: number) => {
    setMedidas((prev) => ({
      ...prev,
      ancho,
      alto: Math.round(ancho * proporcion * 10) / 10,
    }))
  }

  // Las direcciones de objeto se sueltan al desmontar: si no, cada foto
  // elegida se queda en memoria hasta recargar la página.
  useEffect(() => {
    return () => {
      if (vistaPrevia.startsWith('blob:')) URL.revokeObjectURL(vistaPrevia)
      if (vistaTallo.startsWith('blob:')) URL.revokeObjectURL(vistaTallo)
    }
    // solo al cerrar: las direcciones vivas se necesitan mientras esté abierto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault()
    setError(null)
    setErrores({})

    if (!rol) {
      setError('Elige dónde va esta flor dentro del ramo.')
      return
    }
    if (!foto && !inicial?.imagen_url) {
      setError('Sube la foto de la flor.')
      return
    }

    const datos = new FormData()
    datos.append('label', nombre.trim())
    datos.append('slug', (slugTocado ? slug : aSlug(nombre)).trim())
    datos.append('rol', rol)
    datos.append('visible', visible ? 'true' : 'false')
    datos.append('ancho', String(medidas.ancho))
    datos.append('alto', String(medidas.alto))
    datos.append('anchor_x', String(medidas.anchor_x))
    datos.append('anchor_y', String(medidas.anchor_y))
    if (foto) datos.append('imagen', foto)

    if (fotoTallo) {
      datos.append('tallo_imagen', fotoTallo)
      datos.append('tallo_ancho', String(medidasTallo.tallo_ancho || medidas.ancho))
      datos.append('tallo_alto', String(medidasTallo.tallo_alto || medidas.alto))
      datos.append('tallo_anchor_x', String(medidasTallo.tallo_anchor_x))
      datos.append('tallo_anchor_y', String(medidasTallo.tallo_anchor_y))
    }

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

  const slugFinal = slugTocado ? slug : aSlug(nombre)
  const campo =
    'w-full rounded-[12px] border border-line bg-grad-campo px-4 py-3 text-[14.5px] text-ink ' +
    'shadow-[inset_0_1px_2px_rgba(63,49,112,0.06)] transition-all duration-200 ' +
    'hover:border-brand-300 focus:border-brand-500 focus:bg-white focus:outline-none ' +
    'focus:ring-4 focus:ring-brand-700/10'

  const pie = (
    <div className="flex items-center justify-between gap-3">
      <p className="hidden text-[11.5px] text-muted sm:block">
        {medicion || editando ? 'Medidas listas.' : 'Sube la foto para medirla.'}
      </p>
      <div className="flex w-full items-center justify-end gap-2.5 sm:w-auto">
        <button
          type="button"
          onClick={onCerrar}
          className="rounded-full px-5 py-2.5 text-[13.5px] font-bold text-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="formulario-flor"
          disabled={guardando || midiendo}
          className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-full bg-grad-boton px-6 py-3 text-[13.5px] font-bold text-white shadow-boton transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0 disabled:opacity-60"
        >
          {guardando ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Guardando…
            </>
          ) : editando ? (
            'Guardar cambios'
          ) : (
            'Agregar flor'
          )}
        </button>
      </div>
    </div>
  )

  return (
    <Ventana
      titulo={editando ? 'Editar flor' : 'Agregar una flor'}
      subtitulo="Sube la foto y ajusta el tamaño mirando el ramo."
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

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,370px)]">
        {/* ================= datos ================= */}
        <form id="formulario-flor" onSubmit={enviar} className="flex flex-col gap-4">
          {/* ---------- foto y nombre ---------- */}
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
                onChange={(e) => elegirFoto(e.target.files?.[0] ?? null, false)}
              />

              <div className="min-w-0 flex-1">
                <label htmlFor="flor-nombre" className="block text-[13px] font-bold text-ink">
                  ¿Cómo se llama?
                </label>
                <input
                  id="flor-nombre"
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Girasol, Lirio rosado…"
                  className={`mt-2 ${campo}`}
                />
                {nombre && !slugTocado && (
                  <p className="mt-1.5 text-[11.5px] text-muted">
                    Nombre interno: <span className="font-mono">{slugFinal}</span>{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setSlug(slugFinal)
                        setSlugTocado(true)
                      }}
                      className="font-bold text-brand-700 hover:underline"
                    >
                      cambiar
                    </button>
                  </p>
                )}
                {slugTocado && (
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    aria-label="Nombre interno"
                    className="mt-2 w-full rounded-[10px] border border-line bg-white px-3 py-2 font-mono text-[12.5px] text-ink focus:border-brand-500 focus:outline-none"
                  />
                )}
                {errores.slug?.[0] && (
                  <p role="alert" className="mt-1.5 text-[12px] font-semibold text-brand-700">
                    {errores.slug[0]}
                  </p>
                )}
              </div>
            </div>

            {midiendo && (
              <p className="mt-3 flex items-center gap-2 text-[12.5px] font-semibold text-brand-700">
                <Loader2 size={14} className="animate-spin" /> Midiendo la flor…
              </p>
            )}
            {medicion && !midiendo && (
              <p className="mt-3 flex items-start gap-1.5 text-[12px] font-bold text-brand-900">
                <Check size={13} className="mt-0.5 shrink-0" /> Contorno y centro de la cabeza
                medidos solos ({medicion.medidas.ancho_px}×{medicion.medidas.alto_px} px)
              </p>
            )}
            {medicion?.avisos.map((aviso) => (
              <p
                key={aviso}
                className="mt-2 flex gap-1.5 rounded-[10px] bg-blush-100/70 p-2.5 text-[11.5px] leading-[1.5] text-muted"
              >
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-brand-700" />
                {aviso}
              </p>
            ))}
          </div>

          {/* ---------- tamaño ---------- */}
          <div className="rounded-[16px] border border-line/70 bg-white p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[13px] font-bold text-ink">¿De qué tamaño es?</p>
              <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[11.5px] font-bold text-brand-700">
                {comparar(medidas.ancho)}
              </span>
            </div>
            <p className="mt-0.5 text-[12px] leading-[1.5] text-muted">
              Muévelo y mira el ramo: así ves su tamaño frente a las otras flores.
            </p>

            <input
              type="range"
              min={ANCHO_MIN}
              max={ANCHO_MAX}
              value={medidas.ancho}
              onChange={(e) => cambiarAncho(Number(e.target.value))}
              aria-label="Tamaño de la flor"
              className="mt-3.5 h-2 w-full cursor-pointer appearance-none rounded-full bg-brand-100 accent-[rgb(var(--brand-700-rgb))]"
            />

            {/* Las marcas del recorrido no son números sueltos: son flores que
                ya existen en el ramo, y tocarlas iguala el tamaño a la suya. */}
            <div className="relative mt-1.5 h-10">
              {REFERENCIAS.map((ref) => {
                const pos = ((ref.ancho - ANCHO_MIN) / (ANCHO_MAX - ANCHO_MIN)) * 100
                return (
                  <button
                    key={ref.nombre}
                    type="button"
                    onClick={() => cambiarAncho(ref.ancho)}
                    title={`Ponerla del tamaño de una ${ref.nombre}`}
                    className="absolute -translate-x-1/2 text-[10px] leading-tight text-muted transition-colors hover:text-brand-700"
                    style={{ left: `${pos}%` }}
                  >
                    <span aria-hidden="true" className="mx-auto mb-0.5 block h-2 w-px bg-brand-300" />
                    {ref.nombre}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ---------- rol ---------- */}
          <div className="rounded-[16px] border border-line/70 bg-white p-4">
            <p className="text-[13px] font-bold text-ink">¿Dónde va en el ramo?</p>
            <p className="mt-0.5 text-[12px] leading-[1.5] text-muted">
              Decide cómo la coloca el armador. Cámbialo y míralo al lado.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {ROLES.map((opcion) => {
                const activa = rol === opcion.valor
                const sugerida = medicion?.rol_sugerido === opcion.valor
                return (
                  <button
                    key={opcion.valor}
                    type="button"
                    onClick={() => setRol(opcion.valor)}
                    aria-pressed={activa}
                    className={`flex items-start gap-2.5 rounded-[12px] border p-2.5 text-left transition-all ${
                      activa
                        ? 'border-brand-700 bg-brand-50 shadow-card'
                        : 'border-line hover:border-brand-300 hover:bg-brand-50/50'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                        activa ? 'border-brand-700 bg-brand-700' : 'border-brand-300'
                      }`}
                    >
                      {activa && <Check size={9} className="text-white" strokeWidth={4} />}
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-1.5 text-[12.5px] font-bold text-ink">
                        {opcion.nombre}
                        {sugerida && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-900">
                            <Sparkles size={9} /> Parece esta
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-[1.4] text-muted">
                        {opcion.detalle}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ---------- tallo y visibilidad ---------- */}
          <div className="rounded-[16px] border border-line/70 bg-white p-4">
            <p className="text-[13px] font-bold text-ink">
              Foto con tallo <span className="font-normal text-muted">(opcional)</span>
            </p>
            <p className="mt-0.5 text-[12px] leading-[1.5] text-muted">
              El armador la usa cuando la flor queda en lo alto del ramo, para que se vea de dónde
              cuelga.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => entradaTallo.current?.click()}
                className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] border-2 border-dashed border-brand-300 bg-brand-50/60 transition-colors hover:border-brand-700"
              >
                {vistaTallo ? (
                  <img src={vistaTallo} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <ImagePlus size={20} className="text-brand-500" />
                )}
              </button>
              <div className="text-[12px] text-muted">
                {vistaTallo ? (
                  <>
                    <p className="font-bold text-brand-900">Foto con tallo lista</p>
                    <button
                      type="button"
                      onClick={() => {
                        setFotoTallo(null)
                        setVistaTallo('')
                      }}
                      className="mt-0.5 font-bold text-muted hover:text-brand-700"
                    >
                      Quitarla
                    </button>
                  </>
                ) : (
                  <p>Sin ella, la flor solo irá en la parte baja del ramo.</p>
                )}
              </div>
            </div>
            <input
              ref={entradaTallo}
              type="file"
              accept="image/png,image/webp,image/*"
              className="sr-only"
              onChange={(e) => elegirFoto(e.target.files?.[0] ?? null, true)}
            />

            <button
              type="button"
              role="switch"
              aria-checked={visible}
              onClick={() => setVisible((v) => !v)}
              className={`mt-4 inline-flex items-center gap-2.5 rounded-full border px-3.5 py-2.5 text-[13px] font-bold transition-colors ${
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
          </div>

          {/* ---------- ajuste fino ---------- */}
          <div className="rounded-[16px] border border-line/70 bg-white">
            <button
              type="button"
              onClick={() => setAvanzado((v) => !v)}
              aria-expanded={avanzado}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="flex items-center gap-2 text-[12.5px] font-bold text-muted">
                <Ruler size={14} /> Ajuste fino de las medidas
              </span>
              <ChevronDown
                size={16}
                className={`shrink-0 text-muted transition-transform ${avanzado ? 'rotate-180' : ''}`}
              />
            </button>

            {avanzado && (
              <div className="border-t border-line px-4 py-4">
                <p className="text-[11.5px] leading-[1.6] text-muted">
                  Ya están calculadas a partir de la foto. Solo toca esto si la flor se ve mal
                  colocada en la vista de al lado. El anclaje es el centro de la cabeza, en
                  fracción de la foto.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {(
                    [
                      ['ancho', 'Ancho'],
                      ['alto', 'Alto'],
                      ['anchor_x', 'Anclaje X'],
                      ['anchor_y', 'Anclaje Y'],
                    ] as const
                  ).map(([clave, etiqueta]) => (
                    <label key={clave} className="text-[11.5px] font-bold text-muted">
                      {etiqueta}
                      <input
                        type="number"
                        step="any"
                        value={medidas[clave]}
                        onChange={(e) =>
                          setMedidas((prev) => ({ ...prev, [clave]: Number(e.target.value) }))
                        }
                        className="mt-1 w-full rounded-[8px] border border-line bg-white px-2.5 py-1.5 text-[12.5px] text-ink focus:border-brand-500 focus:outline-none"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* ================= vista previa ================= */}
        <div className="lg:sticky lg:top-0 lg:self-start">
          <div className="rounded-[18px] border border-line/70 bg-white p-4">
            <p className="text-[13px] font-bold text-ink">Así se verá en el ramo</p>
            <p className="mt-0.5 text-[11.5px] leading-[1.5] text-muted">
              Hecho con el mismo motor que ve el cliente.
            </p>

            {envoltura && bundle ? (
              <>
                <VistaPreviaRamo
                  className="mt-3"
                  wrapper={envoltura}
                  flores={floresMuestra}
                  cantidades={cantidadesMuestra}
                  ribbon={bundle.ribbons[0] ?? null}
                  resaltar="__nueva__"
                  onAnclaje={(x, y) =>
                    setMedidas((prev) => ({ ...prev, anchor_x: x, anchor_y: y }))
                  }
                />

                {vistaPrevia && (
                  <p className="mt-2 flex items-start gap-1.5 rounded-[10px] bg-brand-50 px-2.5 py-2 text-[11px] leading-[1.5] text-muted">
                    <Move size={12} className="mt-0.5 shrink-0 text-brand-500" />
                    <span>
                      Arrastra la flor para mover el punto por el que el ramo la sostiene. Dónde
                      cae dentro del ramo lo decide el armador según lo que pida el cliente.
                    </span>
                  </p>
                )}

                <label className="mt-3 block text-[11.5px] font-bold text-muted">
                  <span className="flex items-center justify-between">
                    Cuántas poner en la muestra
                    <span className="font-mono text-[11px]">{cuantas}</span>
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    value={cuantas}
                    onChange={(e) => setCuantas(Number(e.target.value))}
                    className="mt-1.5 h-2 w-full cursor-pointer appearance-none rounded-full bg-brand-100 accent-[rgb(var(--brand-700-rgb))]"
                  />
                </label>

                <label className="mt-3 block text-[11.5px] font-bold text-muted">
                  Envoltura de referencia
                  <select
                    value={envoltura.id}
                    onChange={(e) => setEnvolturaId(e.target.value)}
                    className="mt-1 w-full cursor-pointer rounded-[10px] border border-line bg-white px-3 py-2 text-[12.5px] font-normal text-ink focus:border-brand-500 focus:outline-none"
                  >
                    {bundle.wrappers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label} — caben {w.capacity}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-[11.5px] leading-[1.45] text-muted">
                  <input
                    type="checkbox"
                    checked={conReferencia}
                    onChange={(e) => setConReferencia(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--brand-700-rgb))]"
                  />
                  <span>
                    Acompañar con otras flores para comparar tamaños.{' '}
                    <span className="text-muted/80">
                      Las demás salen atenuadas; la tuya, a plena luz.
                    </span>
                  </span>
                </label>
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
