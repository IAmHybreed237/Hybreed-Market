import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { sdk } from "@/lib/client"

export default async function ImageSearchResults({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>
}) {
  const { ids } = await searchParams
  const idList = ids?.split(",").filter(Boolean) || []

  const { products } = idList.length
    ? await sdk.store.products.query({ id: idList }).then(r => r).catch(() => ({ products: [] }))
    : { products: [] }

  const order = new Map(idList.map((id, i) => [id, i]))
  const sorted = [...products].sort((a: any, b: any) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))

  return (
    <main className="container py-6">
      <h1 className="text-2xl font-semibold text-[#1F1F23] mb-4">Matches for your photo</h1>
      {sorted.length === 0 ? (
        <p className="text-[#8A8A96]">No similar items found yet — try a clearer photo or check back as sellers add more.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {sorted.map((p: any) => (
            <LocalizedClientLink key={p.id} href={`/products/${p.handle}`} className="bg-white rounded-2xl p-3 block">
              {p.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.thumbnail} alt={p.title} className="w-full aspect-[3/4] object-cover rounded-xl" />
              ) : (
                <div className="w-full aspect-[3/4] rounded-xl bg-[#F0F0F3]" />
              )}
              <p className="mt-2 text-sm text-[#1F1F23] truncate">{p.title}</p>
            </LocalizedClientLink>
          ))}
        </div>
      )}
    </main>
  )
}
