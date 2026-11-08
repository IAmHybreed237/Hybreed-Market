import { CatalogMobile } from "@/components/sections/CatalogPage/CatalogMobile"
import { listCategories } from "@/lib/data/categories"

export default async function CatalogPage() {
  let remaining = 20
  let departments: any[] = []
  try {
    const { parentCategories, categories } = (await listCategories()) as any
    departments = (parentCategories || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      handle: p.handle,
      children: (categories || [])
        .filter((c: any) => c.parent_category_id === p.id)
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          handle: c.handle,
          image: c.metadata?.image ?? null,
        })),
    }))
    remaining = Math.max((categories?.length || 0) - 3, 0)
  } catch {
    /* keep fallback */
  }
  return <CatalogMobile remainingCategories={remaining} departments={departments} />
}
