// frontend/src/pages/Checkout.tsx
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

type PaymentMethod = 'COD' | 'ESEWA' | 'KHALTI' | 'BANK'

type QRCodeData = {
  qr_code_url: string
  account_name: string
  account_number: string
  instructions: string
}

export default function Checkout() {
  const { cart, setCart } = useCart()
  const [addr, setAddr] = useState<Address[]>([])
  const [sel, setSel] = useState<number | undefined>(undefined)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD')
  const [saving, setSaving] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [orderId, setOrderId] = useState<number | undefined>(undefined)
  
  // QR codes from backend
  const [qrCodes, setQrCodes] = useState<{esewa?: QRCodeData, bank?: QRCodeData}>({})
  
  // Receipt upload fields
  const [receiptUpload, setReceiptUpload] = useState({
    transaction_id: '',
    notes: '',
    receipt_file: null as File | null
  })

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
      const [cartRes, addrRes, qrRes] = await Promise.all([
        api.get('/cart/'),
        api.get('/addresses/'),
        api.get('/payment-qr-codes/')
      ])
      setCart(cartRes.data)
      const list = addrRes.data as Address[]
      setAddr(list)
      if (list?.length) setSel(list.find(a => a.is_default)?.id ?? list[0].id)
      setQrCodes(qrRes.data || {})
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
      const r = await api.post('/orders/', { 
        address: sel,
        payment_method: paymentMethod 
      })
      setOrderId(r.data.order.id)
      
      if (paymentMethod === 'COD') {
        alert('Order placed! Payment will be collected on delivery.')
        window.location.href = `/order/${r.data.order.id}/thank-you`
      } else if (paymentMethod === 'ESEWA' || paymentMethod === 'BANK') {
        alert('Order created! Please scan the QR code and upload your payment receipt.')
      } else if (paymentMethod === 'KHALTI') {
        alert('Order created! Please complete payment via Khalti.')
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Could not create order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  async function uploadReceipt() {
    if (!orderId) { alert('Create an order first'); return }
    if (!receiptUpload.receipt_file) { alert('Please select payment receipt image'); return }
    
    try {
      const formData = new FormData()
      formData.append('transaction_id', receiptUpload.transaction_id)
      formData.append('notes', receiptUpload.notes)
      formData.append('payment_receipt', receiptUpload.receipt_file)
      
      await api.post(`/orders/${orderId}/upload-payment-receipt/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      alert('Payment receipt uploaded successfully! We will verify within 24 hours.')
      window.location.href = `/order/${orderId}/thank-you`
    } catch {
      alert('Failed to upload receipt. Please try again.')
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
      <div className="space-y-6">
        {/* Address Section */}
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Delivery Address</h2>

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

          {/* Create Address Form */}
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

            <button className="btn mt-3" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save Address'}
            </button>
          </form>
        </div>

        {/* Payment Method Selection */}
        <div>
          <h3 className="text-xl font-bold tracking-tight">Payment Method</h3>
          
          <div className="mt-3 space-y-2">
            {/* COD */}
            <label className={`card cursor-pointer flex items-center gap-3 ${paymentMethod === 'COD' ? 'ring-2 ring-blue-500' : ''}`}>
              <input
                type="radio"
                name="payment"
                value="COD"
                checked={paymentMethod === 'COD'}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <div className="font-semibold">💵 Cash on Delivery</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Pay when you receive your order
                </div>
              </div>
            </label>

            {/* eSewa QR */}
            <label className={`card cursor-pointer flex items-center gap-3 ${paymentMethod === 'ESEWA' ? 'ring-2 ring-blue-500' : ''}`}>
              <input
                type="radio"
                name="payment"
                value="ESEWA"
                checked={paymentMethod === 'ESEWA'}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <div className="font-semibold">📱 eSewa (Scan QR)</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Scan QR & upload payment screenshot
                </div>
              </div>
            </label>

            {/* Khalti API */}
            <label className={`card cursor-pointer flex items-center gap-3 ${paymentMethod === 'KHALTI' ? 'ring-2 ring-blue-500' : ''}`}>
              <input
                type="radio"
                name="payment"
                value="KHALTI"
                checked={paymentMethod === 'KHALTI'}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <div className="font-semibold">🔐 Khalti (Secure Gateway)</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Pay via Khalti payment gateway
                </div>
              </div>
            </label>

            {/* Bank QR */}
            <label className={`card cursor-pointer flex items-center gap-3 ${paymentMethod === 'BANK' ? 'ring-2 ring-blue-500' : ''}`}>
              <input
                type="radio"
                name="payment"
                value="BANK"
                checked={paymentMethod === 'BANK'}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <div className="font-semibold">🏦 Bank Transfer (Scan QR)</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Scan bank QR & upload payment screenshot
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* QR Code Display & Receipt Upload (for eSewa & Bank) */}
        {orderId && (paymentMethod === 'ESEWA' || paymentMethod === 'BANK') && (
          <div className="card space-y-4">
            <h4 className="font-bold">
              {paymentMethod === 'ESEWA' ? '📱 eSewa Payment' : '🏦 Bank Transfer'}
            </h4>
            
            {/* Display QR Code */}
            {qrCodes[paymentMethod.toLowerCase() as 'esewa' | 'bank'] && (
              <div className="space-y-3">
                <div className="rounded-lg border border-neutral-200/70 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
                  <img 
                    src={qrCodes[paymentMethod.toLowerCase() as 'esewa' | 'bank']?.qr_code_url}
                    alt={`${paymentMethod} QR Code`}
                    className="mx-auto max-w-xs rounded-lg"
                  />
                  <div className="mt-3 text-center text-sm">
                    <div className="font-semibold">
                      {qrCodes[paymentMethod.toLowerCase() as 'esewa' | 'bank']?.account_name}
                    </div>
                    {qrCodes[paymentMethod.toLowerCase() as 'esewa' | 'bank']?.account_number && (
                      <div className="text-neutral-600 dark:text-neutral-400">
                        A/C: {qrCodes[paymentMethod.toLowerCase() as 'esewa' | 'bank']?.account_number}
                      </div>
                    )}
                  </div>
                </div>

                {qrCodes[paymentMethod.toLowerCase() as 'esewa' | 'bank']?.instructions && (
                  <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                    ℹ️ {qrCodes[paymentMethod.toLowerCase() as 'esewa' | 'bank']?.instructions}
                  </div>
                )}
              </div>
            )}

            {/* Receipt Upload Form */}
            <div className="space-y-3 border-t border-neutral-200/70 pt-4 dark:border-neutral-800">
              <h5 className="font-semibold">Upload Payment Screenshot</h5>
              
              <input
                className="input"
                placeholder="Transaction ID (from receipt)"
                value={receiptUpload.transaction_id}
                onChange={(e) => setReceiptUpload({...receiptUpload, transaction_id: e.target.value})}
              />
              
              <textarea
                className="input"
                placeholder="Additional notes (optional)"
                rows={2}
                value={receiptUpload.notes}
                onChange={(e) => setReceiptUpload({...receiptUpload, notes: e.target.value})}
              />
              
              <div>
                <label className="text-sm font-medium">Upload Payment Receipt/Screenshot</label>
                <input
                  className="input mt-1"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReceiptUpload({...receiptUpload, receipt_file: e.target.files?.[0] || null})}
                  required
                />
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Accepted: JPG, PNG, WebP (max 5MB)
                </p>
              </div>
              
              <button 
                className="btn w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={uploadReceipt}
                disabled={!receiptUpload.receipt_file}
              >
                ✓ Upload & Submit Receipt
              </button>
            </div>
          </div>
        )}

        {/* Place Order Button */}
        {!orderId && (
          <button
            className="btn w-full"
            onClick={placeOrder}
            disabled={!items.length || !sel || placing}
          >
            {placing ? 'Creating Order…' : 'Place Order'}
          </button>
        )}

        {/* Khalti Payment Button */}
        {orderId && paymentMethod === 'KHALTI' && (
          <button className="btn w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={payKhalti}>
            Pay with Khalti →
          </button>
        )}

        {/* Order Status */}
        {!!orderId && (
          <div className="rounded-lg border border-emerald-200/70 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">
            ✓ Order #{orderId} created
            {paymentMethod === 'COD' && ' — Payment will be collected on delivery'}
            {(paymentMethod === 'ESEWA' || paymentMethod === 'BANK') && ' — Please upload payment receipt above'}
            {paymentMethod === 'KHALTI' && ' — Click button above to complete payment'}
          </div>
        )}
      </div>
    </section>
  )
}