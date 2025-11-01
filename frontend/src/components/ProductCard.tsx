// src/components/ProductCard.tsx
import { Link } from 'react-router-dom'
import { useMemo } from 'react'

type Product = {
  id: number | string
  slug: string
  title?: string
  name?: string
  image_url?: string
  image?: string
  price?: number
  compare_at_price?: number
  is_new?: boolean
  tag?: string
  [key: string]: any
}

export default function ProductCard({ p }: { p: Product }) {
  const displayName = p.title || p.name || 'Unnamed Jersey'
  const imgSrc = p.image_url || p.image || ''
  const isNew = p.is_new || (typeof p.tag === 'string' && p.tag.toLowerCase() === 'new')

  const { priceText, discountPct } = useMemo(() => {
    const nf = new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      maximumFractionDigits: 0,
    })
    const priceNum = Number(p.price) || 0
    const compare = Number(p.compare_at_price) || 0
    const pct = compare > priceNum && priceNum > 0 ? Math.round(((compare - priceNum) / compare) * 100) : 0
    return { priceText: priceNum ? nf.format(priceNum) : '—', discountPct: pct }
  }, [p.price, p.compare_at_price])

  return (
    <Link
      to={`/product/${p.slug}`}
      className="card group focus:outline-none"
      aria-label={`${displayName} – ${priceText}`}
    >
      {/* Image */}
      <div className="relative overflow-hidden rounded-md">
        {/* aspect ratio square */}
        <div className="relative aspect-square w-full rounded-md bg-neutral-200 dark:bg-neutral-800">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={displayName}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500">
              No image
            </div>
          )}
        </div>

        {/* Badges */}
        {(isNew || discountPct > 0) && (
          <div className="pointer-events-none absolute left-2 top-2 flex gap-2">
            {isNew && (
              <span className="rounded-full bg-blue-600/90 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                New
              </span>
            )}
            {discountPct > 0 && (
              <span className="rounded-full bg-emerald-600/90 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                -{discountPct}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Text */}
      <div className="mt-2">
        <div className="line-clamp-1 text-[15px] font-semibold tracking-tight">{displayName}</div>

        <div className="mt-1 flex items-center gap-2">
          <div className="price">{priceText}</div>
          {discountPct > 0 && p.compare_at_price ? (
            <div className="text-sm text-neutral-500 line-through">
              {new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(
                Number(p.compare_at_price)
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* CTA hint */}
      <div className="mt-2 text-sm text-blue-600 opacity-0 transition-opacity duration-150 group-hover:opacity-100 dark:text-blue-400">
        View details →
      </div>
    </Link>
  )
}
