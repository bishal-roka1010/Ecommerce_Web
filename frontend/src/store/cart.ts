import { create } from 'zustand'

type Cart = {
  id?: number
  items?: any[]
  cart_total?: number
}

interface CartState {
  sessionId: string
  cart?: Cart
  setCart: (c: Cart) => void
  setSessionId: (id: string) => void
}

const initialSid = localStorage.getItem('sid') || crypto.randomUUID()

export const useCart = create<CartState>((set) => ({
  sessionId: initialSid,
  cart: undefined,
  setCart: (c) => set({ cart: c }),
  setSessionId: (id) => { localStorage.setItem('sid', id); set({ sessionId: id }) }
}))
