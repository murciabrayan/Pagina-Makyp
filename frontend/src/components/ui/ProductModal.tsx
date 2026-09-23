import { useEffect } from 'react'
import { ShoppingCart, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { useCart } from '@/context/CartContext'
import { formatCOP } from '@/lib/format'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { track } from '@/lib/analytics'
import { useFocusTrap } from '@/lib/useFocusTrap'
import { whatsappMessages } from '@/data/mensajes'
import { useContent } from '@/context/ContentContext'
import type { ProductModalProps } from '@/types'

/**
 * Detalle del producto.
 *
 * En la tienda las tarjetas son chicas y la descripción queda recortada,
 * sobre todo en celular. Aquí se ve la foto en grande y el texto completo.
 * En pantalla chica ocupa toda la pantalla; en grande es una ventana.
 */
export function ProductModal({ product, onClose }: ProductModalProps) {
  const { addItem } = useCart()
  const { site } = useContent()
  // el foco entra a la ventana al abrirla y vuelve a la tarjeta al cerrarla
  const ventanaRef = useFocusTrap<HTMLDivElement>(Boolean(product))

  useEffect(() => {
    if (!product) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [product, onClose])

  if (!product) return null

  const whatsappHref = buildWhatsAppUrl({
    phone: site.whatsapp.phone,
    message: whatsappMessages.product(product.name, formatCOP(product.price)),
  })

  return (
    <div className="fixed inset-0 z-[80] flex sm:items-center sm:justify-center sm:p-6">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
      />

      <div
        ref={ventanaRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="producto-titulo"
        className="relative w-full sm:max-w-3xl max-h-full sm:max-h-[88vh] overflow-y-auto bg-surface sm:rounded-lg shadow-hover"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3 right-3 z-10 h-10 w-10 flex items-center justify-center rounded-full bg-white border border-line text-brand-700 shadow-card transition-colors hover:bg-brand-700 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="grid sm:grid-cols-2">
          <div className="relative bg-brand-50 aspect-square sm:aspect-auto sm:min-h-[420px]">
            <img
              src={product.image}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-contain p-4"
            />
            {product.badge && (
              <span className="absolute top-0 left-0 rounded-br-[12px] bg-blush-300 px-3 py-[5px] text-[11px] font-bold text-white">
                {product.badge}
              </span>
            )}
          </div>

          <div className="p-5 sm:p-7 flex flex-col">
            <h2
              id="producto-titulo"
              className="font-display text-[22px] sm:text-[26px] font-bold text-brand-900 leading-[1.2] pr-10"
            >
              {product.name}
            </h2>
            <p className="mt-2 text-[22px] font-bold text-brand-700">{formatCOP(product.price)}</p>

            {product.description && (
              <p className="mt-4 text-[14px] leading-[1.65] text-muted">{product.description}</p>
            )}

            {product.includes && (
              <div className="mt-4 rounded-md bg-brand-50 border border-line p-4">
                <h3 className="text-[13px] font-bold text-ink">Incluye</h3>
                <p className="mt-1 text-[13.5px] leading-[1.6] text-muted">{product.includes}</p>
              </div>
            )}

            <div className="mt-auto pt-6 flex flex-col gap-2.5">
              <Button
                variant="primary"
                fullWidth
                icon={<ShoppingCart size={18} />}
                iconPosition="left"
                onClick={() => {
                  addItem(product)
                  track('product_add_to_cart', { id: product.id, name: product.name, source: 'detalle' })
                }}
              >
                Agregar al carrito
              </Button>
              <Button
                variant="whatsapp"
                fullWidth
                className="h-[52px] rounded-sm"
                icon={<WhatsAppIcon size={18} />}
                iconPosition="left"
                href={whatsappHref}
                onClick={() => track('whatsapp_click', { source: 'detalle_producto', id: product.id })}
              >
                Preguntar por WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
