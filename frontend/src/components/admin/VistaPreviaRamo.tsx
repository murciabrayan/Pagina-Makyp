import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Maximize2, Minus, Move, Plus, RotateCcw } from 'lucide-react'
import { layoutBouquet } from '@/lib/bouquet'
import type { FlowerAsset, RibbonAsset, WrapperAsset } from '@/types'

interface Props {
  wrapper: WrapperAsset
  /** Las flores del ramo de muestra, ya con sus cantidades. */
  flores: FlowerAsset[]
  cantidades: Record<string, number>
  ribbon?: RibbonAsset | null
  /** Qué pieza resaltar: la que se está editando. El resto se atenúa. */
  resaltar?: string
  /**
   * Si se pasa, la pieza resaltada se puede arrastrar y el arrastre ajusta su
   * anclaje. Ver la nota de abajo sobre por qué es el anclaje y no la
   * posición.
   */
  onAnclaje?: (x: number, y: number) => void
  className?: string
}

const ZOOM_MIN = 1
const ZOOM_MAX = 4

/**
 * El ramo, tal como lo vera el cliente, dentro del panel.
 *
 * No es una maqueta aparte: llama al mismo `layoutBouquet` que usa la tienda,
 * con los mismos datos. Eso es lo que hace que sirva para decidir. Una vista
 * previa "parecida" mentiria justo en lo que se quiere comprobar —si la flor
 * nueva queda grande o chica frente a las demas— y la decision se tomaria
 * sobre algo que no es verdad.
 *
 * **Sobre arrastrar la flor.** Donde cae cada flor dentro del ramo lo decide
 * el motor, probando posiciones hasta encontrar la que mejor calza; no es un
 * dato que se guarde ni que tenga sentido fijar a mano, porque cambia con
 * cada combinacion que arme el cliente. Lo que si es de la flor, y si se
 * guarda, es su **anclaje**: el punto de la foto por el que el ramo la
 * sostiene. Ese punto es el que decide si la flor sale bien puesta o
 * ladeada, y es lo que ajusta el arrastre. El medidor lo calcula solo al
 * subir la foto; esto esta para corregirlo cuando la flor tiene una forma
 * rara y el calculo no acierta.
 */
