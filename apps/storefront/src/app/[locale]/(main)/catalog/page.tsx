import { CatalogMobile } from "@/components/sections/CatalogPage/CatalogMobile"
import { listCategories } from "@/lib/data/categories"

export default async function CatalogPage() {
  let remaining = 20
  let departments: any[] = []
  try {
    const { parentCategories, categories } = (await listCategories()) as any
    const toChild = (c: any) => ({
      id: c.id,
      name: c.name,
      handle: c.handle,
      image: c.metadata?.image ?? null,
    })
    // Departments exist at two levels: top-level parents (e.g. Sneakers)
    // and their children (e.g. Women under Fashion). Include both so every
    // catalog tile can resolve to a node that has subcategories.
    departments = [
      ...(parentCategories || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        handle: p.handle,
        children: (p.category_children || []).map(toChild),
      })),
      ...(categories || [])
        .filter((c: any) => (c.category_children || []).length > 0)
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          handle: c.handle,
          children: (c.category_children || []).map(toChild),
        })),
    ]
    remaining = Math.max((categories?.length || 0) - 3, 0)
  } catch {
    /* keep fallback */
  }
  return <CatalogMobile remainingCategories={remaining} departments={departments} />
}
