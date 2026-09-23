import { useEffect, useState } from 'react'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { whatsappMessages } from '@/data/mensajes'
import { useContent } from '@/context/ContentContext'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { track } from '@/lib/analytics'
import type { WhatsAppFabProps } from '@/types'

export function WhatsAppFab({ className = '' }: WhatsAppFabProps) {
  const { site } = useContent()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <a
      href={buildWhatsAppUrl({ phone: site.whatsapp.phone, message: whatsappMessages.general })}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      onClick={() => track('whatsapp_click', { source: 'fab' })}
      className={`fab-whatsapp fixed right-4 bottom-4 md:right-6 md:bottom-6 z-[60] h-[54px] w-[54px] md:h-[58px] md:w-[58px] rounded-full bg-wa shadow-fab flex items-center justify-center transition-all duration-300 hover:scale-[1.06] ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      } ${className}`}
    >
      <WhatsAppIcon size={28} />
    </a>
  )
}
