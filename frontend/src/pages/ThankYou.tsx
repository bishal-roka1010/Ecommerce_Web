// src/pages/ThankYou.tsx
import { useEffect, useMemo, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import api from '../lib/api'

type OrderItem = {
  id: number
  product_title: string
  variant_detail?: { size?: string }
  product_price: number
  quantity: number
  sub_total: number
  product_image?: string
}
type Order = {
  id: number
  status?: string
  total?: number
  items?: OrderItem[]
  created_at?: string
  payment_method?: string
  [k: string]: any
}

export default function ThankYou() {
  const { id: idFromPath } = useParams()
  const q = new URLSearchParams(useLocation().search)
  const idFromQuery = q.get('order')
  const orderId = idFromPath || idFromQuery || ''

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const nf = useMemo(
    () =>
      new Intl.NumberFormat('en-NP', {
        style: 'currency',
        currency: 'NPR',
        maximumFractionDigits: 0,
      }),
    []
  )

  useEffect(() => {
    if (!orderId) { setError('Missing order id.'); setLoading(false); return }
    let mounted = true
    ;(async () => {
      try {
        const r = await api.get(`/orders/${orderId}/`)
        if (!mounted) return
        setOrder(r.data)
      } catch (e) {
        if (!mounted) return
        setError('Could not load the order. If you just paid, please refresh in a moment.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [orderId])

  if (loading) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-extrabold tracking-tight">Thank you!</h1>
        <div className="h-24 w-full animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />
      </section>
    )
  }

  if (error || !order) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Order Confirmation</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40">
          {error || 'Order not found.'}
        </div>
        <Link to="/" className="btn mt-2">Back to Home</Link>
      </section>
    )
  }

  const items = order.items || []
  const total = Number(order.total || 0)

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-emerald-300/50 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">
        <h1 className="text-xl font-extrabold">Thank you for your purchase! 🎉</h1>
        <p className="text-sm mt-1">
          Order <strong>#{order.id}</strong> • Status: <strong>{order.status || 'Processing'}</strong>
        </p>
      </div>

      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-3">
              {it.product_image && (
                <img src={it.product_image} className="h-16 w-16 rounded-lg object-cover" />
              )}
              <div>
                <div className="font-semibold">
                  {it.product_title} — {it.variant_detail?.size || 'Free size'}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {nf.format(it.product_price)} × {it.quantity}
                </div>
              </div>
            </div>
            <div className="font-semibold">{nf.format(it.sub_total)}</div>
          </div>
        ))}

        <div className="mt-3 flex items-center justify-between border-t border-neutral-200/70 pt-3 dark:border-neutral-800">
          <div className="text-lg font-extrabold">Total</div>
          <div className="text-lg font-extrabold">{nf.format(total)}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/" className="btn">Continue Shopping</Link>
        <Link to="/cart" className="btn secondary">View Cart</Link>
      </div>
    </section>
  )
}
