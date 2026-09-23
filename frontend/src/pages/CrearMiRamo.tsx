import { useMemo, useRef, useState } from 'react'
import { Minus, Plus, RotateCcw, Sparkles, Wand2 } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { BouquetPreview } from '@/components/ui/BouquetPreview'
import { EstadoCarga } from '@/components/ui/EstadoCarga'
import { useRecurso } from '@/hooks/useRecurso'
import { useContent } from '@/context/ContentContext'
import { countFlowers, leerClave } from '@/lib/bouquet'
import { applyFlowerColors, colorOf } from '@/lib/flowerColors'
import { whatsappMessages } from '@/data/mensajes'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { track } from '@/lib/analytics'
import { useTitulo } from '@/lib/useTitulo'
import type {
  AjustePieza,
  BuilderBundle,
  BuilderState,
  PlacedPiece,
  PosicionFija,
} from '@/types'

export function CrearMiRamo() {
  useTitulo('Arma tu ramo')
  const { datos, cargando, error, recargar } = useRecurso<BuilderBundle>('/builder/bundle/')

  return (
    <Layout>
      <section aria-labelledby="crear-ramo-heading" className="py-10 md:py-14">
        <div className="max-w-container mx-auto px-5 md:px-6 2xl:px-8">
          <h1 id="crear-ramo-heading" className="font-display text-[24px] md:text-[30px] font-bold text-brand-900">
            Arma tu ramo
          </h1>
          <p className="mt-2 text-muted max-w-prose">
            Elige la envoltura, tus flores y el listón. Lo vas viendo armado en tiempo real, con las
            mismas flores que hacemos a mano.
          </p>

          {cargando || error || !datos ? (
            <EstadoCarga
              cargando={cargando}
              error={error}
              onReintentar={recargar}
              textoCargando="Preparando el taller…"
            />
          ) : (
            <Armador bundle={datos} />
          )}
        </div>
      </section>
    </Layout>
  )
}

/**
 * El armador propiamente dicho.
 *
 * Va aparte de la pantalla para que todo su estado nazca con las piezas ya
 * cargadas. Si estuviera en el mismo componente habria que inventar una
 * envoltura y un liston por defecto antes de saber cuales existen, y despues
 * corregirlos: ese ida y vuelta es justo el que deja el ramo en blanco un
 * instante al entrar.
 */
