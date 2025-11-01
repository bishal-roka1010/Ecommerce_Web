// src/App.tsx
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

import Home from './pages/Home'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ThankYou from './pages/ThankYou'
import Landing from './pages/Landing'

import Header from './components/Header'
import { useAuth } from './store/auth'

export default function App() {
  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Header />

        {/* Promo bar (trust + shipping/payment info) */}
        <div className="mb-3 rounded-xl bg-neutral-900 px-4 py-2 text-xs text-white dark:bg-black">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>🚚 Free delivery over NPR 4,000 • 3–5 days in Nepal</span>
            <span>✔️ 100% Authentic • 🔁 7-day size exchange</span>
            <span>💳 eSewa | Khalti | COD</span>
          </div>
        </div>

        {/* Main */}
        <main className="py-6 sm:py-8">
          <ScrollToTop />
          <Routes>
            {/* Shop */}
            <Route path="/" element={<Home />} />
            <Route path="/product/:slug" element={<Product />} />
            <Route path="/cart" element={<Cart />} />

            {/* Checkout (protected) */}
            <Route
              path="/checkout"
              element={
                <RequireAuth>
                  <Checkout />
                </RequireAuth>
              }
            />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Marketing */}
            <Route path="/landing" element={<Landing />} />

            {/* Thank-you routes */}
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/order/:id/thank-you" element={<ThankYou />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="mt-10 rounded-3xl border border-neutral-200/70 p-6 dark:border-neutral-800">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <Link to="/" className="font-semibold tracking-tight hover:opacity-80">
                Jersey Empire Nepal
              </Link>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                100% authentic jerseys. Kathmandu-based. Fast nationwide delivery.
              </p>
            </div>
            <div className="text-sm">
              <div className="font-medium">Help</div>
              <ul className="mt-2 space-y-1">
                <li><a href="/pages/size-guide">Size Guide</a></li>
                <li><a href="/pages/delivery">Delivery & Returns</a></li>
                <li><a href="/pages/contact">Contact</a></li>
              </ul>
            </div>
            <div className="text-sm">
              <div className="font-medium">Follow</div>
              <div className="mt-2 flex gap-3">
                <a href="#" aria-label="Instagram">📷</a>
                <a href="#" aria-label="Facebook">📘</a>
                <a href="#" aria-label="TikTok">🎵</a>
              </div>
              <form className="mt-3 flex gap-2">
                <input className="input" placeholder="Email for drops" />
                <button className="btn">Join</button>
              </form>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
            © {new Date().getFullYear()} Jersey Empire Nepal. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  )
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const { token } = useAuth()
  const location = useLocation()
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}

/** Smoothly scroll to top on route changes */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])
  return null
}