export function VistaPreviaRamo({
  wrapper,
  flores,
  cantidades,
  ribbon,
  resaltar,
  onAnclaje,
  className = '',
}: Props) {
  const [zoom, setZoom] = useState(1)
  const [origen, setOrigen] = useState({ x: 0, y: 0 })
  const [arrastrandoFlor, setArrastrandoFlor] = useState(false)
  const paneo = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const anclajeRef = useRef<{ x: number; y: number; ax: number; ay: number } | null>(null)
  const areaRef = useRef<HTMLDivElement>(null)
  const cajaRef = useRef<HTMLDivElement>(null)

  const piezas = useMemo(
    () => layoutBouquet(flores, cantidades, wrapper),
    [flores, cantidades, wrapper],
  )

  // Al cambiar de envoltura, lo que se veía ya no vale: se vuelve al encuadre
  // completo en vez de dejar el zoom apuntando a un sitio que se movió.
  useEffect(() => {
    setZoom(1)
    setOrigen({ x: 0, y: 0 })
  }, [wrapper.id])

  const limitar = useCallback((valor: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, valor)), [])

  const cambiarZoom = (delta: number) => {
    setZoom((actual) => {
      const nuevo = limitar(actual + delta)
      // Al volver al tamaño completo no tiene sentido conservar el
      // desplazamiento: dejaría el ramo fuera de cuadro.
      if (nuevo === 1) setOrigen({ x: 0, y: 0 })
      return nuevo
    })
  }

  // ---------------------------------------------------------- mover la vista

  const alPulsarArea = (e: React.PointerEvent) => {
    if (zoom === 1 || arrastrandoFlor) return
    paneo.current = { x: e.clientX, y: e.clientY, ox: origen.x, oy: origen.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const alMoverArea = (e: React.PointerEvent) => {
    const inicio = paneo.current
    if (!inicio) return
    const caja = areaRef.current?.getBoundingClientRect()
    if (!caja) return
    // El margen de arrastre crece con el zoom: cuanto más cerca, más hay
    // fuera de cuadro que alcanzar.
    const margen = ((zoom - 1) / 2) * 100
    const dx = ((e.clientX - inicio.x) / caja.width) * 100
    const dy = ((e.clientY - inicio.y) / caja.height) * 100
    setOrigen({
      x: Math.max(-margen, Math.min(margen, inicio.ox + dx)),
      y: Math.max(-margen, Math.min(margen, inicio.oy + dy)),
    })
  }

  const alSoltarArea = (e: React.PointerEvent) => {
    paneo.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  // --------------------------------------------------------- mover el anclaje

  const alPulsarFlor = (e: React.PointerEvent, pieza: (typeof piezas)[number]) => {
    if (!onAnclaje) return
    // Que no arrastre también la vista por debajo.
    e.stopPropagation()
    e.preventDefault()
    setArrastrandoFlor(true)
    anclajeRef.current = {
      x: e.clientX,
      y: e.clientY,
      ax: pieza.anchor.x,
      ay: pieza.anchor.y,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const alMoverFlor = (e: React.PointerEvent, pieza: (typeof piezas)[number]) => {
    const inicio = anclajeRef.current
    if (!inicio || !onAnclaje) return
    const caja = cajaRef.current?.getBoundingClientRect()
    if (!caja) return

    // La flor se coloca restando el anclaje de su esquina: subir el anclaje
    // la empuja hacia la izquierda y hacia arriba. Por eso el gesto va al
    // revés que el número, y aquí se resta en vez de sumar.
    //
    // El desplazamiento del ratón está en píxeles y el anclaje en fracción de
    // la foto, así que hay que dividirlo por lo que mide la pieza en pantalla.
    // El alto sale de la proporción de la flor, que la pieza colocada ya no
    // lleva encima.
    const flor = flores.find((f) => f.id === resaltar)
    const anchoPieza = (pieza.width / 100) * (caja.width / zoom)
    const altoPieza = anchoPieza * (flor && flor.w ? flor.h / flor.w : 1)

    const dx = (e.clientX - inicio.x) / zoom
    const dy = (e.clientY - inicio.y) / zoom

    onAnclaje(
      Math.max(0, Math.min(1, inicio.ax - dx / anchoPieza)),
      Math.max(0, Math.min(1, inicio.ay - dy / altoPieza)),
    )
  }

  const alSoltarFlor = (e: React.PointerEvent) => {
    anclajeRef.current = null
    setArrastrandoFlor(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const vacio = piezas.length === 0

  return (
    <div className={className}>
      <div
        ref={areaRef}
        onPointerDown={alPulsarArea}
        onPointerMove={alMoverArea}
        onPointerUp={alSoltarArea}
        onPointerCancel={alSoltarArea}
        className={`relative aspect-[4/5] w-full select-none overflow-hidden rounded-[18px] border border-line bg-gradient-to-b from-brand-50 via-white to-blush-100/40 shadow-soft ${
          zoom > 1 && !arrastrandoFlor ? 'cursor-grab active:cursor-grabbing touch-none' : ''
        }`}
      >
        <div
          className="absolute inset-0 origin-center transition-transform duration-150"
          style={{ transform: `translate(${origen.x}%, ${origen.y}%) scale(${zoom})` }}
        >
          <div
            ref={cajaRef}
            className="absolute left-1/2 top-[56.5%] h-[87%] -translate-x-1/2 -translate-y-1/2"
            style={{ aspectRatio: String(wrapper.aspect) }}
          >
            <img
              src={wrapper.image}
              alt=""
              className="absolute inset-0 h-full w-full object-contain"
              style={{ zIndex: 1 }}
            />

            {piezas.map((pieza) => {
              // La pieza que se edita va a plena luz; las demás quedan
              // atenuadas para que se distinga de un vistazo cuál es.
              //
              // Se busca dentro de la clave, no al principio: el motor le
              // antepone su papel a las piezas de relleno y de follaje
              // ("filler-rosa-0", "green-hojas-1"), así que comparar por el
              // inicio dejaba sin resaltar justo a esas dos.
              const esLaNueva = !resaltar || pieza.key.includes(resaltar)
              const movible = Boolean(onAnclaje) && esLaNueva && Boolean(resaltar)

              return (
                <img
                  key={pieza.key}
                  src={pieza.image}
                  alt=""
                  draggable={false}
                  onPointerDown={movible ? (e) => alPulsarFlor(e, pieza) : undefined}
                  onPointerMove={movible ? (e) => alMoverFlor(e, pieza) : undefined}
                  onPointerUp={movible ? alSoltarFlor : undefined}
                  onPointerCancel={movible ? alSoltarFlor : undefined}
                  className={`absolute transition-opacity duration-200 ${
                    movible ? 'cursor-move touch-none' : ''
                  }`}
                  style={{
                    left: `${pieza.left}%`,
                    top: `${pieza.top}%`,
                    width: `${pieza.width}%`,
                    height: 'auto',
                    zIndex: movible ? 800 : pieza.zIndex,
                    opacity: esLaNueva ? 1 : 0.42,
                    transformOrigin: `${pieza.origin.x * 100}% ${pieza.origin.y * 100}%`,
                    transform: `translate(${-pieza.anchor.x * 100}%, ${-pieza.anchor.y * 100}%) rotate(${pieza.rotate}deg)${pieza.flip ? ' scaleX(-1)' : ''}`,
                    filter: esLaNueva
                      ? 'drop-shadow(0 2px 4px rgba(76,48,66,0.26))'
                      : 'drop-shadow(0 1px 2px rgba(76,48,66,0.15)) grayscale(0.25)',
                  }}
                />
              )
            })}

            {/* El punto por el que el ramo sostiene la flor. Sin verlo, el
                arrastre es a ciegas: se mueve algo sin saber el qué. */}
            {onAnclaje &&
              piezas
                .filter((p) => resaltar && p.key.includes(resaltar))
                .slice(0, 1)
                .map((p) => (
                  <span
                    key={`ancla-${p.key}`}
                    aria-hidden="true"
                    className="pointer-events-none absolute flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-brand-700 shadow-boton"
                    style={{ left: `${p.left}%`, top: `${p.top}%`, zIndex: 900 }}
                  >
                    <span className="h-1 w-1 rounded-full bg-white" />
                  </span>
                ))}

            {ribbon && (
              <img
                src={ribbon.image}
                alt=""
                className="absolute"
                style={{
                  left: `${wrapper.knot.x * 100}%`,
                  top: `${wrapper.knot.y * 100}%`,
                  width: `${wrapper.knot.w * 100}%`,
                  height: 'auto',
                  zIndex: 600,
                  transform: 'translate(-50%, -34%)',
                  filter: 'drop-shadow(0 2px 4px rgba(76,48,66,0.28))',
                }}
              />
            )}
          </div>
        </div>

        {vacio && (
          <p className="absolute inset-x-6 top-[38%] text-center text-[12.5px] leading-[1.6] text-muted">
            Sube una foto para ver cómo queda la flor dentro del ramo.
          </p>
        )}

        {zoom > 1 && !arrastrandoFlor && (
          <span className="pointer-events-none absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-brand-900 shadow-soft backdrop-blur-sm">
            <Move size={11} /> Arrastra el fondo para mover la vista
          </span>
        )}
      </div>

      {/* ---------- controles de acercamiento ---------- */}
      <div className="mt-2 flex items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => cambiarZoom(-0.5)}
          disabled={zoom <= ZOOM_MIN}
          aria-label="Alejar"
          className="flex h-9 w-9 items-center justify-center rounded-[11px] border border-line bg-white text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50 disabled:opacity-40"
        >
          <Minus size={15} />
        </button>

        <span className="min-w-[52px] text-center text-[12px] font-bold text-muted">
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={() => cambiarZoom(0.5)}
          disabled={zoom >= ZOOM_MAX}
          aria-label="Acercar"
          className="flex h-9 w-9 items-center justify-center rounded-[11px] border border-line bg-white text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50 disabled:opacity-40"
        >
          <Plus size={15} />
        </button>

        <button
          type="button"
          onClick={() => {
            setZoom(1)
            setOrigen({ x: 0, y: 0 })
          }}
          disabled={zoom === 1 && origen.x === 0 && origen.y === 0}
          aria-label="Ver el ramo completo"
          title="Ver el ramo completo"
          className="ml-1 flex h-9 w-9 items-center justify-center rounded-[11px] border border-line bg-white text-muted transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-40"
        >
          <RotateCcw size={14} />
        </button>

        <button
          type="button"
          onClick={() => cambiarZoom(ZOOM_MAX - zoom)}
          disabled={zoom >= ZOOM_MAX}
          aria-label="Acercar al máximo"
          title="Acercar al máximo"
          className="flex h-9 w-9 items-center justify-center rounded-[11px] border border-line bg-white text-muted transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-40"
        >
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  )
}
