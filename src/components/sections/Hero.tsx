import { ShoppingBag, Flower2, HeartHandshake, Leaf, Truck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { HeroCarousel } from '@/components/ui/HeroCarousel'
import { track } from '@/lib/analytics'
import type { HeroProps } from '@/types'

const trustItems = [
  { icon: <HeartHandshake size={20} />, label: 'Hecho a mano' },
  { icon: <Leaf size={20} />, label: 'Material de calidad' },
  { icon: <Truck size={20} />, label: 'Envíos seguros' },
]

export function Hero({ className = '' }: HeroProps) {
  return (
    <section
      aria-labelledby="hero-heading"
      className={`relative overflow-hidden bg-grad-hero pt-14 pb-12 lg:py-0 lg:min-h-[860px] flex items-center ${className}`}
    >
      {/*
        Columnas en fr, no en %: con porcentajes que suman 100% el gap se
        suma encima y el grid se desborda hacia la derecha, dejando más
        vacío a la izquierda en pantallas grandes.
      */}
      <div className="max-w-container mx-auto px-5 md:px-6 2xl:px-8 grid lg:grid-cols-[42fr_58fr] gap-8 lg:gap-10 items-center">
        <div className="order-2 lg:order-1 max-w-[520px] mx-auto lg:mx-0 text-center lg:text-left">
          <h1
            id="hero-heading"
            className="font-display font-extrabold text-brand-900 text-[34px] lg:text-[58px] leading-[1.08] tracking-[-0.02em]"
          >
            Detalles únicos
            <br />
            hechos a mano
          </h1>
          <p className="mt-1 font-script text-brand-700 text-[32px] lg:text-[52px] leading-[1.1] flex items-center justify-center lg:justify-start">
            con mucho amor
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="ml-3 -rotate-[8deg] text-brand-500"
              aria-hidden="true"
            >
              <path d="M12 21s-7.5-4.6-10-9.1C.4 8.3 2 4.5 5.6 4A5 5 0 0 1 12 7a5 5 0 0 1 6.4-3 5.4 5.4 0 0 1 3.6 7.9C19.5 16.4 12 21 12 21Z" />
            </svg>
          </p>
          <p className="mt-6 text-[15px] lg:text-base leading-[1.65] text-muted max-w-prose mx-auto lg:mx-0">
            Flores, ramos, muñequitos y más, hechos
            <br className="hidden sm:block" /> a mano con limpiapipas para cada ocasión.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
            <Button
              variant="primary"
              icon={<ShoppingBag size={18} />}
              href="/tienda"
              fullWidth
              className="sm:w-auto"
              onClick={() => track('cta_hero_ver_productos')}
            >
              Ver productos
            </Button>
            <Button
              variant="outline"
              icon={<Flower2 size={18} />}
              href="/crear-mi-ramo"
              fullWidth
              className="sm:w-auto"
              onClick={() => track('cta_hero_crear_ramo')}
            >
              Crear mi ramo
            </Button>
          </div>

          <div className="mt-10 grid grid-cols-3 sm:flex sm:flex-row gap-4 sm:gap-8">
            {trustItems.map((item) => (
              <div key={item.label} className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2">
                <span className="text-brand-500" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="text-[11px] sm:text-[13px] font-semibold text-ink text-center sm:text-left">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 lg:order-2 relative flex items-center justify-center py-4 lg:py-0">
          <div
            aria-hidden="true"
            className="absolute w-[340px] h-[320px] sm:w-[480px] sm:h-[450px] lg:w-[760px] lg:h-[720px] bg-brand-100 rotate-[8deg] z-0 opacity-70"
            style={{ borderRadius: '55% 45% 60% 40% / 45% 55% 45% 55%' }}
          />
          <div
            aria-hidden="true"
            className="absolute w-[300px] h-[280px] sm:w-[420px] sm:h-[400px] lg:w-[640px] lg:h-[600px] bg-blush-100 -rotate-[12deg] z-0"
            style={{ borderRadius: '60% 40% 55% 45% / 50% 60% 40% 50%' }}
          />
          <div
            aria-hidden="true"
            className="hidden lg:block absolute w-[540px] h-[540px] rounded-full border border-dashed border-brand-300/60 motion-safe:animate-[spin_40s_linear_infinite]"
          />

          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="var(--brand-300)" strokeWidth="1.5" className="hidden lg:block absolute top-2 right-6 w-9 h-9 opacity-60">
            <path d="M12 21s-7.5-4.6-10-9.1C.4 8.3 2 4.5 5.6 4A5 5 0 0 1 12 7a5 5 0 0 1 6.4-3 5.4 5.4 0 0 1 3.6 7.9C19.5 16.4 12 21 12 21Z" />
          </svg>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="var(--brand-300)" strokeWidth="1.5" className="hidden lg:block absolute left-0 top-1/2 w-6 h-6 opacity-60">
            <path d="M12 2l1.8 5.6H20l-4.6 3.4 1.8 5.6L12 13.2l-5.2 3.4 1.8-5.6L4 7.6h6.2L12 2Z" />
          </svg>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="var(--brand-300)" strokeWidth="1.5" className="hidden lg:block absolute bottom-8 right-10 w-8 h-8 opacity-60">
            <path d="M4 20c6-1 9-6 9-14M9 8c1.5 0 3 1 3-2" />
          </svg>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="var(--brand-300)" strokeWidth="1.5" className="hidden lg:block absolute bottom-6 left-10 w-8 h-8 opacity-60">
            <path d="M20 20c-6-1-9-6-9-14M15 8c-1.5 0-3 1-3-2" />
          </svg>

          <HeroCarousel />
        </div>
      </div>
    </section>
  )
}
