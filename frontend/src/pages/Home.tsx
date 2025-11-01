import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../lib/api'
import ProductCard from '../components/ProductCard'

type Product = {
  id: number | string
  slug: string
  title?: string
  name?: string
  price?: number
  image_url?: string
  [k: string]: any
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loc = useLocation()
  const qs = useMemo(() => new URLSearchParams(loc.search), [loc.search])
  const q = qs.get('q') || ''
  const league = qs.get('league') || ''
  const tag = qs.get('tag') || ''

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const r = await api.get('/products/', {
          params: {
            search: q || undefined,
            league: league || undefined,
            tag: tag || undefined,
          },
        })
        const data = r?.data
        const list: Product[] = Array.isArray(data) ? data : data?.results || []
        if (mounted) setProducts(list)
      } catch {
        if (mounted) setError('Could not load products. Please try again.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [q, league, tag])

  return (
    <section className="space-y-6">
      {/* Hero (inline so no extra file needed) */}
      <section className="relative mb-1 overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-black to-black text-white">
        <div className="relative z-10 px-8 py-12 sm:px-12 sm:py-16">
          <p className="text-xs uppercase tracking-widest opacity-80">New Season Drop</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">
            Authentic Club & Country Jerseys
          </h1>
          <p className="mt-3 max-w-xl text-sm opacity-90">
            Official quality. Fast delivery across Nepal. Sizes XS–XXL.
          </p>
          <div className="mt-5 flex gap-3">
            <a href="/?tag=new" className="btn bg-white text-black hover:bg-neutral-200">Shop New Arrivals</a>
            <a href="/?league=premier-league" className="btn secondary">Premier League</a>
          </div>
        </div>
        <img
          src="/hero-jersey.jpg"
          alt="Featured jersey"
          className="pointer-events-none absolute -right-10 top-0 hidden h-full max-h-[420px] object-cover opacity-70 sm:block"
        />
      </section>

      {/* Category chips (inline) */}
      <div className="no-scrollbar -mx-1 -mt-3 flex gap-2 overflow-x-auto px-1">
        {[
          { label: 'Premier League', key: 'league', value: 'premier-league' },
          { label: 'La Liga', key: 'league', value: 'la-liga' },
          { label: 'National Teams', key: 'league', value: 'national-teams' },
          { label: 'Retro', key: 'tag', value: 'retro' },
          { label: 'Kids', key: 'tag', value: 'kids' },
        ].map((c) => {
          const next = new URLSearchParams(qs)
          next.set(c.key, c.value)
          const active = qs.get(c.key) === c.value
          return (
            <a
              key={`${c.key}:${c.value}`}
              href={`/?${next.toString()}`}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
                active
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-neutral-300 dark:border-neutral-700'
              }`}
            >
              {c.label}
            </a>
          )
        })}
        {qs.size > 0 && (
          <a href="/" className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700">
            Clear
          </a>
        )}
      </div>

      {/* Section header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight">
          {q ? `Search: “${q}”` : league ? league.replace('-', ' ') : tag ? tag : 'Latest Jerseys'}
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {q || league || tag ? 'Results' : 'Fresh drops and fan favourites—handpicked for Nepal.'}
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-neutral-200/70 p-8 text-center text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
          No jerseys found. Try a different search or filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </section>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-neutral-200/70 p-3 shadow-soft dark:border-neutral-800">
      <div className="aspect-square w-full animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  )
}
