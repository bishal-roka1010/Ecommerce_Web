// src/pages/Checkout.tsx
import { useEffect, useMemo, useState } from 'react'
import api from '../lib/api'
import { useCart } from '../store/cart'

type Address = {
  id: number
  full_name: string
  phone: string
  province: string
  city: string
  street: string
  landmark?: string
  is_default?: boolean
}

export default function Checkout() {
  const { cart, setCart } = useCart()
  const [addr, setAddr] = useState<Address[]>([])
  const [sel, setSel] = useState<number | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [orderId, setOrderId] = useState<number | undefined>(undefined)

  const [form, setForm] = useState<Address>({
    id: 0,
    full_name: '',
    phone: '',
    province: '',
    city: '',
    street: '',
    landmark: '',
    is_default: true
  } as Address)

  useEffect(() => {
    ;(async () => {
      const [cartRes, addrRes] = await Promise.all([
        api.get('/cart/'),
        api.get('/addresses/')
      ])
      setCart(cartRes.data)
      const list = addrRes.data as Address[]
      setAddr(list)
      if (list?.length) setSel(list.find(a => a.is_default)?.id ?? list[0].id)
    })()
  }, [setCart])

  const nf = useMemo(
    () =>
      new Intl.NumberFormat('en-NP', {
        style: 'currency',
        currency: 'NPR',
        maximumFractionDigits: 0
      }),
    []
  )

  const items = cart?.items || []
  const total = Number(cart?.cart_total || 0)

  // --- Actions ---
  async function createAddress(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name || !form.phone || !form.province || !form.city || !form.street) {
      alert('Please fill Full Name, Phone, Province, City, and Street.')
      return
    }
    try {
      setSaving(true)
      const r = await api.post('/addresses/', form)
      const newA = r.data as Address
      setAddr(prev => [...prev, newA])
      setSel(newA.id)
      setForm({ ...form, full_name: '', phone: '', province: '', city: '', street: '', landmark: '' } as Address)
      alert('Address saved')
    } catch {
      alert('Could not save address. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function placeOrder() {
    if (!items.length) { alert('Your cart is empty.'); return }
    if (!sel) { alert('Select or create an address.'); return }
    try {
      setPlacing(true)
      const r = await api.post('/orders/', { address: sel })
      setOrderId(r.data.id)
      alert('Order created!')
    } catch {
      alert('Could not create order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  async function payKhalti() {
    if (!orderId) { alert('Create an order first'); return }
    try {
      const r = await api.post(`/payments/khalti/initiate/${orderId}/`)
      const url = r.data.payment_url
      if (url) window.location.href = url
      else alert('Khalti initiation failed')
    } catch {
      alert('Khalti initiation failed')
    }
  }

  async function payEsewa() {
    if (!orderId) { alert('Create an order first'); return }
    try {
      const r = await api.post(`/payments/esewa/initiate/${orderId}/`)
      const { form_action, fields } = r.data || {}
      if (form_action && fields) submitForm(form_action, fields)
      else alert('eSewa initiation failed')
    } catch {
      alert('eSewa initiation failed')
    }
  }

  return (
    <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
      {/* Left: Order Summary */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Your Order</h2>

        {!items.length ? (
          <div className="mt-3 rounded-xl border border-neutral-200/70 p-6 text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
            Your cart is empty.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {items.map((it: any) => (
              <div key={it.id} className="card flex items-center justify-between">
                <div>
                  <div className="font-semibold">
                    {it.product_title} — {it.variant_detail?.size || 'Free size'}
                  </div>
                  <div className="price">
                    {nf.format(Number(it.product_price))} × {it.quantity} ={' '}
                    <strong>{nf.format(Number(it.sub_total))}</strong>
                  </div>
                </div>
                {it.product_image && (
                  <img
                    src={it.product_image}
                    alt={it.product_title}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                )}
              </div>
            ))}

            <div className="mt-3 flex items-center justify-between rounded-xl border-t border-neutral-200/70 pt-3 dark:border-neutral-800">
              <div className="text-lg font-extrabold">Total</div>
              <div className="text-lg font-extrabold">{nf.format(total)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Address + Payment */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Address</h2>

        {addr.length ? (
          <select
            className="input mt-2"
            value={sel}
            onChange={(e) => setSel(parseInt(e.target.value))}
          >
            {addr.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name} — {a.city}
              </option>
            ))}
          </select>
        ) : (
          <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            No address yet. Add one below.
          </div>
        )}

        {/* Create Address */}
        <form onSubmit={createAddress} className="card mt-3 space-y-2">
          <div className="row">
            <input
              className="input"
              placeholder="Full Name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>
          <div className="row mt-2">
            <input
              className="input"
              placeholder="Province"
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
            />
          </div>
          <div className="row mt-2">
            <input
              className="input"
              placeholder="Street"
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="Landmark (optional)"
              value={form.landmark || ''}
              onChange={(e) => setForm({ ...form, landmark: e.target.value })}
            />
          </div>

          <button className="btn mt-3" type="submit" disabled={saving} aria-disabled={saving}>
            {saving ? 'Saving…' : 'Save Address'}
          </button>
        </form>

        {/* Order & Pay */}
        <div className="mt-4 row">
          <button
            className="btn"
            onClick={placeOrder}
            disabled={!items.length || !sel || placing}
            aria-disabled={!items.length || !sel || placing}
            title={!items.length ? 'Cart is empty' : !sel ? 'Select address' : 'Create Order'}
          >
            {placing ? 'Creating…' : 'Create Order'}
          </button>

          <button
            className="btn secondary"
            onClick={payKhalti}
            disabled={!orderId}
            aria-disabled={!orderId}
            title={!orderId ? 'Create order first' : 'Pay with Khalti'}
          >
            Pay with Khalti
          </button>

          <button
            className="btn secondary"
            onClick={payEsewa}
            disabled={!orderId}
            aria-disabled={!orderId}
            title={!orderId ? 'Create order first' : 'Pay with eSewa'}
          >
            Pay with eSewa
          </button>
        </div>

        {!!orderId && (
          <div className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
            Order #{orderId} created — choose a payment method.
          </div>
        )}
      </div>
    </section>
  )
}

function submitForm(action: string, fields: Record<string, string>) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = action
  Object.entries(fields).forEach(([k, v]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = k
    input.value = String(v)
    form.appendChild(input)
  })
  document.body.appendChild(form)
  form.submit()
}
