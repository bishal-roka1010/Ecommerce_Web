export default function Contact(){
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-extrabold tracking-tight">Contact</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">DM us on Instagram/Facebook or email support@jerseyempire.example</p>
      <form className="card space-y-3 max-w-lg">
        <input className="input" placeholder="Your email" />
        <textarea className="input" placeholder="How can we help?" rows={4} />
        <button className="btn w-full">Send</button>
      </form>
    </section>
  )
}
