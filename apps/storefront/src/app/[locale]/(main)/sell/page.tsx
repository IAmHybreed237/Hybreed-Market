import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sell on Hybreed, Grow your business",
  description:
    "Start selling on Hybreed, Cameroon's trusted marketplace. Reach buyers in Buea and beyond.",
}

const SELLER_URL = "http://localhost:9000/seller/register"

export default function SellPage() {
  return (
    <main className="w-full bg-[#F5F5F7]">
      {/* hide the marketplace header + footer on this landing page */}
      <style>{`
        header, [data-testid="header-shell"], .main-header-spacer, .mobile-header-spacer { display: none !important }
        [data-testid="footer"] { display: none }
      `}</style>

      {/* ===== TOP: nav + hero in one blue panel ===== */}
      <section
        className="w-full"
        style={{
          background:
            "linear-gradient(135deg,#2563EB 0%,#6D28D9 25%,#C026D3 45%,#F59E0B 65%,#F97316 85%,#FBBF24 100%)",
        }}
      >
        {/* landing nav, transparent on hero, like the reference */}
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="Hybreed" className="h-9 w-auto" />
            <span className="text-white font-bold text-xl">Partners</span>
          </div>
          <div className="hidden md:flex items-center gap-8 ml-12">
            <a href="#steps" className="text-white/95 text-[15px] font-semibold hover:text-white">
              Where to start
            </a>
            <a href="#skills" className="text-white/95 text-[15px] font-semibold hover:text-white">
              Learn
            </a>
            <a href="#stories" className="text-white/95 text-[15px] font-semibold hover:text-white">
              Success stories
            </a>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <a
              href="http://localhost:9000/seller/login"
              className="h-10 px-5 rounded-xl bg-[#60A5FA] text-white text-[15px] font-bold flex items-center hover:bg-[#3B82F6]"
            >
              Sign in
            </a>
            <a
              href={SELLER_URL}
              className="h-10 px-5 rounded-xl bg-white text-[#1F1F23] text-[15px] font-bold flex items-center hover:bg-blue-50"
            >
              Start now
            </a>
          </div>
        </div>

        {/* ===== SECTION 1, HERO ===== */}
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="relative overflow-hidden min-h-[440px] flex items-center">
            {/* copy */}
            <div className="max-w-[55%] py-10">
              <h1 className="text-white" style={{ fontSize: 48, fontWeight: 560, lineHeight: "60px" }}>
                Success stories begin with people just like you
              </h1>
            <p className="text-white mt-4" style={{ fontSize: 22, fontWeight: 350, lineHeight: "28px" }}>
              Start selling on Hybreed. Reach buyers across Cameroon with
              secure payments and trusted delivery.
            </p>
            <a
              href={SELLER_URL}
              className="inline-flex items-center gap-2 mt-8 h-[52px] px-8 rounded-2xl bg-white text-[#2563EB] text-base font-bold hover:bg-blue-50 transition-colors"
            >
              Start now
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
          </div>

          {/* hero image, right side */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/sell-hero.png"
            alt=""
            aria-hidden
            className="absolute right-[4%] bottom-0 h-[85%] w-auto max-w-[46%] object-contain"
          />
          </div>
        </div>

        {/* ===== SECTION 2, STATS BAND (inside the gradient panel) ===== */}
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-white/25 pt-8 pb-12">
            {[
              { n: "100%", l1: "ESCROW-PROTECTED", l2: "every order held until delivery is confirmed" },
              { n: "Same-day", l1: "DELIVERY IN BUEA", l2: "local sellers, same-day fulfilment" },
              { n: "XAF", l1: "NATIVE PRICING", l2: "Mobile Money and cash on delivery built in" },
              { n: "Buea", l1: "LAUNCH CITY", l2: "expanding city by city across Cameroon" },
            ].map((s) => (
              <div key={s.l1}>
                <p className="text-white" style={{ fontSize: 38, fontWeight: 680, lineHeight: "60px" }}>{s.n}</p>
                <p className="text-[13px] font-bold uppercase tracking-wide text-white mt-2">
                  {s.l1}
                </p>
                <p className="text-sm text-white/80 mt-1">{s.l2}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 3, LEARN NEW SKILLS ===== */}
      <section id="skills" className="max-w-[1400px] mx-auto px-6 py-14">
        {/* big card: heading top-left, smaller course card overlaps on the right */}
        <div className="relative md:max-w-[1100px] md:mx-auto">
          <div className="rounded-[28px] min-h-[660px] p-8 md:p-12 md:max-w-[78%]" style={{ background: "linear-gradient(135deg,#2563EB 0%,#6D28D9 25%,#C026D3 45%,#F59E0B 65%,#F97316 85%,#FBBF24 100%)" }}>
            <h2 className="text-white max-w-[46%]" style={{ fontSize: 40, fontWeight: 560, lineHeight: "48px" }}>
              Learn new skills to start and grow your business
            </h2>
          </div>
          {/* overlapping course card, pushed right, sticking out */}
          <div className="md:absolute md:top-1/2 md:-translate-y-1/2 md:right-[18px] mt-6 md:mt-0 md:w-[640px] md:min-h-[550px] bg-white rounded-[24px] p-8 shadow-lg">
            <p className="text-base text-black">Free beginner courses</p>
            <p className="text-black mt-1" style={{ fontSize: 48, fontWeight: 560, lineHeight: "60px" }}>PRO Hybreed</p>
            <p className="text-base text-black mt-3 leading-snug">
              Helpful guides walk you step by step through launching your
              business and starting to earn on Hybreed
            </p>
            <ul className="mt-5 divide-y divide-black/10">
              {[
                "How to list an item",
                "List items in bulk",
                "Seller analytics",
                "Build your brand",
              ].map((t) => (
                <li key={t}>
                  <a href="#" className="flex items-center justify-between py-3.5 text-base font-normal text-black hover:text-[#2563EB]">
                    {t}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8A8A96]"><polyline points="9 18 15 12 9 6" /></svg>
                  </a>
                </li>
              ))}
            </ul>
            <a href="#" className="inline-flex items-center gap-1.5 mt-5 h-10 px-6 rounded-full border-2 border-[#2563EB] bg-transparent text-[#2563EB] font-semibold text-[15px] hover:bg-[#DBEAFE] transition-colors">
              Browse all
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </a>
          </div>
        </div>
      </section>

      {/* ===== SECTION 4, 3 STEPS TO GET STARTED ===== */}
      <section id="steps" className="max-w-[1400px] mx-auto px-6 py-14">
        <div className="relative">
          {/* small accent card, top left, partially covered by the steps card */}
          <div
            className="w-[400px] h-[400px] rounded-[24px]"
            style={{ background: "linear-gradient(135deg,#2563EB 0%,#6D28D9 25%,#C026D3 45%,#F59E0B 65%,#F97316 85%,#FBBF24 100%)" }}
          />
          {/* steps card, overlaps the small card */}
          <div className="md:absolute md:top-[70px] md:left-[190px] md:right-0 mt-6 md:mt-0 bg-white rounded-[24px] p-8 md:p-10 shadow-sm min-h-[420px] flex flex-col md:flex-row md:gap-10">
            <h2 className="text-black md:max-w-[220px] shrink-0" style={{ fontSize: 40, fontWeight: 560, lineHeight: "48px" }}>
              3 steps to get started
            </h2>
            <div className="flex-1 divide-y divide-black/10 mt-8 md:mt-0">
              {[
                {
                  n: "01",
                  t: "Decide what you want to sell",
                  d: "Study market trends and shape your item range. Calculate the unit economics to make sure your items will be profitable, remember packaging, advertising, and other costs.",
                },
                {
                  n: "02",
                  t: "Choose a sales model",
                  d: "Pick how you store and deliver, same-day local delivery, pickup handoff, or escrowed courier delivery to buyers.",
                },
                {
                  n: "03",
                  t: "Create an account and list your items",
                  d: "Set up your business and sign up on the platform, then publish your first listings.",
                },
              ].map((s) => (
                <div key={s.n} className="flex gap-6 py-6 first:pt-0 last:pb-0">
                  <p className="text-[27px] font-bold text-black shrink-0 w-14">{s.n}</p>
                  <div>
                    <p className="text-[27px] font-bold text-black">{s.t}</p>
                    <p className="text-lg text-black mt-1.5 leading-snug">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 5 - FINAL CTA ===== */}
      <section className="max-w-[1400px] mx-auto px-6 pb-16">
        <div
          className="rounded-[28px] px-8 md:px-14 py-16 flex flex-col items-center text-center gap-8"
          style={{ background: "linear-gradient(180deg,#f7f7fa,#f1f1f5)" }}
        >
          <h2 className="text-black" style={{ fontSize: 40, fontWeight: 560, lineHeight: "48px" }}>
            Your journey to success starts here
          </h2>
          <a
            href={SELLER_URL}
            className="h-[56px] px-10 rounded-2xl bg-[#2563EB] text-white text-lg font-bold flex items-center gap-2 hover:bg-[#1D4ED8] transition-colors"
          >
            Start now
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </a>
        </div>
      </section>
    </main>
  )
}
