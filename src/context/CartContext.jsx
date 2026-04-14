import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { request } from '../utils/api'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

const STORAGE_KEY = 'luxe_cart'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
}
function save(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load)
  const [isLoadingCart, setIsLoadingCart] = useState(false)
  const { user } = useAuth()
  const syncTimeoutRef = useRef(null)

  // Load cart based on authentication state
  useEffect(() => {
    if (user) {
      loadCartFromServer()
    } else {
      // When logged out, clear server-synced items (keep localStorage backup)
      setItems([])
    }
  }, [user?.id])

  // Debounced sync to server when items change
  useEffect(() => {
    if (!user) {
      // If not logged in, just save to localStorage
      save(items)
      return
    }

    // Debounce server sync to prevent excessive API calls
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)

    syncTimeoutRef.current = setTimeout(() => {
      syncCartToServer()
    }, 1000) // Wait 1 second after change before syncing

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    }
  }, [items, user?.id])

  const loadCartFromServer = async () => {
    try {
      setIsLoadingCart(true)
      const res = await request('/cart')
      const serverItems = res.data?.items || []
      
      // If server cart is empty, merge any local items
      if (serverItems.length === 0) {
        const localItems = load()
        if (localItems.length > 0) {
          setItems(localItems)
          // Save merged items to server
          await request('/cart', { method: 'POST', body: JSON.stringify({ items: localItems }) })
        } else {
          setItems([])
        }
      } else {
        // Update state with server cart
        setItems(serverItems)
        // Also keep in sync with localStorage as backup
        save(serverItems)
      }
    } catch (err) {
      console.error('Failed to load cart from server:', err)
      // Fallback to localStorage if server fails
      setItems(load())
    } finally {
      setIsLoadingCart(false)
    }
  }

  const syncCartToServer = async () => {
    if (!user) return

    try {
      await request('/cart', { method: 'POST', body: JSON.stringify({ items }) })
      // Also save to localStorage as backup
      save(items)
    } catch (err) {
      console.error('Failed to sync cart to server:', err)
      // Still keep it in localStorage
      save(items)
    }
  }

  const addItem = (item) => {
    setItems(prev => {
      const key = `${item.product_id}-${item.variant_id ?? 'no-variant'}`
      const idx = prev.findIndex(i => `${i.product_id}-${i.variant_id ?? 'no-variant'}` === key)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + (item.quantity ?? 1) }
        return updated
      }
      return [...prev, { ...item, id: Date.now(), quantity: item.quantity ?? 1 }]
    })
  }

  const updateQty = (id, qty) => {
    if (qty < 1) return
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i))
  }

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id))

  const clearCart = async () => {
    setItems([])
    if (user) {
      try {
        await request('/cart', { method: 'DELETE' })
      } catch (err) {
        console.error('Failed to clear cart on server:', err)
      }
    }
  }

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clearCart, totalItems, isLoadingCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
