import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface EstadoCargaProps {
  cargando: boolean
  error: string | null
  onReintentar?: () => void
  textoCargando?: string
  className?: string
}

/**
 * Lo que se ve mientras algo carga, o cuando no llegó.
 *
 * Está en un solo sitio porque el fallo hay que contarlo igual en todas las
 * pantallas, y sobre todo hay que contarlo: una tienda que se queda en blanco
 * porque el servidor no respondió parece rota y el visitante se va. Aquí al
 * menos sabe qué pasó y puede reintentar sin recargar la página entera.
 */
export function EstadoCarga({
  cargando,
  error,
  onReintentar,
  textoCargando = 'Cargando…',
  className = '',
}: EstadoCargaProps) {
  if (cargando) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex flex-col items-center justify-center gap-3 py-20 text-muted ${className}`}
      >
        <Loader2 size={28} className="animate-spin text-brand-500" aria-hidden="true" />
        <p className="text-[13.5px]">{textoCargando}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        role="alert"
        className={`mt-8 flex flex-col items-center rounded-[20px] border border-dashed border-brand-300 bg-grad-card px-5 py-14 text-center shadow-soft ${className}`}
      >
        <AlertCircle size={32} className="text-brand-500" aria-hidden="true" />
        <p className="mt-3 font-semibold text-ink">No pudimos cargar esta parte.</p>
        <p className="mt-1.5 max-w-prose text-[13.5px] leading-[1.6] text-muted">{error}</p>
        {onReintentar && (
          <Button variant="outline" onClick={onReintentar} className="mt-5">
            Reintentar
          </Button>
        )}
      </div>
    )
  }

  return null
}
