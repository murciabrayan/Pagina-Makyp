import { useEffect, useState } from 'react'
import { heroBouquets } from '@/data/hero'
import type { HeroCarouselProps } from '@/types'

const INTERVAL = 5000

/**
 * Rota los ramos del banner. No desliza de lado: cada ramo se desvanece
 * mientras se encoge y gira un poquito, y el siguiente entra creciendo.
 * Se siente como si el ramo se transformara en el otro.
 */
export function HeroCarousel({ className = '' }: HeroCarouselProps) {
  const [index, setIndex] = useState(0)
  const [autoplay, setAutoplay] = useState(true)

  useEffect(() => {
    // sin movimiento automático si el sistema pide menos animación
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || !autoplay) return
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % heroBouquets.length)
    }, INTERVAL)
    return () => window.clearInterval(id)
  }, [autoplay])

  return (
    <div className={`relative z-10 w-full ${className}`}>
      <div
        className="relative h-[340px] sm:h-[480px] lg:h-[680px] motion-safe:animate-float"
        onMouseEnter={() => setAutoplay(false)}
        onMouseLeave={() => setAutoplay(true)}
      >
        {heroBouquets.map((bouquet, i) => {
          const isActive = i === index
          return (
            <div
              key={bouquet.image}
              aria-hidden={!isActive}
              className={`absolute inset-0 flex items-center justify-center transition-all duration-[1200ms] ease-out ${
                isActive ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-[0.86] -rotate-2'
              }`}
            >
              <img
                src={bouquet.image}
                alt={isActive ? bouquet.alt : ''}
                width={620}
                height={680}
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'auto'}
                decoding="async"
                className="max-h-full w-auto object-contain drop-shadow-[0_24px_32px_rgb(var(--brand-700-rgb)/0.22)]"
              />
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2.5">
        {heroBouquets.map((bouquet, i) => (
          <button
            key={bouquet.image}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Ver ramo ${i + 1} de ${heroBouquets.length}`}
            aria-current={i === index}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              i === index ? 'w-7 bg-brand-700' : 'w-2.5 bg-brand-300 hover:bg-brand-500'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
