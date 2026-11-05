"use client"

import { useState } from "react"

const Star = ({ filled }: { filled: boolean }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "#F59E0B" : "#E4E4EA"} aria-hidden>
    <path d="M12 2l3 6.3L22 9.3l-5 4.9L18.2 21 12 17.8 5.8 21 7 14.2 2 9.3l7-1z" />
  </svg>
)

const Stars = ({ n }: { n: number }) => (
  <span className="inline-flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} filled={i <= n} />
    ))}
  </span>
)

type Review = {
  name: string
  date: string
  rating: number
  text: string
  pros?: string[]
  cons?: string[]
  size?: string
}

const REVIEWS: Review[] = [
  {
    name: "Ngong E.",
    date: "18 October",
    rating: 5,
    size: "EU 43",
    text: "The shoes look even better in person. The suede is soft and the red sole really pops — people keep asking where I got them. Delivery to Buea was next day.",
    pros: ["nice look", "high quality", "fast delivery"],
  },
  {
    name: "Fotso B.",
    date: "12 October",
    rating: 5,
    size: "EU 42",
    text: "Very clean pair. Fits true to size on my foot. The spikes are well fixed, nothing loose. Seller packed it properly in the box.",
    pros: ["good fit", "high quality", "well packaged"],
  },
  {
    name: "Aisha M.",
    date: "03 October",
    rating: 4,
    size: "EU 41",
    text: "Bought for my brother, he loves them. Only issue — the toe box is stiff because of the spikes, so if your foot is wide go half a size up. Otherwise great quality.",
    pros: ["nice look", "high quality"],
    cons: ["rigid toe box"],
  },
  {
    name: "Kamga D.",
    date: "21 September",
    rating: 5,
    size: "EU 44",
    text: "Wearing them to events — they look premium and the sole grip is solid. Escrow payment made me comfortable buying. Gaya Shopping responded fast when I asked about sizing.",
    pros: ["comfortable", "nice look", "responsive seller"],
  },
  {
    name: "Etienne N.",
    date: "09 September",
    rating: 3,
    size: "EU 42",
    text: "Quality is good but they run slightly large on me. I should have taken 41. Exchange process was smooth though.",
    cons: ["runs large"],
  },
  {
    name: "Manka'a R.",
    date: "28 August",
    rating: 5,
    size: "EU 40",
    text: "These are my favourite shoes now. Suede brush keeps them fresh. Red bottom still bright after a month — just wipe it.",
    pros: ["nice look", "durable", "high quality"],
  },
]

const PHOTO_INDICES = [0, 1, 3]

export const WbProductReviews = ({ images }: { images: string[] }) => {
  const [tab, setTab] = useState<"reviews" | "questions">("reviews")

  return (
    <section id="reviews" className="mt-12 scroll-mt-24">
      {/* tabs — like the reference: title + counts */}
      <div className="flex items-baseline gap-6 md:gap-8 border-b border-[#E4E4EA]">
        {(
          [
            ["reviews", "Reviews", "128"],
            ["questions", "Questions", "14"],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`pb-3 text-[17px] md:text-[19px] font-semibold transition-colors relative ${
              tab === key ? "text-[#1F1F23]" : "text-[#8A8A96] hover:text-[#1F1F23]"
            }`}
          >
            {label}
            <span className="ml-2 text-[14px] font-semibold">{count}</span>
            {tab === key && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-[2.5px] bg-[#2563EB] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {tab === "reviews" ? (
        <>
          {/* summary row */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mt-6">
            <div className="flex items-center gap-3">
              <p className="text-[#1F1F23] text-[36px] font-bold leading-none">4.8</p>
              <div>
                <Stars n={5} />
                <p className="text-[13px] text-[#8A8A96] mt-0.5">128 ratings</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 bg-[#2563EB]/10 text-[#2563EB] rounded-lg px-3 py-1.5 text-[13px] font-semibold">
              Users&apos; choice
            </span>
            <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#1F1F23]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M20 6L9 17l-5-5"/></svg>
              83% True to size
            </span>
          </div>

          {/* photo strip */}
          {images.length > 0 && (
            <div className="mt-6">
              <p className="text-[15px] font-semibold text-[#1F1F23] mb-2.5">
                All photos and videos
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {PHOTO_INDICES.filter((i) => images[i]).map((i) => (
                  <span
                    key={i}
                    className="shrink-0 w-[84px] aspect-[3/4] rounded-xl overflow-hidden bg-[#F6F6F9]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={images[i]} alt="" className="w-full h-full object-cover" />
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* reviews carousel — horizontal scroll like the reference */}
          <div
            className="mt-6 flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide"
            style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
          >
            {REVIEWS.map((r, i) => (
              <article
                key={i}
                className="bg-white rounded-[16px] p-5 w-[300px] md:w-[420px] h-[190px] shrink-0 snap-start flex flex-col overflow-hidden border border-[#E4E4EA] shadow-[0_1px_4px_rgba(31,31,35,0.08)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-[#F0F0F3] text-[#8A8A96] text-[13px] font-bold flex items-center justify-center shrink-0">
                      {r.name[0]}
                    </span>
                    <p className="text-[14px] font-semibold text-[#1F1F23] truncate">
                      {r.name}
                    </p>
                  </div>
                  <span className="text-[12px] text-[#8A8A96] shrink-0">{r.date}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Stars n={r.rating} />
                  {r.size && (
                    <span className="text-[12px] text-[#8A8A96]">Size: {r.size}</span>
                  )}
                </div>
                {(r.pros || r.cons) && (
                  <div className="flex flex-wrap gap-x-3 mt-1.5">
                    {r.pros && (
                      <p className="text-[12px] text-[#1F1F23]">
                        <span className="text-[#16A34A] font-semibold">Pros: </span>
                        {r.pros.join(", ")}
                      </p>
                    )}
                    {r.cons && (
                      <p className="text-[12px] text-[#1F1F23]">
                        <span className="text-[#EF4444] font-semibold">Cons: </span>
                        {r.cons.join(", ")}
                      </p>
                    )}
                  </div>
                )}
                <p className="text-[13px] leading-[18px] text-[#1F1F23]/80 mt-1.5 line-clamp-3">
                  {r.text}
                </p>
              </article>
            ))}

            {/* "view all" end card — like WB's moreCard */}
            <button className="bg-white rounded-[16px] w-[200px] h-[190px] shrink-0 snap-start flex flex-col items-center justify-center gap-2 text-[#2563EB] border border-[#E4E4EA] shadow-[0_1px_4px_rgba(31,31,35,0.08)] hover:bg-[#F6F6F9] transition-colors">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              <span className="text-[15px] font-semibold">All 128 reviews</span>
            </button>
          </div>
        </>
      ) : (
        /* questions tab placeholder — same tab structure as the reference */
        <div className="mt-6 flex flex-col gap-3">
          {[
            ["Manka'a R.", "Does the red sole fade?", "2 days ago", "1 answer"],
            ["Fotso B.", "Is it true to size for wide feet?", "5 days ago", "3 answers"],
            ["Aisha M.", "Does it come with the box?", "1 week ago", "2 answers"],
          ].map(([name, q, when, answers]) => (
            <div key={q} className="bg-white rounded-[16px] p-5 border border-[#E4E4EA] shadow-[0_1px_4px_rgba(31,31,35,0.08)]">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-semibold text-[#1F1F23]">{name}</p>
                <span className="text-[12px] text-[#8A8A96]">{when}</span>
              </div>
              <p className="text-[14px] text-[#1F1F23]/80 mt-1.5">{q}</p>
              <p className="text-[13px] text-[#2563EB] mt-2">{answers}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
