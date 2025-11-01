import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { useCart } from '../store/cart'
import { FormEvent, useState } from 'react'

export default function Header() {
  const { token, setToken } = useAuth()
  const { cart } = useCart()
  const nav = useNavigate()
  const location = useLocation()

  const [darkMode, setDarkMode] = useState(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  )
  const [search, setSearch] = useState('')

  const itemsCount =
    cart?.items?.reduce((s: number, it: any) => s + (it.quantity || 0), 0) || 0

  function logout() {
    setToken(undefined)
    nav('/')
  }

  function toggleDark() {
    const html = document.documentElement
    if (darkMode) {
      html.classList.remove('dark')
      setDarkMode(false)
      localStorage.setItem('theme', 'light')
    } else {
      html.classList.add('dark')
      setDarkMode(true)
      localStorage.setItem('theme', 'dark')
    }
  }

  function submitSearch(e: FormEvent) {
    e.preventDefault()
    const q = search.trim()
    if (q) nav(`/?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="sticky top-0 z-50 mb-6 flex items-center justify-between border-b border-neutral-200/60 bg-white/80 px-4 py-3 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/60">
      {/* Brand */}
      <Link
        to="/"
        className="text-lg font-extrabold tracking-tight hover:opacity-80 sm:text-xl"
      >
        Jersey Empire Nepal
      </Link>

      {/* Search (hidden on very small screens) */}
      <form onSubmit={submitSearch} className="hidden w-full max-w-sm items-center gap-2 sm:flex">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clubs, players…"
          className="input"
        />
      </form>

      {/* Navigation */}
      <nav className="flex items-center gap-4 text-sm font-medium sm:gap-6">
        <Link
          to="/cart"
          className={`hover:text-blue-600 dark:hover:text-blue-400 ${
            location.pathname === '/cart' ? 'text-blue-600 dark:text-blue-400' : ''
          }`}
        >
          🛒 Cart ({itemsCount})
        </Link>

        {token ? (
          <>
            <Link
              to="/checkout"
              className={`hover:text-blue-600 dark:hover:text-blue-400 ${
                location.pathname === '/checkout' ? 'text-blue-600 dark:text-blue-400' : ''
              }`}
            >
              Checkout
            </Link>
            <button
              onClick={logout}
              className="rounded-md px-2 py-1 text-neutral-600 hover:text-red-600 dark:text-neutral-300 dark:hover:text-red-400"
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className={`hover:text-blue-600 dark:hover:text-blue-400 ${
              location.pathname === '/login' ? 'text-blue-600 dark:text-blue-400' : ''
            }`}
          >
            Login
          </Link>
        )}

        {/* Dark/Light toggle (emoji to avoid extra deps) */}
        <button
          onClick={toggleDark}
          aria-label="Toggle theme"
          className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          <span aria-hidden>{darkMode ? '☀️' : '🌙'}</span>
        </button>
      </nav>
    </header>
  )
}
