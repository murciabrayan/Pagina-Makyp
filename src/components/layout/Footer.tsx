import { Link } from 'react-router-dom'
import { Instagram, Facebook, Heart, Phone, Mail, MapPin } from 'lucide-react'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { TikTokIcon } from '@/components/ui/TikTokIcon'
import { Button } from '@/components/ui/Button'
import { footerLinks } from '@/data/navigation'
import { site, whatsappMessages } from '@/data/site'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { track } from '@/lib/analytics'
import { useGoToContact } from '@/lib/useGoToContact'
import type { FooterProps } from '@/types'

const socialLinks = [
  { label: 'Instagram', href: site.instagram, icon: <Instagram size={16} /> },
  { label: 'Facebook', href: site.facebook, icon: <Facebook size={16} /> },
  { label: 'TikTok', href: site.tiktok, icon: <TikTokIcon size={16} /> },
  {
    label: 'WhatsApp',
    href: buildWhatsAppUrl({ phone: site.whatsapp.phone, message: whatsappMessages.general }),
    icon: <WhatsAppIcon size={16} />,
  },
]

export function Footer({ className = '' }: FooterProps) {
  const year = new Date().getFullYear()

  return (
    <footer id="contacto" className={`bg-brand-100 pt-12 border-t border-brand-300/50 scroll-mt-28 ${className}`}>
      <div className="max-w-container mx-auto px-5 md:px-6 2xl:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1.2fr_1.2fr_1.6fr] gap-10 items-start">
          <div>
            <img src="/logo/makyp-logo.webp" alt="Makyp Creations" height={56} width={99} className="h-14 w-auto" />
            <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-brand-500">
              Hechas con limpiapipas
              <Heart size={11} fill="currentColor" className="text-blush-300" aria-hidden="true" />
            </p>
            <p className="mt-3.5 text-[13px] leading-[1.6] text-muted max-w-[240px]">
              Creamos detalles únicos hechos a mano para regalar amor y felicidad.
            </p>
            <div className="mt-[18px] flex items-center gap-2.5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="h-[34px] w-[34px] rounded-full bg-white border border-brand-300 text-brand-700 flex items-center justify-center hover:bg-brand-700 hover:text-white transition-colors duration-150"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Tienda" links={footerLinks.tienda} />
          <FooterColumn title="Información" links={footerLinks.informacion} />
          <FooterColumn title="Ayuda" links={footerLinks.ayuda} />

          <div className="rounded-md bg-brand-50 border border-brand-300 p-5">
            <h3 className="text-[15px] font-bold text-brand-900">¿Tienes dudas?</h3>
            <p className="mt-1 text-[13px] text-muted">Escríbenos por WhatsApp</p>
            <div className="mt-3.5">
              <Button
                variant="whatsapp"
                fullWidth
                className="h-[46px] rounded-sm"
                icon={<WhatsAppIcon size={18} />}
                iconPosition="left"
                href={buildWhatsAppUrl({ phone: site.whatsapp.phone, message: whatsappMessages.general })}
                onClick={() => track('whatsapp_click', { source: 'footer' })}
              >
                Ir a WhatsApp
              </Button>
            </div>
            <div className="mt-4 flex flex-col gap-[9px] text-[13px] text-ink">
              <a href={`tel:${site.whatsapp.phone}`} className="flex items-center gap-2.5 hover:text-brand-700">
                <Phone size={15} className="text-brand-500" aria-hidden="true" />
                {site.whatsapp.displayPhone}
              </a>
              <a href={`mailto:${site.email}`} className="flex items-center gap-2.5 hover:text-brand-700">
                <Mail size={15} className="text-brand-500" aria-hidden="true" />
                {site.email}
              </a>
              <span className="flex items-center gap-2.5">
                <MapPin size={15} className="text-brand-500" aria-hidden="true" />
                {site.location}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-brand-300/40 py-[18px] flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-muted text-center">
          <span>© {year} Makyp Creations. Todos los derechos reservados.</span>
          <span className="flex items-center gap-1.5">
            Diseñado con <Heart size={12} fill="currentColor" className="text-brand-700" aria-hidden="true" /> y limpiapipas
          </span>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  const goToContact = useGoToContact()

  return (
    <div>
      <h3 className="text-sm font-bold text-brand-900 mb-3.5">{title}</h3>
      <ul className="flex flex-col gap-[9px]">
        {links.map((link) => (
          <li key={link.href}>
            {link.href.startsWith('#') ? (
              <a href={link.href} onClick={goToContact} className="text-[13px] text-muted hover:text-brand-700">
                {link.label}
              </a>
            ) : (
              <Link to={link.href} className="text-[13px] text-muted hover:text-brand-700">
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
