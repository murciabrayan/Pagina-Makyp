import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { site, whatsappMessages } from '@/data/site'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

export function ComingSoon({ title }: { title: string }) {
  return (
    <Layout>
      <section className="max-w-container mx-auto px-5 md:px-6 2xl:px-8 py-24 text-center">
        <h1 className="font-display text-[30px] font-bold text-brand-900">{title}</h1>
        <p className="mt-3 text-muted max-w-prose mx-auto">
          Estamos preparando esta sección. Mientras tanto, escríbenos por WhatsApp y te ayudamos con gusto.
        </p>
        <div className="mt-8 flex justify-center">
          <Button
            variant="whatsapp"
            icon={<WhatsAppIcon size={18} />}
            iconPosition="left"
            href={buildWhatsAppUrl({ phone: site.whatsapp.phone, message: whatsappMessages.general })}
          >
            Escríbenos por WhatsApp
          </Button>
        </div>
      </section>
    </Layout>
  )
}
