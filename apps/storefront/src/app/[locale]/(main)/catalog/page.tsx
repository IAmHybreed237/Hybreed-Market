import { CatalogMobile } from "@/components/sections/CatalogPage/CatalogMobile"
import { listCategories } from "@/lib/data/categories"

export default async function CatalogPage() {
  let remaining = 20
  try {
    const cats = await listCategories()
    // 3 grid tiles point at real category pages (shoes, sport, gifts)
    remaining = Math.max((cats?.length || 0) - 3, 0)
  } catch {
    /* keep fallback */
  }
  return <CatalogMobile remainingCategories={remaining} />
}
