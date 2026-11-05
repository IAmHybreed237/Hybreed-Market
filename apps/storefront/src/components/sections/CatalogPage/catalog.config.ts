export type CatalogTile = {
  id: string
  label: string
  img?: string
  href?: string
  soon?: boolean
}

export type FeatureTile = CatalogTile & {
  subtitle?: string
  artClass: string
  icon?: { bg: string; border?: string; text?: string; glyph?: "swap" | "cross" }
}

export const HERO = {
  title: ["Fresh", "finds"],
  bg: "#C13B38",
  titleColor: "#EBCFCB",
  img: "hero-finds",
  href: "/products",
} as const

export const FEATURES: FeatureTile[] = [
  {
    id: "secondhand",
    label: "secondhand",
    subtitle: "A second life for your things",
    img: "second-hand.png",
    href: "/sell",
    artClass: "w-[65%] right-[-24%] bottom-[-8%]",
    icon: { bg: "#2563EB", glyph: "swap" },
  },
  {
    id: "sell",
    label: "sell on\nhybreed",
    img: "mascot-gift",
    href: "/partners",
    artClass: "w-[66%] -right-[4%] -bottom-[22%]",
  },
  {
    id: "deals",
    label: "deals",
    subtitle: "New offers every day",
    img: "deals.png",
    href: "/categories",
    artClass: "w-[52%] right-0 bottom-0",
  },
  {
    id: "myhybreed",
    label: "my Hybreed",
    subtitle: "Benefits every day",
    img: "my-hybreed.png",
    href: "/user/my-hybreed",
    artClass: "w-[50%] right-0 bottom-0",
  },
]

export const PARTNERS: FeatureTile[] = [
  {
    id: "beauty",
    label: "Beauty",
    img: "beauty.png",
    soon: true,
    artClass: "w-[46%] right-0 bottom-0",
    icon: { bg: "#0F172A", border: "#F97316", text: "HB" },
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    img: "pharmacy.png",
    soon: true,
    artClass: "w-[40%] right-[3%] bottom-0",
    icon: { bg: "#2DD4BF", glyph: "cross" },
  },
]

// 22 grid items in display order; `soon` tiles open the coming-soon sheet
export const CATEGORIES: CatalogTile[] = [
  { id: "catalog", label: "Catalog", href: "/categories" },
  { id: "women", label: "Women", img: "women.png", soon: true },
  { id: "shoes", label: "Shoes", img: "shoes.png", href: "/categories/shoes" },
  { id: "kids", label: "Kids", img: "kids.png", soon: true },
  { id: "phones", label: "Phones", img: "phones.png", href: "/categories/phones" },
  { id: "electronics", label: "Electronics", img: "electronics.png", href: "/categories/electronics" },
  { id: "business", label: "For Business", img: "business.png", href: "/business" },
  { id: "express", label: "Express", img: "bottle-pouch", soon: true },
  { id: "sneakers", label: "Sneakers", img: "sneakers.png", href: "/categories/sneakers" },
  { id: "track", label: "Track", img: "parcel", href: "/user/orders" },
  { id: "men", label: "Men", img: "men.png", href: "/categories/shoes" },
  { id: "sport", label: "Sport", img: "sports.png", href: "/categories/sport" },
  { id: "brands", label: "Brands", img: "sweater", href: "/sellers" },
  { id: "home", label: "Home & living", img: "home-living.png", href: "/categories/home" },
  { id: "services", label: "Services", img: "services.png", soon: true },
  { id: "protection", label: "Protection", img: "protection.png", soon: true },
  { id: "gifts", label: "Gifts", img: "gift.png", href: "/categories/gifts" },
  { id: "hairbeauty", label: "Hair & beauty", img: "hair-beauty.png", href: "/categories/beauty" },
  { id: "accessories", label: "Accessories", img: "accessories.png", href: "/categories/accessories" },
  { id: "wishlists", label: "Wishlists", img: "wishlist.png", href: "/user/favorites" },
  { id: "fashion", label: "Fashion", img: "coat", href: "/categories/shirt" },
  { id: "jobs", label: "Jobs", img: "job.png", soon: true },
]
