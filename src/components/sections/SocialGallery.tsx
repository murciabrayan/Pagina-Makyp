import { Heart, Instagram } from 'lucide-react'
import { track } from '@/lib/analytics'
import type { SocialGalleryProps } from '@/types'

export function SocialGallery({ images, instagramUrl }: SocialGalleryProps) {
  return (
    <section aria-labelledby="social-gallery-heading" className="pt-2 pb-16 bg-surface">
      <div className="max-w-container mx-auto px-5 md:px-6 2xl:px-8">
        <h2
          id="social-gallery-heading"
          className="mb-6 text-center font-display text-2xl md:text-[26px] font-bold text-brand-900 flex items-center justify-center gap-2"
        >
          Síguenos y descubre más creaciones
          <Heart size={18} className="text-brand-300" aria-hidden="true" />
        </h2>

        <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 md:grid md:grid-cols-4 xl:grid-cols-7 -mx-5 px-5 md:mx-0 md:px-0">
          {images.map((image, index) => (
            <a
              key={image}
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('social_gallery_click', { index })}
              className="group relative flex-none w-[140px] md:w-auto aspect-square rounded-md overflow-hidden snap-start"
            >
              <img
                src={image}
                alt="Creación de Makyp Creations compartida en Instagram"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-brand-700/0 group-hover:bg-brand-700/35 transition-colors duration-150">
                <Instagram
                  size={22}
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  aria-hidden="true"
                />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
