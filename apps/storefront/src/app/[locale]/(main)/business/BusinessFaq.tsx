"use client"

import { useState } from "react"

const items = [
  {
    q: "Who can buy as a business on Hybreed?",
    a: "Any registered business, sole proprietor, company, or organization in Cameroon - shops, offices, restaurants, startups, schools, and NGOs. You just need your business details to get verified.",
  },
  {
    q: "How do I place an order as a business?",
    a: "Register your business on this page or in your profile, switch to your business account, then shop as usual - add items to your cart and check out. When paying, choose business payment and we'll issue an invoice or charge your corporate method.",
  },
  {
    q: "Which items can I buy as a business?",
    a: "Almost everything on Hybreed. A few categories are personal-use only - when you switch to business mode, those items are marked as unavailable for business purchase.",
  },
  {
    q: "What delivery options are available?",
    a: "The same as regular purchases: pickup at a Hybreed pickup point, courier delivery, or pickup from the seller's location. You'll see the available options in your cart at checkout.",
  },
  {
    q: "How do I pay for a business order?",
    a: "Pay by bank transfer or corporate Mobile Money using an invoice we generate at checkout - you have 7 days to pay, and prices are fixed during that time. You can also pay instantly with a corporate card or MoMo, which holds prices for 3 hours.",
  },
  {
    q: "Can prices change or items sell out while I'm paying an invoice?",
    a: "Prices are locked when you place the order: 7 days for invoice payments, 3 hours for card or MoMo. If you don't pay in time, the order is cancelled. If an item sells out after payment, we refund the amount to the account it came from within 10 days.",
  },
  {
    q: "What documents do I get for my records?",
    a: "Every business order comes with an invoice before payment and a receipt after delivery. Download them anytime from Orders or Documents in your business profile - they're suitable for your accounting and tax filings.",
  },
  {
    q: "Can I buy in bulk or request wholesale prices?",
    a: "Yes. Submit a sourcing request from this page or contact Support - tell us what you need and the quantities, and we'll respond within 3 working days.",
  },
]

export const BusinessFaq = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <div className="max-w-[860px] mx-auto flex flex-col gap-2.5">
      {items.map((it, i) => {
        const open = openIdx === i
        return (
          <div
            key={it.q}
            className="bg-white rounded-[20px] overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenIdx(open ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-5 md:px-7 py-4 md:py-5 text-left"
              aria-expanded={open}
            >
              <span className="text-[#1F1F23] text-[16px] md:text-[18px] font-semibold leading-snug">
                {it.q}
              </span>
              <span
                className={`shrink-0 w-9 h-9 rounded-full bg-[#F0F0F3] flex items-center justify-center text-[#1F1F23] transition-transform duration-200 ${
                  open ? "rotate-180" : ""
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="6 9 12 15 18 9" /></svg>
              </span>
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="px-5 md:px-7 pb-5 text-[15px] leading-[22px] text-[#1F1F23]/70">
                  {it.a}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
