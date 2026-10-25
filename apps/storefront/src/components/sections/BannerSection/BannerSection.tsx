import { Button } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import Image from "next/image"

export const BannerSection = () => {
  return (
    <section className="container">
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center rounded-2xl overflow-hidden">
        <div className="py-6 px-6 flex flex-col h-full justify-between bg-action-secondary">
          <div className="mb-8 lg:mb-48">
            <span className="text-sm inline-block px-4 py-1 border border-action/30 text-action rounded-full font-semibold">
              #COLLECTION
            </span>
            <h2 className="display-sm mt-4">
              ANKARA VIBES: AFRICAN PRINTS, EVERYDAY STYLE
            </h2>
            <p className="text-lg text-secondary max-w-lg mt-3">
              Discover authentic fabrics, bold prints and local fashion made by
              Cameroonian sellers.
            </p>
          </div>
          <LocalizedClientLink href="/categories">
            <Button
              size="large"
              className="w-fit bg-action text-action-on-primary rounded-xl"
            >
              EXPLORE
            </Button>
          </LocalizedClientLink>
        </div>
        <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full flex justify-end">
          <Image
            loading="lazy"
            fetchPriority="high"
            src="/images/banner-section/Image.jpg"
            alt="African fashion collection"
            width={700}
            height={600}
            className="object-cover object-top"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
      </div>
    </section>
  )
}
