import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '@/lib/api'
import type { CartContextValue, CartItem, Product } from '@/types'

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'makyp.carrito'

interface LineaGuardada {
  id: number
  quantity: number
}

/**
 * Lee del navegador lo que habia en el carrito.
 *
 * Se guarda solo `{id, cantidad}`, no el producto entero: si cambia un precio
 * o una foto, el carrito viejo mostraria los datos de antes y el pedido de
 * WhatsApp saldria con un total que ya no es el nuestro. Los datos de verdad
 * se piden despues a la API.
 *
 * Todo va en try/catch: en navegacion privada o con las cookies bloqueadas
 * `localStorage` lanza al tocarlo, y un carrito no es motivo para tumbar la
 * pagina.
 */
function leerLineasGuardadas(): LineaGuardada[] {
  try {
    const crudo = localStorage.getItem(STORAGE_KEY)
    if (!crudo) return []
    const guardado = JSON.parse(crudo) as unknown
    if (!Array.isArray(guardado)) return []
    return guardado.flatMap((linea) => {
      const id = Number((linea as LineaGuardada)?.id)
      const quantity = Math.floor(Number((linea as LineaGuardada)?.quantity))
      if (!Number.isFinite(id) || !Number.isFinite(quantity) || quantity <= 0) return []
      return [{ id, quantity }]
    })
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  // Hasta que no se rehidrata no se escribe nada: si no, el primer render
  // (con el carrito aún vacío) borraría lo que había guardado.
  const [rehidratado, setRehidratado] = useState(false)

  useEffect(() => {
    const lineas = leerLineasGuardadas()
    if (lineas.length === 0) {
      setRehidratado(true)
      return
    }

    const controlador = new AbortController()

    // El carrito guardado solo tiene identificadores, así que los productos se
    // piden a la API. El que ya no exista o esté oculto simplemente se cae:
    // vale más un carrito más corto que uno que ofrece algo que no se vende.
    api
      .get<Product[]>('/catalog/products/', controlador.signal)
      .then((productos) => {
        if (controlador.signal.aborted) return
        const porId = new Map(productos.map((producto) => [producto.id, producto]))
        setItems(
          lineas.flatMap((linea) => {
            const product = porId.get(linea.id)
            return product ? [{ product, quantity: linea.quantity }] : []
          }),
        )
      })
      .catch(() => {
        // sin conexión el carrito arranca vacío, pero lo guardado no se toca:
        // al volver la conexión se recupera solo
      })
      .finally(() => {
        if (!controlador.signal.aborted) setRehidratado(true)
      })

    return () => controlador.abort()
  }, [])

  useEffect(() => {
    if (!rehidratado) return
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items.map((item) => ({ id: item.product.id, quantity: item.quantity }))),
      )
    } catch {
      // sin espacio o sin permiso: el carrito sigue vivo en memoria
    }
  }, [items, rehidratado])

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((item) => item.product.id !== productId)
        : prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item)),
    )
  }, [])

  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items],
  )

  const value = useMemo<CartContextValue>(
    () => ({ items, count, total, addItem, removeItem, updateQuantity }),
    [items, count, total, addItem, removeItem, updateQuantity],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// El provider y su hook viven juntos a propósito: separarlos obligaría a
// importar de dos rutas para usar una sola cosa. Solo cuesta el refresco en
// caliente de este archivo durante el desarrollo.
// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
