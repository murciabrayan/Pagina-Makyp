import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { CartContextValue, CartItem, Product } from '@/types'

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item)),
    )
  }

  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items],
  )

  const value = useMemo<CartContextValue>(
    () => ({ items, count, total, addItem, removeItem, updateQuantity }),
    [items, count, total],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
