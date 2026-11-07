import type { Metadata } from "next"
import { BusinessSignupForm } from "./BusinessSignupForm"
import { BusinessFaq } from "./BusinessFaq"

export const metadata: Metadata = {
  title: "Shop on Hybreed as a business",
  description:
    "Buy for your company on Hybreed - business payment, invoices and receipts for your accounting, and bulk deals from verified sellers.",
}

export default function BusinessPage() {
  return (
    <main className="font-onest w-full bg-[#F5F5F7] pb-20">
      {/* ===== SECTION 1 - HERO (full-bleed, rounded bottom, form card overlaps edge) ===== */}
      <section className="header-gradient relative w-full h-[480px] md:h-[523px] lg:h-[620px] rounded-b-[40px]">
        {/* copy */}
        <div className="relative z-[2] h-full max-w-[1172px] mx-auto px-4 md:px-8 pt-[110px] md:pt-20 text-center md:text-left">
          <h1
            className="text-white tracking-[0.88px]"
            style={{
              fontSize: "clamp(42px, 6.2vw, 88px)",
              fontWeight: 650,
              lineHeight: 0.98,
            }}
          >
            Shop
            <br />
            on&nbsp;Hybreed
            <br />
            as&nbsp;a&nbsp;business
          </h1>
          <p className="text-white/90 text-[14px] md:text-[17px] leading-[20px] md:leading-[22px] max-w-[400px] mt-4 md:mt-9 mx-auto md:mx-0">
            B2B items with payment by invoice, receipts for your accounting,
            and bulk deals from verified sellers
          </p>
        </div>

        {/* signup form card - straddles the hero's bottom edge */}
        <div className="absolute z-[3] left-0 right-0 -bottom-[52px] px-3 flex justify-center">
          <div className="relative w-full max-w-[730px]">
            {/* grey legal tab hanging under the card */}
            <div className="absolute left-0 right-0 top-full -translate-y-[26px] bg-[#E7E7EA] rounded-b-[24px] px-5 pt-10 pb-3 text-[12px] md:text-[13px] text-[#8A8A96] leading-snug">
              By proceeding, you agree to the{" "}
              <a href="#" className="text-[#2563EB] hover:underline">
                General Sales Terms
              </a>{" "}
              and{" "}
              <a href="#" className="text-[#2563EB] hover:underline">
                Data Processing Terms
              </a>
            </div>
            <BusinessSignupForm />
          </div>
        </div>
      </section>

      {/* ===== SECTION 2 - ADVANTAGES GRID ===== */}
      <section className="max-w-[1400px] mx-auto px-4 md:px-6 pt-[120px] md:pt-[130px]">
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 lg:h-[700px]">
          {/* big promo card - left half */}
          <div className="relative flex-1 overflow-hidden rounded-[28px] bg-[#DBEAFE] p-6 md:p-8 min-h-[360px] lg:min-h-0 flex flex-col">
            <div className="relative z-[1] flex flex-col gap-3 max-w-[75%]">
              <p className="text-[#1F1F23] text-[20px] md:text-[24px] font-semibold leading-[120%]">
                Sign up as a business and get 10% off your first order
              </p>
              <p className="text-[#1F1F23]/70 text-[14px] md:text-[15px] leading-[20px] max-w-[400px]">
                Offer valid until 31.12.2026. Maximum discount: 50 000 XAF
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/business-promo.png"
              alt=""
              aria-hidden
              className="absolute right-0 bottom-0 h-[75%] w-auto object-contain object-bottom"
            />
          </div>

          {/* right column: medium card + two small cards */}
          <div className="flex-1 flex flex-col gap-3 lg:gap-4">
            {/* medium card */}
            <div className="relative overflow-hidden rounded-[28px] bg-[#DBEAFE] p-6 md:p-8 min-h-[260px] lg:min-h-0 lg:h-1/2">
              <div className="relative z-[1] flex flex-col gap-3 max-w-[62%]">
                <p className="text-[#1F1F23] text-[20px] md:text-[24px] font-semibold leading-[120%]">
                  Convenient payment for your business
                </p>
                <p className="text-[#1F1F23]/70 text-[14px] md:text-[15px] leading-[20px]">
                  Pay by bank transfer or corporate Mobile Money. Pay by
                  invoice to fix prices for 7 days.
                </p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/business-wallet.png"
                alt=""
                aria-hidden
                className="absolute right-2 bottom-0 h-[70%] w-auto object-contain object-bottom"
              />
            </div>

            {/* two small cards */}
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 lg:h-1/2">
              {[
                {
                  t: "Save on taxes",
                  d: "Claim your 19.25% VAT deduction when you buy with proper invoices.",
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" aria-hidden><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
                  ),
                },
                {
                  t: "Documents for reporting",
                  d: "Download invoices and receipts from your account after every order.",
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
                  ),
                },
              ].map((c) => (
                <div
                  key={c.t}
                  className="relative flex-1 overflow-hidden rounded-[28px] bg-[#DBEAFE] p-6 min-h-[220px] lg:min-h-0"
                >
                  <div className="relative z-[1] flex flex-col gap-3 max-w-[78%]">
                    <p className="text-[#1F1F23] text-[18px] md:text-[20px] font-semibold leading-[120%]">
                      {c.t}
                    </p>
                    <p className="text-[#1F1F23]/70 text-[14px] leading-[20px]">
                      {c.d}
                    </p>
                  </div>
                  <span className="absolute bottom-5 right-5 w-16 h-16 rounded-full bg-[#2563EB] flex items-center justify-center">
                    {c.icon}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 3 - HOW IT WORKS ===== */}
      <section className="max-w-[1400px] mx-auto px-4 md:px-6 pt-16 md:pt-24">
        <h2 className="text-center text-[#1F1F23] text-[32px] md:text-[48px] font-semibold leading-[110%] mb-8">
          How it works
        </h2>
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
          {/* step 1 - add your business (dark card, cursor mock) */}
          <div className="relative flex-1 overflow-hidden rounded-[28px] bg-[#17255B] p-6 md:p-8 min-h-[420px] lg:min-h-0 lg:h-[520px] flex flex-col">
            <p className="text-white text-[22px] md:text-[24px] font-semibold leading-[120%]">
              Add your business on&nbsp;Hybreed
            </p>
            <p className="text-white/60 text-[14px] leading-[20px] mt-3 text-center md:text-center">
              Enter your business details, add employees, and wait for
              confirmation
            </p>
            <div className="mt-auto relative">
              <button className="relative z-[2] w-full h-12 rounded-2xl bg-[#2563EB] text-white text-[15px] font-semibold flex items-center justify-between px-5">
                Add
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              {/* cursor arrow mock */}
              <svg width="34" height="34" viewBox="0 0 24 24" className="absolute -bottom-8 right-6 rotate-[-8deg] drop-shadow-lg" aria-hidden>
                <path d="M4 2l16 9.5-7 1.8-3.5 7z" fill="#fff" stroke="#1F1F23" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* step 2 - switch to business account (frosted chip mock) */}
          <div className="relative flex-1 overflow-hidden rounded-[28px] bg-white p-6 md:p-8 min-h-[420px] lg:min-h-0 lg:h-[520px] flex flex-col">
            <div className="rounded-[24px] bg-[#F0F0F3] flex items-center gap-3 px-4 py-3.5">
              <span className="w-12 h-12 rounded-full bg-[#2563EB]/15 flex items-center justify-center shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-[#1F1F23] leading-[18px]">
                  Your business
                </span>
                <span className="inline-flex items-center gap-1 text-[14px] text-[#1F1F23]/70 leading-[20px]">
                  Buy as business
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="9 18 15 12 9 6"/></svg>
                </span>
              </span>
            </div>
            <div className="mt-auto">
              <p className="text-[#1F1F23] text-[22px] md:text-[24px] font-semibold leading-[120%]">
                Switch to business account
              </p>
              <p className="text-[#1F1F23]/50 text-[14px] leading-[20px] mt-3">
                You can do this in{" "}
                <span className="text-[#2563EB] border-b-2 border-dotted border-[#2563EB]">
                  your&nbsp;account
                </span>{" "}
                or in your cart at checkout
              </p>
            </div>
          </div>

          {/* step 3 - pickup / delivery (order chip mock) */}
          <div className="relative flex-1 overflow-hidden rounded-[28px] bg-white p-6 md:p-8 min-h-[420px] lg:min-h-0 lg:h-[520px] flex flex-col">
            <p className="text-[#1F1F23] text-[22px] md:text-[24px] font-semibold leading-[120%]">
              Pick up your order at a pickup point or have it delivered
            </p>
            <p className="text-[#1F1F23]/50 text-[14px] leading-[20px] mt-3">
              Receive your orders just like regular purchases on Hybreed
            </p>
            <div className="mt-auto">
              <div className="rounded-[20px] bg-[#F0F0F3] px-4 py-3.5 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-[#16A34A]/15 flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-[#1F1F23] leading-[18px]">
                    Order #4821
                  </span>
                  <span className="block text-[13px] text-[#16A34A] leading-[18px]">
                    Ready for pickup - Buea Town
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 4 - SOURCING REQUEST BANNER ===== */}
      <section className="max-w-[1400px] mx-auto px-4 md:px-6 pt-16 md:pt-24">
        <div className="relative rounded-[28px] bg-[#DBEAFE] p-6 md:p-10 min-h-[260px] md:min-h-[300px] flex flex-col justify-center">
          <div className="relative z-[1] max-w-[420px] flex flex-col gap-3">
            <h2 className="text-[#1F1F23] text-[24px] md:text-[28px] font-semibold leading-[120%]">
              Wholesale &amp; bulk items for your business
            </h2>
            <p className="text-[#1F1F23]/70 text-[15px] leading-[22px]">
              Submit a sourcing request or contact our Support. We&apos;ll get
              back to you within 3 working days.
            </p>
            <a
              href="/user/messages"
              className="mt-3 inline-flex w-fit items-center justify-center h-12 px-7 rounded-2xl bg-[#17255B] text-white text-[15px] font-semibold hover:bg-[#0F1B45] transition-colors"
            >
              Submit Request
            </a>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/business-promo.png"
            alt=""
            aria-hidden
            className="absolute right-4 md:right-16 -bottom-[72px] md:-bottom-[96px] h-[170px] md:h-[260px] w-auto object-contain"
          />
        </div>
      </section>

      {/* ===== SECTION 5 - FAQ ===== */}
      <section className="max-w-[1400px] mx-auto px-4 md:px-6 pt-24 md:pt-28">
        <h2 className="text-center text-[#1F1F23] text-[32px] md:text-[48px] font-semibold leading-[110%] mb-8">
          Questions &amp; answers
        </h2>
        <BusinessFaq />
      </section>
    </main>
  )
}
