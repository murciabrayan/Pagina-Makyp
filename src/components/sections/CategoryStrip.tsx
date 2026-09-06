import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CategoryCard } from '@/components/ui/CategoryCard'
import { track } from '@/lib/analytics'
import type { CategoryStripProps } from '@/types'

export function CategoryStrip({ categories }: CategoryStripProps) {
  return (
    <section aria-labelledby="category-strip-heading" className="py-14 bg-surface">
      <h2 id="category-strip-heading" className="sr-only">
        Categorías
      </h2>
      {/*
        Esta franja usa un ancho mayor que el resto de la página: así las 7
        fotos crecen aprovechando el espacio que sobra en pantallas grandes,
        sin dejar de caber ni de estar centradas.
      */}
      <div className="max-w-[1560px] mx-auto px-5 md:px-6 2xl:px-8">
        {/*
          En pantalla grande: 7 columnas iguales, todas caben y quedan
          centradas, sin flechas. En pantalla chica no hay forma de que
          quepan, así que ahí sí se deslizan.
        */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 -mx-5 px-5 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-7 lg:overflow-visible">
          {categories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}

          {/* misma silueta que las demás, para que la fila quede pareja */}
          <Link
            to="/crear-mi-ramo"
            onClick={() => track('category_click', { slug: 'crear-mi-ramo' })}
            className="group flex-none w-[190px] lg:w-auto snap-start transition-transform duration-200 ease-out hover:-translate-y-1.5"
          >
            <div className="aspect-[3/4] w-full rounded-lg bg-brand-50 border-[1.5px] border-dashed border-brand-300 flex items-center justify-center transition-colors duration-200 group-hover:bg-brand-100">
              <span className="h-12 w-12 rounded-full border border-brand-300 bg-white flex items-center justify-center text-brand-700">
                <ChevronRight size={20} />
              </span>
            </div>
            <h3 className="mt-3.5 text-center text-[15px] xl:text-[17px] font-bold text-brand-700">
              Crear mi ramo
            </h3>
            <p className="mt-0.5 text-center text-[12.5px] xl:text-[13.5px] text-muted">
              Diseña tu detalle ideal
            </p>
          </Link>
        </div>
      </div>
    </section>
  )
}
