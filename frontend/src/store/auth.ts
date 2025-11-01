import { create } from 'zustand'

interface AuthState {
  token?: string
  setToken: (t?: string) => void
}

export const useAuth = create<AuthState>((set) => ({
  token: localStorage.getItem('token') || undefined,
  setToken: (t) => {
    if(t) localStorage.setItem('token', t); else localStorage.removeItem('token')
    set({ token: t })
  }
}))
