import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useFocusTrap } from '@/lib/useFocusTrap'

interface Props {
  titulo: string
  subtitulo?: string
  /** Lo que va abajo del todo, siempre visible: guardar, cancelar. */
  pie?: ReactNode
  /** normal para un formulario corriente; ancha y extra cuando lleva vista previa. */
  tamano?: 'normal' | 'ancha' | 'extra'
  onCerrar: () => void
  children: ReactNode
}

const ANCHOS = {
  normal: 'sm:max-w-2xl',
  ancha: 'sm:max-w-4xl',
  extra: 'sm:max-w-6xl',
} as const

/**
 * La ventana donde se crea o se edita algo.
 *
 * Va centrada, que es donde se espera encontrar algo que pide atencion
 * completa. Se probo sacarla al costado para dejar ver la rejilla de detras,
 * pero editar mirando de reojo incomoda mas de lo que ayuda: lo que se esta
 * haciendo es rellenar un formulario, no comparar.
 *
 * Esta armada en tres franjas —cabecera, cuerpo y pie— y **el scroll vive en
 * el cuerpo**. Esa es la parte que importa: un formulario largo, como el de
 * una flor con su vista previa, no empuja los botones fuera de la pantalla.
 * Guardar esta siempre a la vista, por largo que sea lo de arriba.
 *
 * En el telefono sube desde abajo y ocupa casi todo el alto, que es como se
 * comportan ahi las hojas de este tipo.
 */
export function Ventana({
  titulo,
  subtitulo,
  pie,
  tamano = 'normal',
  onCerrar,
  children,
}: Props) {
  const ventanaRef = useFocusTrap<HTMLDivElement>(true)

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', alPulsar)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', alPulsar)
    }
  }, [onCerrar])

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/45 backdrop-blur-[3px] sm:items-center sm:p-6">
      <div
        ref={ventanaRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ventana-titulo"
        className={`flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-[26px] border border-white/70 bg-grad-card shadow-lift motion-safe:animate-entrar sm:max-h-[90vh] sm:rounded-[24px] ${ANCHOS[tamano]}`}
      >
        <header className="relative shrink-0 overflow-hidden bg-grad-menu px-6 py-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id="ventana-titulo" className="font-display text-[21px] font-bold text-white">
                {titulo}
              </h2>
              {subtitulo && (
                <p className="mt-0.5 text-[12.5px] leading-[1.5] text-white/70">{subtitulo}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/15 text-white transition-colors hover:bg-white/25"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-brand-50/40 px-6 py-6">{children}</div>

        {pie && (
          <footer className="shrink-0 border-t border-line bg-white px-6 py-4">{pie}</footer>
        )}
      </div>
    </div>
  )
}
