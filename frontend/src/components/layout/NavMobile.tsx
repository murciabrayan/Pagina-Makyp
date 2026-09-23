import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, Flower2, Home, Store, MessageCircle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { whatsappMessages } from '@/data/mensajes'
import { useContent } from '@/context/ContentContext'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { track } from '@/lib/analytics'
import { useGoToContact } from '@/lib/useGoToContact'
import { useViewTransition } from '@/lib/useViewTransition'
import { useFocusTrap } from '@/lib/useFocusTrap'
import type { NavIconName, NavMobileProps } from '@/types'

const icons: Record<NavIconName, typeof Home> = {
  home: Home,
  store: Store,
  flower: Flower2,
  'message-circle': MessageCircle,
}

export function NavMobile({ links, activeHref, isOpen, onClose }: NavMobileProps) {
  const { site } = useContent()
  const goToContact = useGoToContact()
  const navegarConTransicion = useViewTransition()
  // el foco entra al panel al abrirlo y vuelve al botón del menú al cerrarlo
  const panelRef = useFocusTrap<HTMLDivElement>(isOpen)
  useEffect(() => {
    if (!isOpen) return

    document.body.style.overflow = 'hidden'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] lg:hidden">
      <button
        type="button"
        aria-label="Cerrar menú"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
        className="absolute right-0 top-0 h-full w-[82vw] max-w-[340px] bg-gradient-to-b from-white via-white to-brand-50 shadow-hover overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 bg-brand-100 rotate-12 opacity-70"
          style={{ borderRadius: '55% 45% 60% 40% / 45% 55% 45% 55%' }}
        />

        <div className="relative h-full overflow-y-auto flex flex-col p-6">
        <div className="flex items-center justify-between">
          <img src="/logo/makyp-logo.webp" alt="Makyp Creations" height={72} width={128} className="h-11 w-auto" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-line text-brand-700 hover:bg-brand-50"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="relative mt-8 flex flex-col gap-2">
          {links.map((link) => {
            const isActive = link.href === activeHref
            const Icon = link.icon ? icons[link.icon] : null
            const className = `flex items-center gap-3 rounded-md px-4 py-3 text-[16px] font-semibold transition-colors duration-150 ${
              isActive ? 'bg-brand-700 text-white shadow-card' : 'text-ink hover:bg-white hover:shadow-card'
            }`
            const linkContent = (
              <>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-700'
                  }`}
                >
                  {Icon && <Icon size={17} aria-hidden="true" />}
                </span>
                <span className="flex-1">{link.label}</span>
                <ChevronRight size={16} className={isActive ? 'text-white/70' : 'text-brand-300'} aria-hidden="true" />
              </>
            )

            if (link.href.startsWith('#')) {
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(event) => {
                    goToContact(event)
                    onClose()
                  }}
                  className={className}
                >
                  {linkContent}
                </a>
              )
            }

            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={(event) => {
                  // primero se cierra el panel, así el fundido captura la
                  // página ya sin el menú encima
                  onClose()
                  navegarConTransicion(link.href)(event)
                }}
                className={className}
              >
                {linkContent}
              </Link>
            )
          })}
        </nav>

        <div className="relative mt-auto pt-6 border-t border-brand-300/40">
          <Button
            variant="whatsapp"
            fullWidth
            icon={<WhatsAppIcon size={18} />}
            iconPosition="left"
            href={buildWhatsAppUrl({ phone: site.whatsapp.phone, message: whatsappMessages.general })}
            onClick={() => track('whatsapp_click', { source: 'header' })}
          >
            Escríbenos por WhatsApp
          </Button>
        </div>
        </div>
      </div>
    </div>
  )
}
