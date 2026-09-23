import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { useCart } from '@/context/CartContext'
import { formatCOP } from '@/lib/format'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { track } from '@/lib/analytics'
import { whatsappMessages } from '@/data/mensajes'
import { useContent } from '@/context/ContentContext'
import { useTitulo } from '@/lib/useTitulo'

export function Cart() {
  useTitulo('Tu carrito')
  const { site } = useContent()
  const { items, total, removeItem, updateQuantity } = useCart()

  const whatsappHref = buildWhatsAppUrl({
    phone: site.whatsapp.phone,
    message: whatsappMessages.cart(
      items.map((item) => `• ${item.product.name} x${item.quantity} — ${formatCOP(item.product.price * item.quantity)}`),
      formatCOP(total),
    ),
  })

  return (
    <Layout>
      <section aria-labelledby="cart-heading" className="py-12 md:py-14">
        <div className="max-w-container mx-auto px-5 md:px-6 2xl:px-8">
          <h1 id="cart-heading" className="font-display text-[30px] md:text-[40px] font-bold text-brand-900">
            Tu carrito
          </h1>

          {items.length === 0 ? (
            <div className="mt-10 flex flex-col items-center text-center py-16 border border-dashed border-brand-300 rounded-lg bg-brand-50">
              <ShoppingBag size={40} className="text-brand-300" aria-hidden="true" />
              <p className="mt-4 text-muted">Tu carrito está vacío por ahora.</p>
              <Button href="/tienda" className="mt-6">
                Ir a la tienda
              </Button>
            </div>
          ) : (
            <div className="mt-8 grid lg:grid-cols-[1fr_320px] gap-8 items-start">
              <ul className="flex flex-col gap-4">
                {items.map((item) => (
                  <li
                    key={item.product.id}
                    className="flex items-center gap-4 bg-surface border border-line rounded-md p-4"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      width={80}
                      height={80}
                      loading="lazy"
                      decoding="async"
                      className="h-20 w-20 rounded-sm bg-brand-50 object-contain p-1.5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-ink truncate">{item.product.name}</h3>
                      <p className="mt-1 text-[15px] font-bold text-brand-900">
                        {formatCOP(item.product.price)}
                      </p>
                      <div className="mt-2 inline-flex items-center gap-3 rounded-full border border-line px-1">
                        <button
                          type="button"
                          aria-label="Restar uno"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="h-7 w-7 flex items-center justify-center rounded-full text-brand-700 hover:bg-brand-50"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-semibold text-ink w-4 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Sumar uno"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="h-7 w-7 flex items-center justify-center rounded-full text-brand-700 hover:bg-brand-50"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Quitar ${item.product.name} del carrito`}
                      onClick={() => removeItem(item.product.id)}
                      className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full text-muted hover:bg-brand-50 hover:text-brand-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="rounded-md bg-brand-50 border border-brand-300 p-5 lg:sticky lg:top-[120px]">
                <h2 className="text-[15px] font-bold text-brand-900">Resumen del pedido</h2>
                <div className="mt-4 flex items-center justify-between text-sm text-ink">
                  <span>Total</span>
                  <span className="text-[17px] font-bold text-brand-900">{formatCOP(total)}</span>
                </div>
                <div className="mt-4">
                  <Button
                    variant="whatsapp"
                    fullWidth
                    className="h-[46px] rounded-sm"
                    icon={<WhatsAppIcon size={18} />}
                    iconPosition="left"
                    href={whatsappHref}
                    onClick={() => track('whatsapp_click', { source: 'cart' })}
                  >
                    Finalizar por WhatsApp
                  </Button>
                </div>
                <p className="mt-3 text-[12px] text-muted">
                  Coordinamos el pago y la entrega directamente por WhatsApp.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  )
}
