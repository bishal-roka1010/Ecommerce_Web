// src/pages/Login.tsx
import { useState } from 'react'
import api from '../lib/api'
import { useAuth } from '../store/auth'
import { useCart } from '../store/cart'
import { useLocation, useNavigate } from 'react-router-dom'

export default function Login() {
  const [username, setU] = useState('')
  const [password, setP] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { setToken } = useAuth()
  const { setCart } = useCart()
  const nav = useNavigate()
  const location = useLocation() as { state?: { from?: string } }
  const redirectTo = location.state?.from || '/checkout' // if no "from", go to checkout

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!username || !password) {
      setError('Please enter both username and password.')
      return
    }
    try {
      setLoading(true)
      const r = await api.post('/auth/token/', { username, password })
      const token = r?.data?.access
      if (!token) {
        setError('Login failed. No token returned.')
        return
      }
      setToken(token)

      // optional but nice: fetch user-bound cart after auth merge
      try {
        const cart = await api.get('/cart/')
        setCart(cart.data)
      } catch {
        /* ignore cart fetch errors—still proceed */
      }

      nav(redirectTo, { replace: true })
    } catch (err: any) {
      setError('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-md space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Login</h1>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="card space-y-3">
        <div>
          <label className="text-sm font-medium">Username</label>
          <input
            className="input mt-1"
            value={username}
            onChange={(e) => setU(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Password</label>
          <input
            className="input mt-1"
            type="password"
            value={password}
            onChange={(e) => setP(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button className="btn w-full" type="submit" disabled={loading} aria-disabled={loading}>
          {loading ? 'Signing in…' : 'Login'}
        </button>
      </form>

      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        You’ll be redirected to <span className="font-medium">{redirectTo}</span> after login.
      </p>
    </section>
  )
}
