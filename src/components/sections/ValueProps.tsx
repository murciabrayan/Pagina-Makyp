import { HandHeart, Palette, Gift, MessagesSquare } from 'lucide-react'
import type { ValuePropsProps } from '@/types'

const items = [
  { icon: <HandHeart size={30} />, title: '100% Artesanal', description: 'Cada pieza está hecha a mano con dedicación.' },
  { icon: <Palette size={30} />, title: 'Colores vibrantes', description: 'Usamos materiales de calidad para que duren más.' },
  { icon: <Gift size={30} />, title: 'Perfecto para cualquier ocasión', description: 'Cumpleaños, aniversarios, detalles y más.' },
  { icon: <MessagesSquare size={30} />, title: 'Atención personalizada', description: 'Te asesoramos para crear el detalle perfecto.' },
]

function itemClasses(index: number) {
  if (index === 0) return ''
  if (index === 1) {
    return 'border-t border-brand-300/50 pt-8 md:border-t-0 md:pt-0 xl:border-t-0 xl:pt-0 xl:border-l xl:border-brand-300/50 xl:pl-8'
  }
  return 'border-t border-brand-300/50 pt-8 md:border-t md:border-brand-300/50 md:pt-8 xl:border-t-0 xl:pt-0 xl:border-l xl:border-brand-300/50 xl:pl-8'
}

export function ValueProps({ className = '' }: ValuePropsProps) {
  return (
    <div className={`max-w-container mx-auto px-5 md:px-6 2xl:px-8 ${className}`}>
      <div className="rounded-lg bg-brand-100 px-5 py-6 sm:px-10 sm:py-8 mt-2 mb-[72px] grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {items.map((item, index) => (
          <div key={item.title} className={`flex items-start gap-3.5 ${itemClasses(index)}`}>
            <span className="text-brand-700 shrink-0" aria-hidden="true">
              {item.icon}
            </span>
            <div>
              <h3 className="text-sm font-bold text-ink">{item.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-[1.5] text-muted">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
