import {
  HandHeart,
  Palette,
  Gift,
  MessagesSquare,
  Sparkles,
  Truck,
  Flower2,
  Clock,
  type LucideIcon,
} from 'lucide-react'
import type { ValuePropsProps } from '@/types'

/**
 * Los iconos que el panel puede elegir.
 *
 * El backend guarda el nombre en texto; aquí se traduce al componente. Un
 * nombre que no esté en este mapa se queda sin icono en vez de romper la
 * página, que es lo que pasaría al intentar pintar `undefined`.
 */
const ICONOS: Record<string, LucideIcon> = {
  'hand-heart': HandHeart,
  palette: Palette,
  gift: Gift,
  'messages-square': MessagesSquare,
  sparkles: Sparkles,
  truck: Truck,
  flower: Flower2,
  clock: Clock,
}

function itemClasses(index: number) {
  if (index === 0) return ''
  if (index === 1) {
    return 'border-t border-brand-300/50 pt-8 md:border-t-0 md:pt-0 xl:border-t-0 xl:pt-0 xl:border-l xl:border-brand-300/50 xl:pl-8'
  }
  return 'border-t border-brand-300/50 pt-8 md:border-t md:border-brand-300/50 md:pt-8 xl:border-t-0 xl:pt-0 xl:border-l xl:border-brand-300/50 xl:pl-8'
}

export function ValueProps({ items, className = '' }: ValuePropsProps) {
  if (items.length === 0) return null

  return (
    <div className={`max-w-container mx-auto px-5 md:px-6 2xl:px-8 ${className}`}>
      <div className="rounded-lg bg-brand-100 px-5 py-6 sm:px-10 sm:py-8 mt-2 mb-[72px] grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {items.map((item, index) => {
          const Icono = ICONOS[item.icon]
          return (
          <div key={item.id} className={`flex items-start gap-3.5 ${itemClasses(index)}`}>
            <span className="text-brand-700 shrink-0" aria-hidden="true">
              {Icono && <Icono size={30} />}
            </span>
            <div>
              <h3 className="text-sm font-bold text-ink">{item.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-[1.5] text-muted">{item.description}</p>
            </div>
          </div>
          )
        })}
      </div>
    </div>
  )
}
