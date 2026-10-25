import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { categories } from "@/components/sections/HomeCategories/HomeCategories"

const tileColors = [
  "#E05A5A", "#5B8DEF", "#3A3A42", "#E8963C", "#8D5BD0",
  "#2FA36B", "#D94F8F", "#4A6FA5",
]

export const MobileCategories = () => {
  return (
    <section
      className="lg:hidden -mt-3 w-full"
      data-testid="mobile-categories"
    >
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-3">
        {categories.map((c, i) => (
          <LocalizedClientLink
            key={c.id}
            href={`/categories/${c.handle}`}
            className="flex flex-col items-center"
            style={{ flex: "0 0 calc((100vw - 72px) / 5)" }}
          >
            <div className="w-full aspect-square rounded-[18px] overflow-hidden bg-component flex items-center justify-center">
              {c.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/images/categories/${c.image}.png`}
                  alt={c.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: tileColors[i % tileColors.length] }}
                >
                  <span className="text-white text-xl font-bold">
                    {c.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <span className="mt-1.5 text-[11px] text-primary text-center leading-tight line-clamp-2">
              {c.name}
            </span>
          </LocalizedClientLink>
        ))}
      </div>
    </section>
  )
}
