import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import Image from "next/image"

const tileColors = [
  "#E05A5A", "#5B8DEF", "#3A3A42", "#E8963C",
  "#8D5BD0", "#2FA36B", "#D94F8F", "#4A6FA5",
]

export function CategoryCard({
  category,
}: {
  category: { name: string; handle: string; image?: string }
}) {
  const tileColor =
    tileColors[category.name.charCodeAt(0) % tileColors.length]

  return (
    <LocalizedClientLink
      href={`/categories/${category.handle}`}
      className="relative flex flex-col items-center border rounded-sm bg-component transition-all hover:rounded-full w-[233px] aspect-square shrink-0"
    >
      <div className="flex relative aspect-square overflow-hidden w-[200px]">
        {category.image ? (
          <Image
            loading="lazy"
            src={`/images/categories/${category.image}.png`}
            alt={`category - ${category.name}`}
            width={200}
            height={200}
            sizes="(min-width: 1024px) 200px, 40vw"
            className="object-contain scale-90 rounded-full"
          />
        ) : (
          <div
            className="w-full h-full rounded-full flex items-center justify-center scale-90"
            style={{ backgroundColor: tileColor }}
          >
            <span className="text-white text-5xl font-bold">
              {category.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <h3 className="w-full text-center label-lg text-primary">
        {category.name}
      </h3>
    </LocalizedClientLink>
  )
}
