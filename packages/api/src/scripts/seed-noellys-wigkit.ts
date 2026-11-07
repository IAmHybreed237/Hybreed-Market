import { ExecArgs } from "@medusajs/framework/types"
import type { CreateOfferDTO } from "@mercurjs/types"
import {
  createOffersWorkflow,
  createProductAttributeValuesWorkflow,
  createProductsWorkflow,
} from "@mercurjs/core/workflows"
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"

import {
  WIGKIT_DESCRIPTION,
  WIGKIT_IMAGES,
  WIGKIT_METADATA,
  WIGKIT_SUBTITLE,
  WIGKIT_TITLE,
} from "./noellys-wigkit-content"

const SELLER_EMAIL = "noellys@hybreed.dev"
const PRICE = 20000

export default async function seedNoellysWigkit({ container }: ExecArgs) {
  const query = container.resolve("query") as any
  const logger = container.resolve("logger") as any

  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: { email: SELLER_EMAIL },
  })
  const seller = sellers[0]
  if (!seller) throw new Error("Noellys' Hair seller not found")

  const { data: members } = await query.graph({
    entity: "member",
    fields: ["id"],
    filters: { email: SELLER_EMAIL },
  })
  const memberId = members[0].id

  const { data: locs } = await query.graph({
    entity: "stock_location",
    fields: ["id"],
    filters: { name: "Noellys' Hair Shop" },
  })
  const stockLocation = locs[0]
  if (!stockLocation) throw new Error("Noellys' Hair stock location not found")

  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
    filters: {},
  })
  const shippingProfileId = profiles[0].id

  // --- category: Hair Tools & Accessories ---
  const { data: cats } = await query.graph({
    entity: "product_category",
    fields: ["id"],
    filters: { handle: "hair-tools-accessories" },
  })
  let catId = cats[0]?.id
  if (!catId) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            name: "Hair Tools & Accessories",
            handle: "hair-tools-accessories",
            is_active: true,
          },
        ],
      },
    })
    catId = result[0].id
  }

  // --- attributes ---
  const loadAttributes = async () => {
    const { data } = await query.graph({
      entity: "product_attribute",
      fields: ["id", "handle", "values.id", "values.name"],
      filters: { product_id: null },
    })
    return new Map((data as any[]).map((a: any) => [a.handle, a]))
  }

  const attrByHandle = await loadAttributes()
  const conditionAttr = attrByHandle.get("condition")

  const handle = "noellys-11-in-1-wig-styling-kit"
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: { handle },
  })
  if (existing[0]) {
    logger.info(`Product already exists: ${existing[0].id}`)
    return
  }

  const images = WIGKIT_IMAGES

  const { result: products } = await createProductsWorkflow(container).run({
    input: {
      created_by: memberId,
      products: [
        {
          title: WIGKIT_TITLE,
          handle,
          subtitle: WIGKIT_SUBTITLE,
          description: WIGKIT_DESCRIPTION,
          status: "published",
          category_ids: [catId],
          thumbnail: images[0],
          images: images.map((url) => ({ url })),
          attributes: conditionAttr
            ? [
                {
                  id: conditionAttr.id,
                  value_ids: [
                    conditionAttr.values.find((v: any) => v.name === "New")
                      ?.id,
                  ].filter(Boolean),
                },
              ]
            : [],
          variants: [
            {
              title: "11-in-1 Combo Kit",
              sku: "NOELLYS-WIGKIT",
              options: conditionAttr ? { Condition: "New" } : {},
            },
          ],
          seller_ids: [seller.id],
          metadata: WIGKIT_METADATA,
        },
      ],
    } as any,
  })
  const product = products[0]

  const { data: prod } = await query.graph({
    entity: "product",
    fields: ["id", "variants.id", "variants.sku"],
    filters: { id: product.id },
  })
  const variants = (prod[0] as any).variants as { id: string; sku: string }[]

  const offers: CreateOfferDTO[] = variants.map((v) => ({
    seller_id: seller.id,
    created_by: memberId,
    sku: `OFFER-NOELLYS-${v.sku}`,
    variant_id: v.id,
    shipping_profile_id: shippingProfileId,
    inventory_items: [
      {
        sku: `OFFER-NOELLYS-${v.sku}`,
        stock_levels: [
          { location_id: stockLocation.id, stocked_quantity: 5 },
        ],
      },
    ],
    prices: [{ amount: PRICE, currency_code: "xaf" }],
  }))

  await createOffersWorkflow(container).run({ input: { offers } })
  logger.info(
    `Product seeded: ${product.id} (${handle}), ${offers.length} offers`
  )
}
