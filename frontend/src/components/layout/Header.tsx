import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingCart, Menu, Heart } from 'lucide-react'
import { NavDesktop } from './NavDesktop'
import { NavMobile } from './NavMobile'
import { Button } from '@/components/ui/Button'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { navLinks } from '@/data/navigation'
import { whatsappMessages } from '@/data/mensajes'
import { useContent } from '@/context/ContentContext'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { track } from '@/lib/analytics'
import { useCart } from '@/context/CartContext'
import type { HeaderProps } from '@/types'

export function Header({ className = '' }: HeaderProps) {
  const location = useLocation()
  const { count } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { site } = useContent()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
    <header
      className={`sticky top-0 z-50 relative h-20 lg:h-[104px] bg-gradient-to-r from-brand-100 via-brand-50 to-blush-100 transition-shadow duration-300 ${
        scrolled ? 'shadow-hover' : 'shadow-card'
      } ${className}`}
    >
      <div className="relative max-w-container mx-auto h-full px-5 md:px-6 2xl:px-8 grid grid-cols-[auto_1fr_auto] items-center gap-4">
        <Link to="/" className="flex flex-col shrink-0 transition-transform duration-200 hover:scale-[1.03]">
          {/*
            self-start es necesario: al ser este enlace un contenedor flexible
            en columna, sin eso la imagen se estira a lo ancho hasta igualar
            al eslogan de abajo y el logo sale deformado.
          */}
          <img
            src="/logo/makyp-logo.webp"
            alt="Makyp Creations"
            height={113}
            width={200}
            loading="eager"
            fetchPriority="high"
            className="self-start h-12 lg:h-[64px] w-auto"
          />
          <span className="hidden lg:flex items-center gap-1.5 text-[14px] font-semibold text-brand-500">
            Hechas con limpiapipas
            <Heart size={14} className="text-blush-300" aria-hidden="true" />
          </span>
        </Link>

        <div className="flex justify-center">
          <NavDesktop links={navLinks} activeHref={location.pathname} />
        </div>

        <div className="flex items-center gap-[18px] justify-self-end">
          <Link
            to="/carrito"
            aria-label="Carrito"
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-700 shadow-card transition-colors duration-200 hover:bg-brand-700 hover:text-white"
          >
            <ShoppingCart size={20} />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-2 h-[18px] min-w-[18px] px-1 rounded-full bg-brand-700 text-white text-[11px] font-bold flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>

          <Button
            variant="whatsapp"
            className="hidden lg:inline-flex"
            icon={<WhatsAppIcon size={18} />}
            iconPosition="left"
            href={buildWhatsAppUrl({ phone: site.whatsapp.phone, message: whatsappMessages.general })}
            onClick={() => track('whatsapp_click', { source: 'header' })}
          >
            WhatsApp
          </Button>

          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden h-11 w-11 flex items-center justify-center rounded-full bg-white text-brand-700 shadow-card transition-colors duration-200 hover:bg-brand-700 hover:text-white"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>
    </header>

      <NavMobile
        links={navLinks}
        activeHref={location.pathname}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  )
}
