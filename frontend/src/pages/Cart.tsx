import { useEffect, useMemo } from 'react'
import api from '../lib/api'
import { useCart } from '../store/cart'
import { Link } from 'react-router-dom'

export default function Cart() {
  const { cart, setCart } = useCart()

  useEffect(() => {
    api.get('/cart/').then((r) => setCart(r.data))
  }, [setCart])

  async function removeItem(id: number) {
    const r = await api.post('/cart/remove/', { item_id: id })
    setCart(r.data)
  }

  async function changeQty(id: number, qty: number) {
    if (qty < 1) return
    const r = await api.post('/cart/update-qty/', { item_id: id, quantity: qty })
    setCart(r.data)
  }

  const nf = useMemo(
    () =>
      new Intl.NumberFormat('en-NP', {
        style: 'currency',
        currency: 'NPR',
        maximumFractionDigits: 0,
      }),
    []
  )

  const items = cart?.items || []
  const total = cart?.cart_total || 0

  if (!items.length) {
    return (
      <section className="text-center py-10">
        <h1 className="text-2xl font-extrabold">Your Cart</h1>
        <p className="mt-4 text-neutral-500 dark:text-neutral-400">
          Your cart is empty — start shopping now!
        </p>
        <Link
          to="/"
          className="btn mt-6 inline-block bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Browse Jerseys
        </Link>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Your Cart</h1>

      <div className="space-y-4">
        {items.map((it: any) => (
          <div
            key={it.id}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-neutral-200/70 bg-white p-4 shadow-soft dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex w-full flex-1 items-center gap-4">
              {it.product_image && (
                <img
                  src={it.product_image}
                  alt={it.product_title}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <div className="font-semibold">
                  {it.product_title} — {it.variant_detail?.size || 'Free size'}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {nf.format(it.product_price)} × {it.quantity} ={' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {nf.format(it.sub_total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quantity + Remove */}
            <div className="flex items-center gap-2">
              <input
                className="input w-20 text-center"
                type="number"
                min={1}
                value={it.quantity}
                onChange={(e) =>
                  changeQty(it.id, parseInt(e.target.value) || 1)
                }
              />
              <button
                className="btn secondary"
                onClick={() => removeItem(it.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Total Section */}
      <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-neutral-200/70 pt-6 sm:flex-row dark:border-neutral-800">
        <div className="text-xl font-extrabold tracking-tight">
          Total: {nf.format(total)}
        </div>
        <Link
          to="/checkout"
          className="btn bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Proceed to Checkout →
        </Link>
      </div>
    </section>
  )
}
