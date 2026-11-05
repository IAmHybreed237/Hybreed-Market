import type { Metadata } from "next"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { VENDOR_URL } from "@/lib/vendor"

export const metadata: Metadata = {
  title: "Hybreed Partners — Start selling",
  description:
    "Sign up to start selling on Hybreed, Cameroon's trusted marketplace.",
}

const ExternalGlyph = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M14 4h6v6" />
    <path d="M20 4L9 15" />
    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
)

type ToolItem = { img: string; title: string; desc: string; href: string }

const TOOLS: { title: string; items: ToolItem[] }[] = [
  {
    title: "Knowledge base",
    items: [
      { img: "courses", title: "Free seller courses", desc: "Guides and webinars for beginners", href: "/sell" },
      { img: "offer", title: "Seller offer", desc: "Detailed terms and conditions for selling on Hybreed", href: `${VENDOR_URL}/register` },
      { img: "help", title: "Help center", desc: "FAQs and articles to guide you along the way", href: "https://wa.me/" },
    ],
  },
  {
    title: "Analytics and logistics",
    items: [
      { img: "search", title: "Search analytics", desc: "See what buyers look for and turn trends into sales", href: VENDOR_URL },
      { img: "profit", title: "Profit calculator", desc: "Estimate the cost of each item and your expected profit", href: VENDOR_URL },
      { img: "analytics", title: "Business analytics", desc: "Study what buyers like and buy on Hybreed", href: VENDOR_URL },
    ],
  },
  {
    title: "Security",
    items: [
      { img: "safe", title: "Your account is safe with us", desc: "We block fake websites and prevent unauthorized access", href: VENDOR_URL },
      { img: "escrow", title: "Escrow-protected payouts", desc: "Your money is held safely until the buyer confirms delivery", href: "/sell" },
      { img: "scam", title: "Protect yourself from scammers", desc: "Learn to recognize scams and keep your business secure", href: "https://wa.me/" },
    ],
  },
]

const ToolRow = ({ item }: { item: ToolItem }) => {
  const inner = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/images/partners/tools/${item.img}.png`}
        alt=""
        aria-hidden
        draggable={false}
        className="h-[54px] lg:h-[60px] w-auto shrink-0 object-contain"
      />
      <span className="min-w-0">
        <span className="block text-[15px] lg:text-[16px] font-semibold leading-[20px] text-[#1F1F23]">
          {item.title}
        </span>
        <span className="block mt-0.5 text-[13px] lg:text-[14px] leading-[18px] text-[#8A8A96]">
          {item.desc}
        </span>
      </span>
    </>
  )
  const cls =
    "flex items-center gap-4 rounded-2xl -mx-2 px-2 py-2 hover:bg-white/70 transition-colors"
  return item.href.startsWith("/") ? (
    <LocalizedClientLink href={item.href} className={cls}>
      {inner}
    </LocalizedClientLink>
  ) : (
    <a href={item.href} className={cls}>
      {inner}
    </a>
  )
}

const HeroArt = () => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="/images/partners/bear-box.png"
    alt=""
    aria-hidden
    draggable={false}
    className="w-[220px] md:w-[300px] lg:w-[420px] h-auto mx-auto lg:mr-0 select-none"
  />
)

export default function PartnersPage() {
  return (
    <main className="w-full max-w-[1440px] mx-auto px-4 lg:px-6">
      {/* ===== SECTION 2 — welcome hero ===== */}
      <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 pt-8 pb-14 lg:pt-16 lg:pb-20">
        <HeroArt />
        <div className="lg:order-first max-w-[680px]">
          <h1 className="text-[34px] leading-[40px] lg:text-[48px] lg:leading-[52px] font-extrabold tracking-[-0.02em] text-[#1F1F23]">
            Welcome to Hybreed Partners!
          </h1>

          <p className="mt-4 text-[16px] lg:text-[17px] leading-[24px] text-[#1F1F23]">
            Sign up to start selling on Hybreed.
            <br />
            You'll need your national ID card, an active WhatsApp phone
            number and a Mobile Money or bank account.
          </p>

          <p className="mt-6 max-w-[640px] text-[15px] lg:text-[16px] leading-[24px] text-[#6B6B75]">
            We recommend that the account is created by the business owner or
            CEO. This will help you avoid issues if employees change. You can
            later add staff to your account and give them access to the tools
            they need.
          </p>

          <LocalizedClientLink
            href="/partners/signup"
            className="mt-8 inline-flex items-center justify-center w-full sm:w-auto h-[48px] lg:h-[44px] px-7 rounded-[14px] bg-[#1F1F23] text-white text-[16px] font-semibold hover:bg-[#34343c] active:scale-[0.98] transition"
          >
            Sign Up
          </LocalizedClientLink>

          <div className="mt-7 flex flex-wrap items-center gap-x-9 gap-y-3 text-[#2563EB]">
            <LocalizedClientLink
              href="/sell"
              className="inline-flex items-center gap-1.5 text-[15px] lg:text-[16px] hover:underline"
            >
              How to start selling on Hybreed
              <ExternalGlyph />
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/partners/signup"
              className="inline-flex items-center gap-1.5 text-[15px] lg:text-[16px] hover:underline"
            >
              New seller registration
              <ExternalGlyph />
            </LocalizedClientLink>
          </div>
        </div>
      </section>

      {/* ===== SECTION 3 — seller tools grid ===== */}
      <section id="tools" className="scroll-mt-[76px] pb-16 lg:pb-24">
        <h2 className="text-[26px] lg:text-[32px] font-extrabold tracking-[-0.02em] text-[#1F1F23]">
          Seller tools
        </h2>
        <div className="mt-6 lg:mt-8 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8">
          {TOOLS.map((group) => (
            <div key={group.title}>
              <h3 className="text-[18px] lg:text-[20px] font-bold text-[#1F1F23]">
                {group.title}
              </h3>
              <div className="mt-4 flex flex-col gap-1.5">
                {group.items.map((item) => (
                  <ToolRow key={item.title} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
