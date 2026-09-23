import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { track } from '@/lib/analytics'

export function TiendaCta() {
  return (
    <section aria-labelledby="tienda-cta-heading" className="py-14 md:py-16 bg-surface">
      <div className="max-w-container mx-auto px-5 md:px-6 2xl:px-8 text-center">
        <h2 id="tienda-cta-heading" className="font-display text-[24px] md:text-[30px] font-bold text-brand-900">
          ¿Quieres ver todos nuestros detalles?
        </h2>
        <p className="mt-3 text-muted max-w-prose mx-auto">
          Explora el catálogo completo con todos nuestros diseños hechos a mano.
        </p>
        <div className="mt-8 flex justify-center">
          <Button
            variant="primary"
            href="/tienda"
            icon={<ArrowRight size={18} />}
            onClick={() => track('cta_ir_a_tienda', { source: 'home' })}
          >
            Ir a la tienda
          </Button>
        </div>
      </div>
    </section>
  )
}
