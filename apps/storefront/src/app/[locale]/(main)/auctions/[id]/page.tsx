import Link from "next/link"
import { notFound } from "next/navigation"
import { getAuction, auctionPrice } from "@/lib/data/auctions"
import { retrieveCustomer } from "@/lib/data/customer"
import { convertToLocale } from "@/lib/helpers/money"
import { BidForm } from "@/components/sections/AuctionDetail/BidForm"

export const dynamic = "force-dynamic"

export default async function AuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id, locale } = await params
  const data = await getAuction(id)
  if (!data) return notFound()

  const { auction, bids } = data
  const customer = await retrieveCustomer()

  const price = auctionPrice(auction.current_price ?? auction.starting_price)
  const start = auctionPrice(auction.starting_price)
  const increment = auctionPrice(auction.bid_increment)
  const minBid =
    auction.current_price != null ? price + increment : start
  const deposit = auction.deposit_amount
    ? auctionPrice(auction.deposit_amount)
    : null

  const fmt = (v: number) =>
    convertToLocale({ amount: v, currency_code: auction.currency_code })

  const endMs = new Date(auction.end_at).getTime()
  const live = auction.status === "live" && endMs > Date.now()

  return (
    <main className="container py-8 max-w-3xl">
      <Link
        href={`/${locale}/auctions`}
        className="text-sm text-gray-500 hover:text-black"
      >
        ← All auctions
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="heading-xl uppercase">{auction.title}</h1>
          {auction.description && (
            <p className="text-gray-600 mt-2">{auction.description}</p>
          )}
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
            live
              ? "bg-green-100 text-green-800"
              : auction.status === "ended"
                ? "bg-gray-100 text-gray-600"
                : "bg-blue-100 text-blue-800"
          }`}
        >
          {auction.status}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500">
              {auction.current_price != null ? "Current bid" : "Starting bid"}
            </p>
            <p className="text-3xl font-bold">{fmt(price)}</p>
            <p className="text-sm text-gray-500 mt-1">
              Increment: {fmt(increment)} · Ends{" "}
              {new Date(auction.end_at).toLocaleString()}
            </p>
            {auction.winner_id && (
              <p className="text-sm mt-2">
                Winner: <span className="font-medium">{auction.winner_id}</span>{" "}
                at {fmt(auctionPrice(auction.current_price))}
              </p>
            )}
          </div>

          {live && (
            <BidForm
              auctionId={auction.id}
              minBid={minBid}
              currency={auction.currency_code}
              depositAmount={deposit}
              isAuthed={!!customer}
              loginUrl={`/${locale}/login`}
            />
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Bid history
          </h2>
          {bids.length === 0 ? (
            <p className="text-sm text-gray-500">No bids yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
              {bids.map((b) => (
                <li
                  key={b.id}
                  className="flex justify-between px-4 py-2 text-sm"
                >
                  <span className="text-gray-500">{b.bidder_id}</span>
                  <span className="font-medium">
                    {fmt(auctionPrice(b.amount as never))}
                  </span>
                  <span className="text-xs text-gray-400">
                    {b.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
