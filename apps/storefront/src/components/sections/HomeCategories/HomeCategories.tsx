import { Carousel } from "@/components/cells"
import { CategoryCard } from "@/components/organisms"

export const categories: {
  id: number
  name: string
  handle: string
  image?: string
}[] = [
  { id: 1, name: "Boots", handle: "boots", image: "boots" },
  { id: 2, name: "Sportswear", handle: "sport", image: "sport" },
  { id: 3, name: "Accessories", handle: "accessories", image: "/catalog/accessories.png" },
  { id: 4, name: "Fashion", handle: "shirt", image: "shirt" },
  { id: 5, name: "Hair & beauty", handle: "beauty", image: "/catalog/hair-beauty.png" },
  { id: 6, name: "Sneakers", handle: "sneakers", image: "/catalog/sneakers.png" },
  { id: 7, name: "Sandals", handle: "sandals", image: "sandals" },
  { id: 8, name: "Phones", handle: "phones", image: "/catalog/phones.png" },
  { id: 9, name: "Electronics", handle: "electronics", image: "/catalog/electronics.png" },
  { id: 10, name: "Home & living", handle: "home", image: "/catalog/home-living.png" },
]

export const HomeCategories = async ({ heading }: { heading: string }) => {
  return (
    <section className="bg-primary pt-2 pb-8 w-full hidden lg:block">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-primary">{heading}</h2>
        </div>
        <Carousel
          arrowsOnDesktop
          items={categories?.map((category) => (
            <div key={category.id} className="shrink-0 w-[calc(100%/8-28px)]">
              <CategoryCard category={category} />
            </div>
          ))}
        />
      </div>
    </section>
  )
}
