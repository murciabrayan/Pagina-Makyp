import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ShoppingCart, Search } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { ProductModal } from '@/components/ui/ProductModal'
import { formatCOP } from '@/lib/format'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { track } from '@/lib/analytics'
import { useCart } from '@/context/CartContext'
import { products } from '@/data/products'
import { categories } from '@/data/categories'
import { site, whatsappMessages } from '@/data/site'
import type { Product, ProductCategorySlug } from '@/types'

const filters: { slug: ProductCategorySlug | 'todos'; label: string }[] = [
  { slug: 'todos', label: 'Todos' },
  ...categories.map((category) => ({ slug: category.slug, label: category.title })),
]

export function Tienda() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeFilter = searchParams.get('categoria') ?? 'todos'
  const [query, setQuery] = useState('')
  const [openProduct, setOpenProduct] = useState<Product | null>(null)

  const filteredProducts = useMemo(() => {
    const byCategory =
      activeFilter === 'todos' ? products : products.filter((product) => product.category === activeFilter)

    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return byCategory

    return byCategory.filter((product) => product.name.toLowerCase().includes(normalizedQuery))
  }, [activeFilter, query])

  const handleFilterChange = (slug: string) => {
    track('tienda_filter', { categoria: slug })
    if (slug === 'todos') {
      setSearchParams({})
    } else {
      setSearchParams({ categoria: slug })
    }
  }

  return (
    <Layout>
      <section aria-labelledby="tienda-heading" className="pt-10 pb-10 md:pt-12 md:pb-14">
        <div className="max-w-container mx-auto px-5 md:px-6 2xl:px-8">
          <h1 id="tienda-heading" className="font-display text-[24px] md:text-[28px] font-bold text-brand-900">
            Tienda
          </h1>

          <div className="mt-5 relative max-w-[360px]">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar productos..."
              aria-label="Buscar productos"
              className="w-full h-11 rounded-full border border-line bg-white pl-11 pr-4 text-[14px] text-ink placeholder:text-muted focus-visible:border-brand-300"
            />
          </div>

          <div className="mt-4 flex gap-2.5 overflow-x-auto pb-2 -mx-5 px-5 md:mx-0 md:px-0 md:flex-wrap">
            {filters.map((filter) => {
              const isActive = filter.slug === activeFilter
              return (
                <button
                  key={filter.slug}
                  type="button"
                  onClick={() => handleFilterChange(filter.slug)}
                  className={`flex-none rounded-full px-5 h-10 text-[14px] font-semibold transition-all duration-200 ease-out active:scale-95 ${
                    isActive
                      ? 'bg-brand-700 text-white shadow-card'
                      : 'bg-white border border-line text-ink hover:border-brand-300 hover:text-brand-700'
                  }`}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>

          <p className="mt-6 text-[13px] text-muted">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
          </p>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <ShopProductCard key={product.id} product={product} onOpen={setOpenProduct} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <p className="mt-10 text-center text-muted">Todavía no hay productos en esta categoría.</p>
          )}
        </div>
      </section>

      <ProductModal product={openProduct} onClose={() => setOpenProduct(null)} />
    </Layout>
  )
}

function ShopProductCard({ product, onOpen }: { product: Product; onOpen: (p: Product) => void }) {
  const { addItem } = useCart()

  const handleAdd = () => {
    addItem(product)
    track('product_add_to_cart', { id: product.id, name: product.name, source: 'tienda' })
  }

  const whatsappHref = buildWhatsAppUrl({
    phone: site.whatsapp.phone,
    message: whatsappMessages.product(product.name, formatCOP(product.price)),
  })

  return (
    <article className="flex flex-col bg-surface border border-line rounded-md overflow-hidden shadow-card transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-hover">
      {/*
        La foto y el texto abren el detalle: en la tarjeta la descripción va
        recortada (sobre todo en celular) y ahí se lee completa.
      */}
      <button
        type="button"
        onClick={() => {
          onOpen(product)
          track('product_open', { id: product.id, name: product.name })
        }}
        aria-label={`Ver ${product.name}`}
        className="text-left"
      >
        <div className="relative aspect-square bg-brand-50">
          <img
            src={product.image}
            alt={product.name}
            width={260}
            height={260}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain p-3"
          />
          {product.badge && (
            <span className="absolute top-0 left-0 rounded-br-[12px] bg-blush-300 px-3 py-[5px] text-[11px] font-bold text-white">
              {product.badge}
            </span>
          )}
        </div>

        <div className="p-3.5 pb-0">
          <h3 className="text-sm font-bold text-ink leading-[1.3]">{product.name}</h3>
          {product.description && (
            <p className="mt-1.5 text-[12.5px] leading-[1.5] text-muted line-clamp-2">{product.description}</p>
          )}
          <span className="mt-1.5 inline-block text-[12px] font-semibold text-brand-700">
            Ver detalle
          </span>
        </div>
      </button>

      <div className="flex flex-col flex-1 p-3.5">
        <div className="mt-auto flex items-center justify-between">
          <span className="text-[16px] sm:text-[17px] leading-none font-bold text-brand-900">
            {formatCOP(product.price)}
          </span>
          <button
            type="button"
            onClick={handleAdd}
            aria-label={`Agregar ${product.name} al carrito`}
            className="h-[34px] w-[34px] rounded-sm border border-brand-300 flex items-center justify-center text-brand-700 transition-all duration-200 ease-out hover:bg-brand-700 hover:text-white hover:scale-110 active:scale-95"
          >
            <ShoppingCart size={16} />
          </button>
        </div>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('whatsapp_click', { source: 'tienda_product', id: product.id })}
          className="mt-2.5 inline-flex items-center justify-center gap-1.5 h-9 rounded-sm border border-line text-[12.5px] font-semibold text-ink transition-all duration-200 ease-out hover:border-wa hover:text-wa"
        >
          <WhatsAppIcon size={14} />
          Preguntar por WhatsApp
        </a>
      </div>
    </article>
  )
}
