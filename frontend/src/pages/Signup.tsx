import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../lib/api"
import { useAuth } from "../store/auth"
import { useCart } from "../store/cart"

export default function Signup() {
  const nav = useNavigate()
  const { setToken } = useAuth()
  const { setCart } = useCart()

  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.username || !form.email || !form.password) return setError("Please fill all fields.")
    if (form.password !== form.confirm) return setError("Passwords do not match.")
    try {
      setLoading(true)
      // adjust endpoints to your backend as needed:
      await api.post("/auth/register/", { username: form.username, email: form.email, password: form.password })
      const login = await api.post("/auth/token/", { username: form.username, password: form.password })
      setToken(login.data.access)
      try {
        const cart = await api.get("/cart/")
        setCart(cart.data)
      } catch {}
      nav("/", { replace: true })
    } catch {
      setError("Signup failed. Try a different email/username.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-md space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Create your account</h1>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="card space-y-3">
        <input className="input" placeholder="Username" value={form.username} onChange={(e)=>setForm({...form, username:e.target.value})}/>
        <input className="input" placeholder="Email" type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})}/>
        <input className="input" placeholder="Password" type="password" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})}/>
        <input className="input" placeholder="Confirm Password" type="password" value={form.confirm} onChange={(e)=>setForm({...form, confirm:e.target.value})}/>
        <button className="btn w-full" type="submit" disabled={loading} aria-disabled={loading}>
          {loading ? "Creating…" : "Sign Up"}
        </button>
      </form>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Already have an account? <a href="/login" className="btn link">Login</a>
      </p>
    </section>
  )
}
