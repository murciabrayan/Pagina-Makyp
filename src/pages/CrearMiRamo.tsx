import { useMemo, useState } from 'react'
import { Minus, Plus, RotateCcw, Sparkles } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { BouquetPreview } from '@/components/ui/BouquetPreview'
import {
  flowerAssets,
  ribbonAssets,
  wrapperAssets,
  defaultBuilderState,
  flowerColors,
} from '@/data/builder'
import { countFlowers } from '@/lib/bouquet'
import { applyFlowerColors, colorOf } from '@/lib/flowerColors'
import { site, whatsappMessages } from '@/data/site'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { track } from '@/lib/analytics'
import type { BuilderState } from '@/types'

export function CrearMiRamo() {
  const [state, setState] = useState<BuilderState>(defaultBuilderState)

  const wrapper = useMemo(
    () => wrapperAssets.find((w) => w.id === state.wrapperId) ?? wrapperAssets[0],
    [state.wrapperId],
  )
  const ribbon = ribbonAssets.find((r) => r.id === state.ribbonId) ?? ribbonAssets[0]
  const total = countFlowers(state.quantities)
  const isFull = total >= wrapper.capacity

  const setQuantity = (id: string, next: number) => {
    setState((prev) => {
      const quantities = { ...prev.quantities }
      if (next <= 0) delete quantities[id]
      else quantities[id] = next
      return { ...prev, quantities }
    })
  }

  const add = (id: string) => {
    if (isFull) return
    setQuantity(id, (state.quantities[id] ?? 0) + 1)
    track('builder_add_flower', { id })
  }

  const remove = (id: string) => setQuantity(id, (state.quantities[id] ?? 0) - 1)

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
    () => applyFlowerColors(flowerAssets, state.paletteColor, state.flowerColors),
    [state.paletteColor, state.flowerColors],
  )

  /** Cambiar de envoltura puede reducir el cupo: recortamos lo que ya no cabe. */
  const selectWrapper = (id: string) => {
    const next = wrapperAssets.find((w) => w.id === id)
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
      return { ...prev, wrapperId: id, quantities }
    })
    track('builder_wrapper', { id })
  }

  /** Arma una combinación balanceada: respeta la receta de un ramo real. */
  const surpriseMe = () => {
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
    const cap = wrapper.capacity
    const face = pick(flowerAssets.filter((f) => f.role === 'face'))
    const stem = pick(flowerAssets.filter((f) => f.role === 'stem'))
    const quantities: Record<string, number> = {
      [face.id]: Math.max(1, Math.round(cap * 0.2)),
      [stem.id]: Math.max(1, Math.round(cap * 0.25)),
      'margarita-p': Math.max(1, Math.round(cap * 0.2)),
      hojas: Math.max(2, Math.round(cap * 0.2)),
    }
    setState((prev) => ({ ...prev, quantities, ribbonId: pick(ribbonAssets).id }))
    track('builder_surprise')
  }

  const detail = Object.entries(state.quantities)
    .map(([id, qty]) => {
      const flower = flowerAssets.find((f) => f.id === id)
      if (!flower) return null
      // el color va en el pedido: es parte de lo que hay que fabricar
      const color = colorOf(id, state.paletteColor, state.flowerColors)
      const nombreColor = flowerColors.find((c) => c.id === color)?.label
      return `• ${qty} × ${flower.label}${nombreColor ? ` (${nombreColor.toLowerCase()})` : ''}`
    })
    .filter((line): line is string => line !== null)

  const whatsappHref = buildWhatsAppUrl({
    phone: site.whatsapp.phone,
    message: whatsappMessages.customizer([
      ...(detail.length ? detail : ['• Aún sin elegir flores']),
      `• Envoltura: ${wrapper.label}`,
      `• Listón: ${ribbon.label}`,
    ]),
  })

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

          <div className="mt-8 grid lg:grid-cols-[minmax(0,420px)_1fr] gap-8 items-start">
            {/* ---------- vista previa ---------- */}
            <div className="lg:sticky lg:top-[120px]">
              <BouquetPreview state={state} wrapper={wrapper} />

              <div className="mt-3 flex items-center justify-between text-[13px]">
                <span className={isFull ? 'font-semibold text-brand-700' : 'text-muted'}>
                  {total} de {wrapper.capacity} flores
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={surpriseMe}
                    className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:text-brand-900"
                  >
                    <Sparkles size={14} /> Sorpréndeme
                  </button>
                  <button
                    type="button"
                    onClick={() => setState(defaultBuilderState)}
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
                  {wrapperAssets.map((option) => {
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
                          {option.size} · {option.capacity} flores
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
                  {flowerColors.map((color) => (
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
                    const colorActual = colorOf(flower.id, state.paletteColor, state.flowerColors)
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
                            {flowerColors.map((color) => (
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
                  {ribbonAssets.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={option.id === ribbon.id}
                      onClick={() => setState((prev) => ({ ...prev, ribbonId: option.id }))}
                      className={`rounded-full p-1 transition-all duration-150 ${
                        option.id === ribbon.id
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
        </div>
      </section>
    </Layout>
  )
}
