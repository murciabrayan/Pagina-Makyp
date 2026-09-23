import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Maximize2, Minimize2, RotateCcw, Trash2 } from 'lucide-react'
import { layoutBouquet } from '@/lib/bouquet'
import { applyFlowerColors } from '@/lib/flowerColors'
import type { BouquetPreviewProps, PlacedPiece } from '@/types'

/**
 * Luz y sombra de cada pieza según qué tan al frente está.
 *
 * Las fotos vienen todas con la misma luz plana, así que al apilarlas el ramo
 * se ve como calcomanías pegadas sobre el papel. Dos cosas lo arreglan sin
 * tocar las fotos: una sombra corta debajo de cada flor, que es lo que hace
 * que se apoyen unas en otras en vez de flotar; y bajarle luz a lo que está
 * al fondo, que es lo que da profundidad. La sombra crece con la cercanía
 * porque una flor del frente está más despegada de lo que tiene detrás.
 */
function styleFor(depth: number) {
  // El desplazamiento tiene que ganarle al desenfoque, o la sombra rodea la
  // flor como un halo en vez de caer debajo de ella.
  const y = (1.2 + depth * 3.1).toFixed(2)
  const blur = (1.2 + depth * 2.3).toFixed(2)
  // La penumbra solo alcanza a la mitad de atrás. Las flores del frente son
  // las protagonistas y van a plena luz: bajarles el brillo apaga todo el ramo.
  const back = Math.min(1, depth / 0.5)
  return {
    filter:
      `drop-shadow(0 ${y}px ${blur}px rgba(76, 48, 66, 0.26))` +
      ` brightness(${(0.87 + back * 0.13).toFixed(3)})` +
      ` saturate(${(0.92 + back * 0.08).toFixed(3)})`,
  }
}

/** Cuánto hay que arrastrar antes de considerarlo un movimiento y no un toque. */
const UMBRAL_ARRASTRE = 3

/**
 * Hasta dónde puede agrandarse o encogerse una flor.
 *
 * Se deja encoger más de lo que se deja crecer: una flor a la mitad sigue
 * siendo creíble entre las demás, pero una al doble tapa medio ramo y deja de
 * parecerse a algo que se pueda armar a mano.
 */
const ESCALA_MIN = 0.55
const ESCALA_MAX = 1.5

