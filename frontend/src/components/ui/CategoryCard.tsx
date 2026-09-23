import { Link } from 'react-router-dom'
import { track } from '@/lib/analytics'
import type { CategoryCardProps } from '@/types'

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      to={`/tienda?categoria=${category.slug}`}
      onClick={() => track('category_click', { slug: category.slug })}
      className="group flex-none w-[190px] lg:w-auto snap-start transition-transform duration-200 ease-out hover:-translate-y-1.5"
    >
      {/*
        Proporción fija en vez de alto fijo: así la foto crece o se achica
        con la columna y las 7 tarjetas siempre caben parejas.
        El borde mantiene la silueta aunque la foto tenga fondo blanco.
      */}
      <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-brand-50 border border-line shadow-card transition-shadow duration-200 group-hover:shadow-hover">
        <img
          src={category.image}
          alt={category.title}
          width={240}
          height={320}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />
      </div>
      <h3 className="mt-3.5 text-center text-[15px] xl:text-[17px] font-bold text-ink">
        {category.title}
      </h3>
      <p className="mt-0.5 text-center text-[12.5px] xl:text-[13.5px] text-muted">
        {category.subtitle}
      </p>
    </Link>
  )
}
