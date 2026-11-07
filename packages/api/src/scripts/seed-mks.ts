import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  createProductsWorkflow,
  createProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows"

const SELLER_ID = "sel_01MKS01G1FTS01MK5G1FTS01"

export default async function seedMks({ container }: ExecArgs) {
  const query = container.resolve("query") as any
  const link = container.resolve("link") as any

  // 1. ensure a "Gifts" category
  const { result: cats } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Gifts & Surprises",
          handle: "gifts",
          is_active: true,
          description: "Curated gift boxes and baskets",
        },
      ],
    },
  })
  const catId = cats[0].id

  const sets = [
    { t: "20K Set", p: 20000, items: ["Chocolate box","Mini perfume","Key holder","Hair clip set","Body spray/mist","Customized Val's card","Single rose"] },
    { t: "25K Set", p: 25000, items: ["Chocolate box","2 mini perfumes","Necklace","Bracelet","Body spray/mist","Girly aesthetic set","Manicure set","Customized Val's card"] },
    { t: "30K Set", p: 30000, items: ["Chocolate box","Bottle of white wine","Slippers","Perfume set","Mini electric fan","Feminine diary","Pen"] },
    { t: "35K Set", p: 35000, items: ["Chocolate box","Bag","Mini electric fan","Key holder","Watch","Slippers","Girly aesthetic set","Mini perfume"] },
    { t: "45K Set", p: 45000, items: ["Bottle of white wine","Body mist","Slippers","Bag","Watch set","Purse","Water bottle","Perfume","Feminine journal"] },
    { t: "55K Set", p: 55000, items: ["Bottle of white wine","Chocolate","Mini electric fan","Heels","Bags","Slippers","Tumbler cup","Mini ring light","AirPods","Chunky jewellery"] },
  ]

  const products = [
    {
      title: "Girlfriend's Day Gift Box",
      handle: "girlfriends-day-gift-box",
      subtitle: "Curated by MK's Gifts and Surprises - Buea",
      description:
        "A beautifully curated gift box for her. Pre-order only - limited slots. Same-day delivery in Buea.",
      status: "published",
      category_ids: [catId],
      options: [{ title: "Set", values: sets.map((s) => s.t) }],
      variants: sets.map((s) => ({
        title: s.t,
        sku: `MKS-GD-${s.t}`,
        options: { Set: s.t },
        prices: [{ currency_code: "xaf", amount: s.p }],
        manage_inventory: false,
      })),
      metadata: {
        preorder: true,
        slots_total: 50,
        bundle_items: sets.map((s) => ({ set: s.t, items: s.items })),
        custom_card: true,
        same_day_delivery: "Buea",
        seller_note: "We deliver with love",
      },
    },
    {
      title: "Custom Gift Basket",
      handle: "custom-gift-basket",
      subtitle: "From 15,000 XAF - MK's Gifts and Surprises",
      description:
        "Hand-picked gift baskets built to order. Tell us the occasion and budget - we handle the rest.",
      status: "published",
      category_ids: [catId],
      options: [{ title: "Size", values: ["From 15K"] }],
      variants: [
        {
          title: "From 15K",
          sku: "MKS-BASKET-15K",
          options: { Size: "From 15K" },
          prices: [{ currency_code: "xaf", amount: 15000 }],
          manage_inventory: false,
        },
      ],
      metadata: { custom_card: true, same_day_delivery: "Buea" },
    },
  ]

  const { result } = await createProductsWorkflow(container).run({
    input: { products } as any,
  })

  // link products to the seller via Mercur's seller-product link
  for (const p of result) {
    try {
      await link.create({
        [Modules.PRODUCT]: { product_id: p.id },
        seller: { seller_id: SELLER_ID },
      })
    } catch (e: any) {
      console.log("link warn:", e.message)
    }
  }

  console.log(`Created ${result.length} MK's products in category ${catId}`)
}
