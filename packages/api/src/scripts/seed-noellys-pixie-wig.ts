import { ExecArgs } from "@medusajs/framework/types"
import type { CreateOfferDTO } from "@mercurjs/types"
import {
  createOffersWorkflow,
  createProductAttributeValuesWorkflow,
  createProductsWorkflow,
} from "@mercurjs/core/workflows"

import {
  PIXIE_DESCRIPTION,
  PIXIE_IMAGES,
  PIXIE_METADATA,
  PIXIE_SUBTITLE,
  PIXIE_TITLE,
} from "./noellys-pixie-content"

const SELLER_EMAIL = "noellys@hybreed.dev"
const COLOR = "#613 Honey Blonde / Platinum"
const PRICE = 9000

export default async function seedNoellysPixieWig({ container }: ExecArgs) {
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

  // --- category: Wigs & Extensions (existing) ---
  const { data: cats } = await query.graph({
    entity: "product_category",
    fields: ["id"],
    filters: { handle: "wigs-extensions" },
  })
  const catId = cats[0]?.id
  if (!catId) throw new Error("Wigs & Extensions category not found")

  // --- attributes ---
  const loadAttributes = async () => {
    const { data } = await query.graph({
      entity: "product_attribute",
      fields: ["id", "handle", "values.id", "values.name"],
      filters: { product_id: null },
    })
    return new Map((data as any[]).map((a: any) => [a.handle, a]))
  }

  let attrByHandle = await loadAttributes()
  let colorAttr = attrByHandle.get("color")
  const conditionAttr = attrByHandle.get("condition")

  if (!colorAttr.values.find((v: any) => v.name === COLOR)) {
    await createProductAttributeValuesWorkflow(container).run({
      input: {
        attribute_id: colorAttr.id,
        values: [{ name: COLOR, rank: colorAttr.values.length }],
      },
    })
    attrByHandle = await loadAttributes()
    colorAttr = attrByHandle.get("color")
  }

  const valueId = (attr: any, name: string) =>
    attr.values.find((v: any) => v.name === name)?.id

  const handle = "noellys-613-pixie-bob-wig"
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: { handle },
  })
  if (existing[0]) {
    logger.info(`Product already exists: ${existing[0].id}`)
    return
  }

  const images = PIXIE_IMAGES

  const { result: products } = await createProductsWorkflow(container).run({
    input: {
      created_by: memberId,
      products: [
        {
          title: PIXIE_TITLE,
          handle,
          subtitle: PIXIE_SUBTITLE,
          description: PIXIE_DESCRIPTION,
          status: "published",
          category_ids: [catId],
          thumbnail: images[0],
          images: images.map((url) => ({ url })),
          attributes: [
            {
              id: colorAttr.id,
              value_ids: [valueId(colorAttr, COLOR)].filter(Boolean),
            },
            ...(conditionAttr
              ? [
                  {
                    id: conditionAttr.id,
                    value_ids: [valueId(conditionAttr, "New")].filter(
                      Boolean
                    ),
                  },
                ]
              : []),
          ],
          variants: [
            {
              title: `${COLOR} / 13x4 Frontal`,
              sku: "NOELLYS-613-PIXIE",
              options: {
                Color: COLOR,
                ...(conditionAttr ? { Condition: "New" } : {}),
              },
            },
          ],
          seller_ids: [seller.id],
          metadata: PIXIE_METADATA,
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
