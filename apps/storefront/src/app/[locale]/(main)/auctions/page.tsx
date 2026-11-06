import Link from "next/link"
import { listAuctions, auctionPrice } from "@/lib/data/auctions"
import { convertToLocale } from "@/lib/helpers/money"

export const dynamic = "force-dynamic"

const fmt = (v: unknown, currency: string) =>
  convertToLocale({ amount: auctionPrice(v as never), currency_code: currency })

const timeLeft = (endAt: string) => {
  const ms = new Date(endAt).getTime() - Date.now()
  if (ms <= 0) return "Ended"
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`
}

export default async function AuctionsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const auctions = await listAuctions()
  const live = auctions.filter((a) => a.status === "live")
  const upcoming = auctions.filter((a) => a.status === "scheduled")
  const ended = auctions.filter((a) => a.status === "ended")

  const Card = ({ a }: { a: (typeof auctions)[number] }) => (
    <Link
      href={`/${locale}/auctions/${a.id}`}
      className="block border border-gray-200 rounded-lg p-4 hover:border-black transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-lg">{a.title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {a.status === "live"
              ? `Current bid: ${fmt(a.current_price ?? a.starting_price, a.currency_code)}`
              : `Starts at: ${fmt(a.starting_price, a.currency_code)}`}
          </p>
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
            a.status === "live"
              ? "bg-green-100 text-green-800"
              : a.status === "scheduled"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-600"
          }`}
        >
          {a.status === "live" ? timeLeft(a.end_at) : a.status}
        </span>
      </div>
    </Link>
  )

  return (
    <main className="container py-8">
      <h1 className="heading-xl uppercase mb-8">Auctions</h1>

      {auctions.length === 0 && (
        <p className="text-gray-500">No auctions right now. Check back soon.</p>
      )}

      {live.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
            Live now
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {live.map((a) => (
              <Card key={a.id} a={a} />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
            Upcoming
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((a) => (
              <Card key={a.id} a={a} />
            ))}
          </div>
        </section>
      )}

      {ended.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
            Ended
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-70">
            {ended.map((a) => (
              <Card key={a.id} a={a} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