function Armador({ bundle }: { bundle: BuilderBundle }) {
  const { site } = useContent()
  const { flowers, wrappers, ribbons, colors, colorVariants } = bundle

  const [state, setState] = useState<BuilderState>(() => ({
    // La envoltura mas grande primero: es la que deja ver mejor el ramo.
    wrapperId: wrappers[0]?.id ?? '',
    ribbonId: ribbons[0]?.id ?? '',
    quantities: {},
    paletteColor: colors[0]?.id ?? '',
    flowerColors: {},
    ajustes: {},
    fijadas: {},
  }))

  const wrapper = useMemo(
    () => wrappers.find((w) => w.id === state.wrapperId) ?? wrappers[0],
    [state.wrapperId, wrappers],
  )
  const ribbon = ribbons.find((r) => r.id === state.ribbonId) ?? ribbons[0]
  const total = countFlowers(state.quantities)
  const hayAjustes =
    Object.keys(state.ajustes).length > 0 || Object.keys(state.fijadas).length > 0
  const isFull = total >= (wrapper?.capacity ?? 0)

  /**
   * Las piezas tal como estan pintadas ahora mismo.
   *
   * Va en una referencia y no en el estado porque cambia en cada render del
   * ramo: meterla en el estado dispararia otro render, y ese otro, sin parar.
   */
  const piezasActuales = useRef<PlacedPiece[]>([])

  /**
   * Congela donde esta cada pieza en este momento.
   *
   * Es lo que hace que agregar una flor no mueva las que ya estaban. El motor
   * arma el ramo entero de una vez —el tamaño de cada flor y el reparto
   * dependen de cuantas haya—, asi que sin esto cada flor nueva reacomodaba
   * todo por debajo de lo que el cliente ya habia dejado a su gusto.
   */
  const congelar = (previas: Record<string, PosicionFija>): Record<string, PosicionFija> => {
    const fijadas = { ...previas }
    for (const pieza of piezasActuales.current) {
      fijadas[pieza.key] = {
        left: pieza.left,
        top: pieza.top,
        width: pieza.width,
        rotate: pieza.rotate,
        zIndex: pieza.zIndex,
      }
    }
    return fijadas
  }

  /**
   * Suma una flor. El cupo se comprueba dentro del actualizador, contra el
   * estado de ese instante: si se mirara el del render, dos toques seguidos
   * al mismo botón calcularían los dos la misma cantidad y uno se perdería.
   */
  const add = (id: string) => {
    setState((prev) => {
      const cupo = (wrappers.find((w) => w.id === prev.wrapperId) ?? wrappers[0])?.capacity ?? 0
      if (countFlowers(prev.quantities) >= cupo) return prev
      return {
        ...prev,
        quantities: { ...prev.quantities, [id]: (prev.quantities[id] ?? 0) + 1 },
        // Lo que ya estaba se queda donde esta; la nueva busca hueco.
        fijadas: congelar(prev.fijadas),
      }
    })
    track('builder_add_flower', { id })
  }

  const remove = (id: string) => {
    setState((prev) => {
      const actual = prev.quantities[id] ?? 0
      if (actual <= 0) return prev
      const quantities = { ...prev.quantities }
      if (actual === 1) delete quantities[id]
      else quantities[id] = actual - 1

      // Los retoques que sobran se borran. Cada pieza se llama
      // "<flor>-<numero>", asi que al bajar la cantidad se sueltan los de los
      // ejemplares que ya no existen; sin esto, volver a agregar esa flor la
      // haria reaparecer corrida sin que nadie la hubiera tocado.
      const quedan = quantities[id] ?? 0
      const ajustes: typeof prev.ajustes = {}
      for (const [clave, ajuste] of Object.entries(prev.ajustes)) {
        const numero = leerClave(clave, id)
        if (numero === null || numero < quedan) ajustes[clave] = ajuste
      }

      const fijadas: typeof prev.fijadas = {}
      for (const [clave, pos] of Object.entries(congelar(prev.fijadas))) {
        const numero = leerClave(clave, id)
        if (numero === null || numero < quedan) fijadas[clave] = pos
      }

      return { ...prev, quantities, ajustes, fijadas }
    })
  }

  const reiniciar = () =>
    setState({
      wrapperId: wrappers[0]?.id ?? '',
      ribbonId: ribbons[0]?.id ?? '',
      quantities: {},
      paletteColor: colors[0]?.id ?? '',
      flowerColors: {},
      ajustes: {},
      fijadas: {},
    })

  /**
   * Guarda —o borra— lo que el cliente movio de una flor.
   *
   * Pasar `null` la devuelve a donde la puso el motor. La entrada se elimina
   * del todo en vez de quedarse en cero, para que el ramo vuelva a armarse
   * solo tambien cuando cambien las cantidades.
   */
  const ajustarPieza = (clave: string, ajuste: AjustePieza | null) => {
    setState((prev) => {
      const ajustes = { ...prev.ajustes }
      if (ajuste === null) delete ajustes[clave]
      else ajustes[clave] = ajuste
      return { ...prev, ajustes }
    })
    track('builder_ajuste_manual', { clave, quitado: ajuste === null })
  }

  /**
   * Saca del ramo un ejemplar concreto.
   *
   * Bajar la cantidad es solo la mitad del trabajo. La otra es renumerar los
   * retoques: las piezas se llaman "<flor>-0", "<flor>-1"... y al desaparecer
   * una, las de mas atras corren un puesto. Sin esto, lo que el cliente habia
   * movido o agrandado saltaria a la flor de al lado.
   */
  const quitarEjemplar = (flowerId: string, indice: number) => {
    setState((prev) => {
      const actual = prev.quantities[flowerId] ?? 0
      if (actual <= 0) return prev

      const quantities = { ...prev.quantities }
      if (actual === 1) delete quantities[flowerId]
      else quantities[flowerId] = actual - 1

      const ajustes: typeof prev.ajustes = {}
      for (const [clave, ajuste] of Object.entries(prev.ajustes)) {
        const n = leerClave(clave, flowerId)
        if (n === null || n < indice) {
          ajustes[clave] = ajuste
        } else if (n > indice) {
          // corre un puesto hacia delante
          const partes = clave.split('-')
          partes[partes.length - 1] = String(n - 1)
          ajustes[partes.join('-')] = ajuste
        }
        // el del ejemplar que se va, se descarta
      }

      const fijadas: typeof prev.fijadas = {}
      for (const [clave, pos] of Object.entries(congelar(prev.fijadas))) {
        const n = leerClave(clave, flowerId)
        if (n === null || n < indice) {
          fijadas[clave] = pos
        } else if (n > indice) {
          const partes = clave.split('-')
          partes[partes.length - 1] = String(n - 1)
          fijadas[partes.join('-')] = pos
        }
      }

      return { ...prev, quantities, ajustes, fijadas }
    })
    track('builder_quitar_pieza', { id: flowerId })
  }

  /** Deja que el armador vuelva a colocarlo todo. */
  const soltarTodo = () => {
    setState((prev) => ({ ...prev, ajustes: {}, fijadas: {} }))
    track('builder_soltar_ajustes')
  }

  /** Color general: se aplica a todas las que no tengan uno propio. */
  const setPalette = (colorId: string) => {
    setState((prev) => ({ ...prev, paletteColor: colorId }))
    track('builder_palette', { color: colorId })
  }

  /** Color de una flor puntual. Tocar el que ya está la devuelve al general. */
  const setFlowerColor = (flowerId: string, colorId: string) => {
    setState((prev) => {
      const flowerColorsState = { ...prev.flowerColors }
      if (colorId === prev.paletteColor) delete flowerColorsState[flowerId]
      else flowerColorsState[flowerId] = colorId
      return { ...prev, flowerColors: flowerColorsState }
    })
    track('builder_flower_color', { id: flowerId, color: colorId })
  }

  // las miniaturas muestran la flor en el color elegido, igual que la vista previa
  const coloredFlowers = useMemo(
    () => applyFlowerColors(flowers, colorVariants, state.paletteColor, state.flowerColors),
    [flowers, colorVariants, state.paletteColor, state.flowerColors],
  )

  /** Cambiar de envoltura puede reducir el cupo: recortamos lo que ya no cabe. */
  const selectWrapper = (id: string) => {
    const next = wrappers.find((w) => w.id === id)
    if (!next) return
    setState((prev) => {
      let remaining = next.capacity
      const quantities: Record<string, number> = {}
      for (const [flowerId, qty] of Object.entries(prev.quantities)) {
        const allowed = Math.min(qty, remaining)
        if (allowed > 0) {
          quantities[flowerId] = allowed
          remaining -= allowed
        }
      }
      // Los retoques se sueltan: estaban medidos sobre la envoltura
      // anterior, y arrastrarlos a otra de distinto tamaño dejaría las
      // flores fuera del papel.
      return { ...prev, wrapperId: id, quantities, ajustes: {}, fijadas: {} }
    })
    track('builder_wrapper', { id })
  }

  /** Arma una combinación balanceada: respeta la receta de un ramo real. */
  const surpriseMe = () => {
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
    const cap = wrapper?.capacity ?? 0
    const caras = flowers.filter((f) => f.role === 'face')
    const tallos = flowers.filter((f) => f.role === 'stem')
    const rellenos = flowers.filter((f) => f.role === 'filler')
    const follaje = flowers.filter((f) => f.role === 'green')

    // La receta va en orden de importancia y se sirve hasta llenar el cupo:
    // en la envoltura más pequeña no cabe entera, y lo que se recorta es la
    // cola (el follaje), nunca la flor que manda. Cada tipo se busca entre lo
    // que hay de verdad, porque el equipo puede haber ocultado alguna flor.
    const receta: [string | undefined, number][] = [
      [pick(tallos)?.id, Math.max(1, Math.round(cap * 0.25))],
      [pick(caras)?.id, Math.max(1, Math.round(cap * 0.2))],
      [pick(rellenos)?.id, Math.max(1, Math.round(cap * 0.2))],
      [pick(follaje)?.id, Math.max(2, Math.round(cap * 0.2))],
    ]

    const quantities: Record<string, number> = {}
    let libre = cap
    for (const [id, pedido] of receta) {
      if (!id) continue
      const cabe = Math.min(pedido, libre)
      if (cabe <= 0) break
      quantities[id] = (quantities[id] ?? 0) + cabe
      libre -= cabe
    }

    setState((prev) => ({
      ...prev,
      quantities,
      ribbonId: pick(ribbons)?.id ?? prev.ribbonId,
      // Es un ramo distinto: lo colocado a mano antes ya no corresponde.
      ajustes: {},
      fijadas: {},
    }))
    track('builder_surprise')
  }

  const detail = Object.entries(state.quantities)
    .map(([id, qty]) => {
      const flower = flowers.find((f) => f.id === id)
      if (!flower) return null
      // el color va en el pedido: es parte de lo que hay que fabricar
      const color = colorOf(id, colorVariants, state.paletteColor, state.flowerColors)
      const nombreColor = colors.find((c) => c.id === color)?.label
      return `• ${qty} × ${flower.label}${nombreColor ? ` (${nombreColor.toLowerCase()})` : ''}`
    })
    .filter((line): line is string => line !== null)

  const whatsappHref = buildWhatsAppUrl({
    phone: site.whatsapp.phone,
    message: whatsappMessages.customizer([
      ...(detail.length ? detail : ['• Aún sin elegir flores']),
      `• Envoltura: ${wrapper?.label ?? '—'}`,
      `• Listón: ${ribbon?.label ?? '—'}`,
      ...(hayAjustes ? ['• Acomodé las flores a mi gusto en la vista previa'] : []),
    ]),
  })

  if (!wrapper) {
    return (
      <p className="mt-10 rounded-lg border border-dashed border-brand-300 bg-brand-50 p-8 text-center text-muted">
        Todavía no hay envolturas cargadas. Agrega al menos una desde el panel para que el armador
        funcione.
      </p>
    )
  }

  return (
    <div className="mt-8 grid lg:grid-cols-[minmax(0,420px)_1fr] gap-8 items-start">
      {/* ---------- vista previa ---------- */}
      <div className="lg:sticky lg:top-[120px]">
        <BouquetPreview
          state={state}
          wrapper={wrapper}
          flowers={flowers}
          ribbons={ribbons}
          colorVariants={colorVariants}
          onAjustar={ajustarPieza}
          onQuitar={quitarEjemplar}
          onPiezas={(piezas) => {
            piezasActuales.current = piezas
          }}
        />

        <div className="mt-3 flex items-center justify-between text-[13px]">
          <span className={isFull ? 'font-semibold text-brand-700' : 'text-muted'}>
            {total} de {wrapper.capacity} piezas
          </span>
          <div className="flex gap-3">
            {hayAjustes && (
              <button
                type="button"
                onClick={soltarTodo}
                className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:text-brand-900"
              >
                <Wand2 size={14} /> Reacomodar
              </button>
            )}
            <button
              type="button"
              onClick={surpriseMe}
              className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:text-brand-900"
            >
              <Sparkles size={14} /> Sorpréndeme
            </button>
            <button
              type="button"
              onClick={reiniciar}
              className="inline-flex items-center gap-1.5 font-semibold text-muted hover:text-brand-700"
            >
              <RotateCcw size={14} /> Reiniciar
            </button>
          </div>
        </div>

        <div className="mt-4">
          <Button
            variant="whatsapp"
            fullWidth
            icon={<WhatsAppIcon size={18} />}
            iconPosition="left"
            href={whatsappHref}
            onClick={() => track('whatsapp_click', { source: 'crear_mi_ramo' })}
          >
            Pedir este ramo por WhatsApp
          </Button>
        </div>
        <p className="mt-2 text-[12px] text-muted text-center">
          Te confirmamos precio y tiempo de entrega por WhatsApp.
        </p>
      </div>

      {/* ---------- opciones ---------- */}
      <div className="flex flex-col gap-8">
        <fieldset>
          <legend className="text-[15px] font-bold text-brand-900">1. Elige la envoltura</legend>
          <p className="mt-1 text-[13px] text-muted">
            Define el tamaño del ramo y cuántas flores caben.
          </p>
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-3">
            {wrappers.map((option) => {
              const isSelected = option.id === wrapper.id
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => selectWrapper(option.id)}
                  className={`rounded-md border p-2 transition-all duration-150 ${
                    isSelected
                      ? 'border-brand-700 bg-brand-50 shadow-card'
                      : 'border-line hover:border-brand-300'
                  }`}
                >
                  <img
                    src={option.image}
                    alt={option.label}
                    loading="lazy"
                    className="h-16 w-full object-contain"
                  />
                  <span className="mt-1 block text-[11px] font-semibold text-ink leading-tight">
                    {option.label}
                  </span>
                  <span className="block text-[10px] text-muted">
                    {option.size} · {option.capacity} piezas
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-[15px] font-bold text-brand-900">2. Color de las flores</legend>
          <p className="mt-1 text-[13px] text-muted">
            Todas toman este color. Abajo puedes cambiarle el color a una flor en particular.
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {colors.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => setPalette(color.id)}
                aria-pressed={state.paletteColor === color.id}
                className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-[13px] font-semibold transition-all duration-150 ${
                  state.paletteColor === color.id
                    ? 'border-brand-700 bg-brand-50 text-brand-900 shadow-card'
                    : 'border-line text-muted hover:border-brand-300'
                }`}
              >
                {/* borde marcado: si no, el círculo blanco se pierde
                    contra el fondo claro */}
                <span
                  className="h-5 w-5 rounded-full border-[1.5px] border-brand-500"
                  style={{ backgroundColor: color.swatch }}
                  aria-hidden="true"
                />
                {color.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-[15px] font-bold text-brand-900">3. Agrega tus flores</legend>
          <p className="mt-1 text-[13px] text-muted">
            {isFull
              ? 'Ya llenaste esta envoltura. Quita alguna flor o elige una envoltura más grande.'
              : 'Puedes repetir la misma flor las veces que quieras.'}
          </p>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {coloredFlowers.map((flower) => {
              const qty = state.quantities[flower.id] ?? 0
              const colorActual = colorOf(
                flower.id,
                colorVariants,
                state.paletteColor,
                state.flowerColors,
              )
              return (
                <div
                  key={flower.id}
                  className={`rounded-md border p-3 flex flex-col items-center transition-colors duration-150 ${
                    qty > 0 ? 'border-brand-700 bg-brand-50' : 'border-line'
                  }`}
                >
                  <img
                    src={flower.image}
                    alt={flower.label}
                    loading="lazy"
                    className="h-20 w-full object-contain"
                  />
                  <span className="mt-1.5 text-[12.5px] font-semibold text-ink text-center leading-tight">
                    {flower.label}
                  </span>

                  {/* color propio de esta flor, por si se quiere distinta al resto */}
                  {colorActual && (
                    <div className="mt-2 flex flex-wrap justify-center gap-1">
                      {colors.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setFlowerColor(flower.id, color.id)}
                          aria-label={`${flower.label} en ${color.label}`}
                          aria-pressed={colorActual === color.id}
                          title={color.label}
                          className={`h-[18px] w-[18px] rounded-full border-[1.5px] transition-transform duration-150 hover:scale-110 ${
                            colorActual === color.id
                              ? 'border-brand-900 ring-2 ring-brand-700/30 scale-110'
                              : 'border-brand-500'
                          }`}
                          style={{ backgroundColor: color.swatch }}
                        />
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => remove(flower.id)}
                      disabled={qty === 0}
                      aria-label={`Quitar ${flower.label}`}
                      className="h-8 w-8 flex items-center justify-center rounded-full border border-line text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-35 disabled:hover:bg-transparent"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-5 text-center text-sm font-bold text-brand-900">{qty}</span>
                    <button
                      type="button"
                      onClick={() => add(flower.id)}
                      disabled={isFull}
                      aria-label={`Agregar ${flower.label}`}
                      className="h-8 w-8 flex items-center justify-center rounded-full border border-line text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-35 disabled:hover:bg-transparent"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-[15px] font-bold text-brand-900">4. Color del listón</legend>
          <div className="mt-3 flex gap-3">
            {ribbons.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={option.id === ribbon?.id}
                onClick={() => setState((prev) => ({ ...prev, ribbonId: option.id }))}
                className={`rounded-full p-1 transition-all duration-150 ${
                  option.id === ribbon?.id
                    ? 'ring-4 ring-brand-700/25 scale-105'
                    : 'hover:scale-105 opacity-80 hover:opacity-100'
                }`}
              >
                <img src={option.image} alt={option.label} loading="lazy" className="h-14 w-14 object-contain" />
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  )
}