export function BouquetPreview({
  state,
  wrapper,
  flowers,
  ribbons,
  colorVariants,
  onAjustar,
  onQuitar,
  onPiezas,
  className = '',
}: BouquetPreviewProps) {
  const pieces: PlacedPiece[] = useMemo(
    () =>
      layoutBouquet(
        applyFlowerColors(flowers, colorVariants, state.paletteColor, state.flowerColors),
        state.quantities,
        wrapper,
        state.ajustes,
        state.fijadas,
      ),
    [
      state.quantities,
      state.paletteColor,
      state.flowerColors,
      state.ajustes,
      state.fijadas,
      wrapper,
      flowers,
      colorVariants,
    ],
  )

  /**
   * Le pasa a la pantalla donde quedo cada pieza.
   *
   * Lo necesita para congelarlas justo antes de agregar otra flor: sin saber
   * donde estaban, no hay forma de pedirle al motor que las deje quietas.
   */
  useEffect(() => {
    onPiezas?.(pieces)
  }, [pieces, onPiezas])
  const ribbon = ribbons.find((r) => r.id === state.ribbonId) ?? ribbons[0]
  const isEmpty = pieces.length === 0
  const editable = Boolean(onAjustar)

  const [elegida, setElegida] = useState<string | null>(null)
  const cajaRef = useRef<HTMLDivElement>(null)
  const gesto = useRef<{ x: number; y: number; dx: number; dy: number; movio: boolean } | null>(null)

  const piezaElegida = pieces.find((p) => p.key === elegida) ?? null
  const escalaActual = (elegida && state.ajustes[elegida]?.escala) || 1

/**
 * Las capas fijas del recuadro, de atras hacia delante.
 *
 * Estan aqui con nombre y no como numeros sueltos porque el boton de "enviar
 * atras" necesita saber hasta donde puede bajar: si una flor cae por debajo
 * de la envoltura, desaparece detras del papel y el cliente ya no puede ni
 * seleccionarla para recuperarla.
 */
const Z_ENVOLTURA = 1
const Z_SOMBRA = 2
const Z_MONO = 600
/** Lo mas atras que puede ir una flor: justo delante de la sombra. */
const Z_SUELO = Z_SOMBRA + 1

  /** La capa más alta que hay ahora mismo, para traer algo por encima. */
  const capaMaxima = useMemo(
    () => pieces.reduce((mayor, p) => Math.max(mayor, p.zIndex), 0),
    [pieces],
  )
  const capaMinima = useMemo(
    () => pieces.reduce((menor, p) => Math.min(menor, p.zIndex), 9999),
    [pieces],
  )

  const alPulsar = (e: React.PointerEvent, pieza: PlacedPiece) => {
    if (!editable) return
    e.stopPropagation()
    const ajuste = state.ajustes[pieza.key]
    gesto.current = {
      x: e.clientX,
      y: e.clientY,
      dx: ajuste?.dx ?? 0,
      dy: ajuste?.dy ?? 0,
      movio: false,
    }
    setElegida(pieza.key)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const alMover = (e: React.PointerEvent, pieza: PlacedPiece) => {
    const inicio = gesto.current
    if (!inicio || !onAjustar) return
    const caja = cajaRef.current?.getBoundingClientRect()
    if (!caja) return

    const px = e.clientX - inicio.x
    const py = e.clientY - inicio.y
    if (!inicio.movio && Math.hypot(px, py) < UMBRAL_ARRASTRE) return
    inicio.movio = true

    // Todo el motor trabaja en % del ancho de la envoltura, también en el eje
    // vertical, así que el desplazamiento se convierte a esa misma medida.
    const dx = inicio.dx + (px / caja.width) * 100
    const dy = inicio.dy + (py / caja.width) * 100

    onAjustar(pieza.key, { ...state.ajustes[pieza.key], dx, dy })
  }

  const alSoltar = (e: React.PointerEvent) => {
    gesto.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const cambiarTamano = (escala: number) => {
    if (!piezaElegida || !onAjustar) return
    onAjustar(piezaElegida.key, { ...state.ajustes[piezaElegida.key], escala })
  }

  const cambiarCapa = (hacia: 'frente' | 'atras') => {
    if (!piezaElegida || !onAjustar) return
    onAjustar(piezaElegida.key, {
      ...state.ajustes[piezaElegida.key],
      // Hacia atras hay tope: por debajo de la sombra la flor se perderia
      // detras de la envoltura.
      z: hacia === 'frente' ? capaMaxima + 1 : Math.max(Z_SUELO, capaMinima - 1),
    })
  }

  const soltarPieza = () => {
    if (!piezaElegida || !onAjustar) return
    onAjustar(piezaElegida.key, null)
  }

  /**
   * Quita del ramo justo esta flor.
   *
   * Hace falta aparte de los botones de mas y menos del listado: alli se baja
   * la cantidad de un tipo, pero es el armador quien decide cual de los
   * ejemplares desaparece. Si al cliente le sobra una rosa concreta —la que
   * le tapa el girasol— no tenia forma de sacar esa.
   */
  const quitarPieza = () => {
    if (!piezaElegida || !onQuitar) return
    onQuitar(piezaElegida.flowerId, piezaElegida.indice)
    setElegida(null)
  }

  return (
    <div className={className}>
      <div
        className="relative w-full aspect-[4/5] overflow-hidden rounded-lg border border-line bg-gradient-to-b from-brand-50 via-white to-blush-100/50"
        onPointerDown={() => editable && setElegida(null)}
      >
        {/*
          La caja de la envoltura es el sistema de coordenadas de todo lo demás.
          Va al 87% y algo más abajo para dejar aire arriba: las flores altas
          sobresalen del papel, igual que en un ramo real, y las espigas son las
          que más suben.
        */}
        <div
          ref={cajaRef}
          className="absolute top-[56.5%] left-1/2 -translate-x-1/2 -translate-y-1/2 h-[87%]"
          style={{ aspectRatio: String(wrapper.aspect) }}
        >
          <img
            src={wrapper.image}
            alt={`Envoltura ${wrapper.label}`}
            className="absolute inset-0 h-full w-full object-contain"
            style={{ zIndex: Z_ENVOLTURA }}
            loading="eager"
          />

          {/* La sombra que el ramo entero echa sobre el papel: sin esto la masa
              de flores se ve recortada y pegada encima de la envoltura. */}
          {!isEmpty && (
            <div
              aria-hidden="true"
              className="absolute pointer-events-none"
              style={{
                left: `${wrapper.cluster.x * 100}%`,
                top: `${wrapper.cluster.y * 100}%`,
                width: `${wrapper.clusterR * 200}%`,
                height: `${wrapper.clusterR * 150}%`,
                // corrida hacia abajo: es la sombra que cae sobre el papel, no
                // un halo alrededor del ramo
                transform: 'translate(-50%, -34%)',
                zIndex: Z_SOMBRA,
                background:
                  'radial-gradient(closest-side, rgba(74, 46, 64, 0.15), rgba(74, 46, 64, 0.05) 66%, rgba(74, 46, 64, 0))',
              }}
            />
          )}

          {pieces.map((piece) => {
            const seleccionada = editable && elegida === piece.key
            return (
              <img
                key={piece.key}
                src={piece.image}
                alt={piece.alt}
                loading="lazy"
                decoding="async"
                draggable={false}
                onPointerDown={editable ? (e) => alPulsar(e, piece) : undefined}
                onPointerMove={editable ? (e) => alMover(e, piece) : undefined}
                onPointerUp={editable ? alSoltar : undefined}
                onPointerCancel={editable ? alSoltar : undefined}
                className={`absolute ${editable ? 'cursor-grab touch-none active:cursor-grabbing' : ''}`}
                style={{
                  left: `${piece.left}%`,
                  top: `${piece.top}%`,
                  width: `${piece.width}%`,
                  height: 'auto',
                  zIndex: piece.zIndex,
                  transformOrigin: `${piece.origin.x * 100}% ${piece.origin.y * 100}%`,
                  transform: `translate(${-piece.anchor.x * 100}%, ${-piece.anchor.y * 100}%) rotate(${piece.rotate}deg)${piece.flip ? ' scaleX(-1)' : ''}`,
                  ...styleFor(piece.depth),
                  // El aro de selección se dibuja con la propia sombra de la
                  // pieza, así sigue su silueta recortada en vez de encerrarla
                  // en un rectángulo.
                  ...(seleccionada
                    ? {
                        filter: `${styleFor(piece.depth).filter} drop-shadow(0 0 0 rgb(var(--brand-700-rgb))) drop-shadow(0 0 3px rgb(var(--brand-700-rgb)))`,
                      }
                    : {}),
                }}
              />
            )
          })}

          {ribbon && (
            <img
              src={ribbon.image}
              alt={`Listón ${ribbon.label}`}
              className="absolute"
              style={{
                left: `${wrapper.knot.x * 100}%`,
                top: `${wrapper.knot.y * 100}%`,
                width: `${wrapper.knot.w * 100}%`,
                height: 'auto',
                zIndex: Z_MONO,
                transform: 'translate(-50%, -34%)',
                filter: 'drop-shadow(0 2px 4px rgba(76, 48, 66, 0.28))',
              }}
            />
          )}
        </div>

        {/* ---------- controles de la flor elegida ---------- */}
        {isEmpty && (
          <p className="absolute inset-x-8 top-[30%] text-center text-[13px] text-muted" style={{ zIndex: 700 }}>
            Agrega flores para ver tu ramo aquí
          </p>
        )}
      </div>

      {/* ---------- controles, fuera del recuadro ---------- */}
      {editable && piezaElegida && (
        <div className="mt-2.5 rounded-[14px] border border-line bg-surface px-3 py-2.5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="truncate text-[11.5px] font-bold text-brand-900">
              {piezaElegida.alt}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => cambiarCapa('frente')}
                className="flex h-8 items-center gap-1 rounded-full px-2 text-[11.5px] font-bold text-brand-700 transition-colors hover:bg-brand-50"
              >
                <ArrowUp size={13} /> Al frente
              </button>
              <button
                type="button"
                onClick={() => cambiarCapa('atras')}
                className="flex h-8 items-center gap-1 rounded-full px-2 text-[11.5px] font-bold text-brand-700 transition-colors hover:bg-brand-50"
              >
                <ArrowDown size={13} /> Atrás
              </button>
              {state.ajustes[piezaElegida.key] && (
                <button
                  type="button"
                  onClick={soltarPieza}
                  title="Devolverla a como estaba"
                  className="flex h-8 items-center gap-1 rounded-full px-2 text-[11.5px] font-bold text-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  <RotateCcw size={12} /> Soltar
                </button>
              )}
              {onQuitar && (
                <button
                  type="button"
                  onClick={quitarPieza}
                  title="Sacar esta flor del ramo"
                  className="ml-1 flex h-8 items-center gap-1 rounded-full border-l border-line pl-2.5 pr-2 text-[11.5px] font-bold text-muted transition-colors hover:bg-blush-100 hover:text-brand-700"
                >
                  <Trash2 size={12} /> Quitar
                </button>
              )}
            </div>
          </div>

          {/* ---------- tamaño ---------- */}
          <div className="mt-1.5 flex items-center gap-2">
            <Minimize2 size={13} className="shrink-0 text-muted" aria-hidden="true" />
            <input
              type="range"
              min={ESCALA_MIN * 100}
              max={ESCALA_MAX * 100}
              step={5}
              value={Math.round(escalaActual * 100)}
              onChange={(e) => cambiarTamano(Number(e.target.value) / 100)}
              aria-label={`Tamaño de ${piezaElegida.alt}`}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-brand-100 accent-[rgb(var(--brand-700-rgb))]"
            />
            <Maximize2 size={13} className="shrink-0 text-muted" aria-hidden="true" />
            <span className="w-9 shrink-0 text-right text-[11px] font-bold text-muted">
              {Math.round(escalaActual * 100)}%
            </span>
          </div>
        </div>
      )}

      {editable && !isEmpty && !piezaElegida && (
        <p className="mt-2.5 rounded-[14px] border border-dashed border-line bg-brand-50/60 px-3 py-2.5 text-center text-[11.5px] font-semibold text-muted">
          Toca una flor para moverla, cambiarle el tamaño, la capa o quitarla
        </p>
      )}

    </div>
  )
}