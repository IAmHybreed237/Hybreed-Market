import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

const columns = [
  {
    title: "For shoppers",
    links: [
      { label: "Help & FAQ", href: "/user" },
      { label: "Track order", href: "/user/orders" },
      { label: "Delivery & pickup", href: "/user/addresses" },
      { label: "Buyer protection", href: "/user" },
      { label: "Shop as a business", href: "/categories" },
      { label: "Legal information", href: "/user" },
      { label: "How we handle your data", href: "/user" },
      { label: "Safety guide", href: "/user" },
    ],
  },
  {
    title: "For sellers & partners",
    links: [
      { label: "Sell on Hybreed", href: "http://localhost:9000/seller/register" },
      { label: "Open a pickup point", href: "/categories" },
      { label: "Offer warehouse space", href: "/categories" },
      { label: "Deliver orders", href: "/categories" },
      { label: "Partner with us", href: "http://localhost:9000/seller/register" },
    ],
  },
  {
    title: "Our services",
    links: [
      { label: "Secondhand", href: "/categories" },
      { label: "Auctions", href: "/categories" },
      { label: "Wanted", href: "/categories" },
      { label: "Deals", href: "/categories" },
      { label: "Gift cards", href: "/user" },
      { label: "Hybreed Travel", href: "/categories" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/user" },
      { label: "Press", href: "/user" },
      { label: "Contact", href: "/user" },
      { label: "Jobs at Hybreed", href: "/user" },
      { label: "Report fraud", href: "/user" },
      { label: "Social networks", href: "/user" },
    ],
  },
  {
    title: "App",
    links: [{ label: "Android & iOS - coming soon", href: "/user" }],
  },
]

export function Footer() {
  return (
    <footer className="bg-white border-t border-black/[0.06] mt-10" data-testid="footer">
      <div className="max-w-[1400px] mx-auto px-[5px] lg:px-10 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {columns.map((col) => (
            <nav key={col.title} aria-label={`${col.title} links`}>
              <h3 className="text-[17px] font-semibold text-[#1F1F23] mb-4">
                {col.title}
              </h3>
              <ul className="space-y-1.5">
                {col.links.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith("http") ? (
                      <a href={href} className="text-[18px] text-[#8A8A96] hover:text-[#2563EB] transition-colors">
                        {label}
                      </a>
                    ) : (
                      <LocalizedClientLink
                        href={href}
                        className="text-[18px] text-[#8A8A96] hover:text-[#2563EB] transition-colors"
                      >
                        {label}
                      </LocalizedClientLink>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* social + app row */}
        <div className="flex items-center gap-4 mt-10">
          <p className="text-sm text-[#8A8A96]">Social</p>
          <div className="flex gap-3">
            {["Instagram", "Telegram", "WhatsApp"].map((s) => (
              <a
                key={s}
                href="#"
                className="w-9 h-9 rounded-full bg-[#F0F0F3] text-[#6B6B76] flex items-center justify-center text-xs font-semibold hover:bg-[#DBEAFE] hover:text-[#2563EB] transition-colors"
                aria-label={s}
              >
                {s[0]}
              </a>
            ))}
          </div>
          <p className="text-sm text-[#8A8A96] ml-auto">App - coming soon</p>
        </div>

        {/* copyright */}
        <div className="mt-8 pt-6 border-t border-black/[0.06] flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-sm text-[#8A8A96]">
            © 2026 Hybreed - Marketplace for Cameroon
          </p>
          <p className="text-xs text-[#8A8A96]">
            Every order protected by Hybreed Escrow
          </p>
        </div>
      </div>
    </footer>
  )
}
