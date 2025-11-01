// src/pages/Product.tsx
import { useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import api from '../lib/api'
import { useCart } from '../store/cart'

type Variant = {
  id: number
  size?: string
  stock?: number
  price?: number
}
type Product = {
  id: number | string
  slug: string
  title?: string
  name?: string
  price?: number
  compare_at_price?: number
  image_url?: string
  image?: string
  images?: string[]
  variants?: Variant[]
  description?: string
  [key: string]: any
}

export default function Product() {
  const { slug } = useParams()
  const [p, setP] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [variantId, setVariantId] = useState<number | undefined>(undefined)
  const [qty, setQty] = useState(1)
  const { setCart } = useCart()

  useEffect(() => {
    if (!slug) return
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const r = await api.get(`/products/${slug}/`)
        const data: Product = r.data
        if (!mounted) return
        setP(data)
        const firstVariant = data?.variants?.[0]?.id
        setVariantId(firstVariant)
      } catch (e: any) {
        if (!mounted) return
        setError('Could not load the product. Please try again.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [slug])

  const nf = useMemo(
    () =>
      new Intl.NumberFormat('en-NP', {
        style: 'currency',
        currency: 'NPR',
        maximumFractionDigits: 0,
      }),
    []
  )

  const displayName = p?.title || p?.name || 'Jersey'
  const mainImage =
    p?.image_url || p?.image || (Array.isArray(p?.images) ? p?.images?.[0] : '')
  const displayPrice = nf.format(
    (p?.variants?.find((v) => v.id === variantId)?.price ??
      Number(p?.price) ??
      0) as number
  )
  const comparePrice = p?.compare_at_price
    ? nf.format(Number(p.compare_at_price))
    : null

  const selectedVariant = p?.variants?.find((v) => v.id === variantId)
  const inStock =
    typeof selectedVariant?.stock === 'number'
      ? (selectedVariant?.stock ?? 0) > 0
      : true

  async function addToCart() {
    if (!variantId) return alert('Please choose a size first.')
    if (!inStock) return alert('Selected size is out of stock.')
    try {
      const r = await api.post('/cart/add/', { variant: variantId, quantity: qty })
      setCart(r.data)
      alert('Added to cart!')
    } catch (e: any) {
      alert('Could not add to cart. Please try again.')
    }
  }

  if (loading) {
    return (
      <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="aspect-square w-full animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
        <div className="space-y-4">
          <div className="h-7 w-2/3 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-5 w-1/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-24 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-10 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </section>
    )
  }

  if (error || !p) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40">
        {error || 'Product not found.'}
      </div>
    )
  }

  return (
    <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
      {/* Left: Image */}
      <div>
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/70 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="relative aspect-square w-full">
            {mainImage ? (
              <img
                src={mainImage}
                alt={displayName}
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-neutral-500">
                No image
              </div>
            )}
          </div>
        </div>
        {/* (Optional) Thumbnails if p.images exists */}
        {Array.isArray(p.images) && p.images.length > 1 && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {p.images.slice(0, 5).map((src, i) => (
              <div
                key={i}
                className="aspect-square overflow-hidden rounded-lg border border-neutral-200/70 dark:border-neutral-800"
              >
                <img src={src} alt={`${displayName} ${i + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Details */}
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {displayName}
        </h1>

        <div className="flex items-end gap-3">
          <div className="text-xl font-bold">{displayPrice}</div>
          {comparePrice && (
            <div className="text-sm text-neutral-500 line-through">{comparePrice}</div>
          )}
        </div>

        {/* Size / Variant */}
        <div>
          <label className="text-sm font-medium">Size</label>
          <select
            className="input mt-2"
            value={variantId}
            onChange={(e) => setVariantId(parseInt(e.target.value))}
          >
            {p.variants?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.size || `Variant ${v.id}`} {typeof v.stock === 'number' ? `(stock ${v.stock})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Qty */}
        <div>
          <label className="text-sm font-medium">Quantity</label>
          <div className="mt-2 flex w-full max-w-[220px] items-center gap-2">
            <button
              type="button"
              className="btn secondary"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <input
              className="input text-center"
              inputMode="numeric"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => {
                const v = parseInt(e.target.value)
                setQty(Number.isFinite(v) && v > 0 ? v : 1)
              }}
            />
            <button
              type="button"
              className="btn secondary"
              onClick={() => setQty((q) => q + 1)}
            >
              +
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-2">
          <button
            className="btn"
            onClick={addToCart}
            disabled={!variantId || !inStock}
            aria-disabled={!variantId || !inStock}
            title={!variantId ? 'Choose a size' : !inStock ? 'Out of stock' : 'Add to Cart'}
            style={{ opacity: !variantId || !inStock ? 0.6 : 1 }}
          >
            {inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>

        {/* Description */}
        {p.description && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="mt-2 text-neutral-700 dark:text-neutral-300">{p.description}</p>
          </div>
        )}
      </div>
    </section>
  )
}
