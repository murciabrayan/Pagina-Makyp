import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronDown, Mail, Phone } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { whatsappMessages } from '@/data/mensajes'
import { useContent } from '@/context/ContentContext'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { track } from '@/lib/analytics'
import { useTitulo } from '@/lib/useTitulo'

export function Ayuda() {
  useTitulo('Ayuda')
  const { hash } = useLocation()
  const { site, help } = useContent()

  // Al llegar desde un enlace del pie (por ejemplo "Métodos de pago"), se abre
  // esa pregunta y se baja hasta ella, en vez de dejar al visitante buscándola.
  // Depende de `help` porque las preguntas llegan de la API: al montar todavía
  // no existe el elemento del ancla, y sin esperarlas el salto no ocurre.
  useEffect(() => {
    if (!hash || help.length === 0) return
    const target = document.getElementById(hash.slice(1))
    if (!(target instanceof HTMLDetailsElement)) return
    target.open = true
    const id = window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => window.cancelAnimationFrame(id)
  }, [hash, help])

  const whatsappHref = buildWhatsAppUrl({
    phone: site.whatsapp.phone,
    message: whatsappMessages.general,
  })

  return (
    <Layout>
      <section aria-labelledby="ayuda-heading" className="py-10 md:py-14">
        <div className="max-w-container mx-auto px-5 md:px-6 2xl:px-8">
          <h1 id="ayuda-heading" className="font-display text-[24px] md:text-[30px] font-bold text-brand-900">
            Ayuda
          </h1>
          <p className="mt-2 text-muted max-w-prose">
            Aquí resolvemos las dudas más comunes. Si te queda alguna, escríbenos por WhatsApp y te
            respondemos con gusto.
          </p>

          <div className="mt-8 grid lg:grid-cols-[1fr_320px] gap-8 items-start">
            <div className="flex flex-col gap-3">
              {help.map((item) => (
                // <details> nativo: se abre y cierra sin JavaScript y el
                // teclado y los lectores de pantalla ya lo entienden.
                // Todas arrancan cerradas; solo se abre sola la que se pide
                // por enlace desde el pie de página.
                <details
                  key={item.id}
                  id={item.id}
                  className="group scroll-mt-28 rounded-md border border-line bg-surface shadow-card transition-colors duration-200 open:border-brand-300"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 list-none [&::-webkit-details-marker]:hidden">
                    <h2 className="text-[16px] font-bold text-brand-900">{item.question}</h2>
                    <ChevronDown
                      size={20}
                      aria-hidden="true"
                      className="shrink-0 text-brand-700 transition-transform duration-200 group-open:rotate-180"
                    />
                  </summary>

                  <div className="px-5 pb-5 -mt-1">
                    {item.answer.map((paragraph) => (
                      <p key={paragraph} className="text-[14px] leading-[1.7] text-muted">
                        {paragraph}
                      </p>
                    ))}

                    {item.list && (
                      <ul className="mt-3 flex flex-col gap-2">
                        {item.list.map((line) => (
                          <li key={line} className="flex gap-2.5 text-[14px] leading-[1.6] text-muted">
                            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-300" aria-hidden="true" />
                            {line}
                          </li>
                        ))}
                      </ul>
                    )}

                    {item.note && (
                      <p className="mt-3 rounded-sm bg-brand-50 px-3.5 py-2.5 text-[13px] leading-[1.6] text-ink">
                        {item.note}
                      </p>
                    )}
                  </div>
                </details>
              ))}
            </div>

            <aside className="rounded-md bg-brand-50 border border-brand-300 p-5 lg:sticky lg:top-[120px]">
              <h2 className="text-[15px] font-bold text-brand-900">¿No encontraste tu respuesta?</h2>
              <p className="mt-1 text-[13px] text-muted">
                Escríbenos y te contestamos lo antes posible.
              </p>
              <div className="mt-4">
                <Button
                  variant="whatsapp"
                  fullWidth
                  className="h-[46px] rounded-sm"
                  icon={<WhatsAppIcon size={18} />}
                  iconPosition="left"
                  href={whatsappHref}
                  onClick={() => track('whatsapp_click', { source: 'ayuda' })}
                >
                  Escríbenos por WhatsApp
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
              </div>
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  )
}
