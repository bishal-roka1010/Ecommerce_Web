import { Link } from "react-router-dom"

export default function Landing() {
  return (
    <div className="space-y-14">
      {/* Stadium-style hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-black text-white">
        <div className="absolute inset-0">
          {/* optional background image; safe if missing */}
          <div
            aria-hidden
            className="absolute inset-0 bg-[url('/stadium-banner.jpg')] bg-cover bg-center opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        </div>

        <div className="relative z-10 px-8 py-16 text-center sm:py-24">
          <p className="text-xs uppercase tracking-widest text-white/80">Jersey Empire Nepal</p>
          <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">Gear Up for Glory</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/85 sm:text-base">
            Authentic club & country jerseys. Fast delivery across Nepal. Sizes XS–XXL.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/?tag=new" className="btn bg-white text-black hover:bg-neutral-200">Shop New Arrivals</Link>
            <Link to="/login" className="btn secondary">Sign in</Link>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          ["🚚 Fast Delivery", "3–5 days inside Nepal"],
          ["✅ 100% Authentic", "Quality you can trust"],
          ["💳 Easy Payments", "eSewa • Khalti • COD"],
        ].map(([title, sub]) => (
          <div key={title} className="rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-soft dark:border-neutral-800 dark:bg-neutral-900">
            <div className="text-base font-semibold">{title}</div>
            <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{sub}</div>
          </div>
        ))}
      </section>

      {/* Featured collections */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: "Premier League", href: "/?league=premier-league" },
          { label: "La Liga", href: "/?league=la-liga" },
          { label: "National Teams", href: "/?league=national-teams" },
        ].map((c) => (
          <Link
            key={c.label}
            to={c.href}
            className="group relative overflow-hidden rounded-2xl border border-neutral-200/70 bg-neutral-50 p-8 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="text-xl font-extrabold tracking-tight">{c.label}</div>
            <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Shop now →</div>
            <div
              aria-hidden
              className="pointer-events-none absolute right-0 top-0 h-full w-1/2 translate-x-6 bg-[url('/hero-jersey.jpg')] bg-cover bg-center opacity-20 transition-transform duration-300 group-hover:translate-x-0"
            />
          </Link>
        ))}
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-neutral-200/70 p-8 text-center dark:border-neutral-800">
        <h3 className="text-xl font-extrabold">Never miss a drop</h3>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Get notified about restocks, new seasons, and sales.
        </p>
        <form className="mx-auto mt-4 flex max-w-md gap-2">
          <input className="input flex-1" placeholder="Enter your email" />
          <button className="btn">Join</button>
        </form>
      </section>
    </div>
  )
}
