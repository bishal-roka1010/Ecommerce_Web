import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-black to-black text-white">
      <div className="relative z-10 px-8 py-12 sm:px-12 sm:py-16">
        <p className="text-xs uppercase tracking-widest opacity-80">New Season Drop</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">
          Authentic Club & Country Jerseys
        </h1>
        <p className="mt-3 max-w-xl text-sm opacity-90">
          Official quality. Fast delivery across Nepal. Sizes XS–XXL.
        </p>
        <div className="mt-5 flex gap-3">
          <Link to="/?tag=new" className="btn bg-white text-black hover:bg-neutral-200">Shop New Arrivals</Link>
          <Link to="/?league=premier-league" className="btn secondary">Premier League</Link>
        </div>
      </div>
      <img
        src="/hero-jersey.jpg"
        alt="Featured jersey"
        className="pointer-events-none absolute -right-10 top-0 hidden h-full max-h-[420px] object-cover opacity-70 sm:block"
      />
    </section>
  )
}
