import { ExecArgs } from "@medusajs/framework/types"
import type { CreateOfferDTO } from "@mercurjs/types"
import {
  createOffersWorkflow,
  createProductAttributeValuesWorkflow,
  createProductsWorkflow,
} from "@mercurjs/core/workflows"
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"

const SELLER_EMAIL = "noellys@hybreed.dev"

const DESCRIPTION = `Elevate your look with the ultimate blend of volume, definition, and luxury. This stunning 16-inch Water Wave Wig features a flawless, high-definition full frontal lace for an incredibly natural, seamless hairline. Crafted with an eye-catching brown-to-honey-blonde ombre highlight pattern, it offers effortless bounce and premium dimension right out of the box. Perfect for everyday glamour or special occasions.

- Melted Hairline: The premium frontal lace mimics a natural scalp line, allowing you to wear it glueless or completely melted.
- Pre-Highlighted Dimension: Skip the salon dye job - the professional golden-blonde highlights are perfectly placed to frame and brighten your face.
- Low Maintenance Curls: The water wave texture holds its pattern beautifully and can be easily refreshed with a quick mist of water and leave-in conditioner.

Specifications:
- Hair Texture: Deep Water Wave (defined spiral curls with natural bounce)
- Length: 16 Inches
- Lace Type: Full Frontal Lace (ear-to-ear sheer mesh for versatile styling and realistic parting)
- Color: Dimensional Chocolate Brown with Honey & Golden Blonde Highlights (ombre effect)
- Cap Construction: Breathable, secure fit with adjustable straps`

const COLOR = "Chocolate Brown Ombré"

export default async function seedNoellysWaterwave({ container }: ExecArgs) {
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
  let catId = cats[0]?.id
  if (!catId) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            name: "Wigs & Extensions",
            handle: "wigs-extensions",
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

  const handle = "noellys-16in-waterwave-frontal-wig"
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: { handle },
  })
  if (existing[0]) {
    logger.info(`Product already exists: ${existing[0].id}`)
    return
  }

  const images = [1, 2, 3, 4].map(
    (i) => `/images/noellys-waterwave/wig-${i}.png`
  )

  const { result: products } = await createProductsWorkflow(container).run({
    input: {
      created_by: memberId,
      products: [
        {
          title: `Premium 16-Inch Water Wave Full Frontal Lace Wig`,
          handle,
          subtitle:
            "Deep water wave · Full frontal lace · Chocolate brown honey-blonde ombré",
          description: DESCRIPTION,
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
              title: `${COLOR} / 16"`,
              sku: "NOELLYS-WW-16IN",
              options: {
                Color: COLOR,
                ...(conditionAttr ? { Condition: "New" } : {}),
              },
            },
          ],
          seller_ids: [seller.id],
          metadata: {
            brand: "Noellys' Hair",
            gender: "Women",
            condition: "New",
            product_type: "Wigs",
            breadcrumb: ["Beauty & Hair", "Women", "Wigs & Extensions"],
            texture: "Deep Water Wave",
            color: "Chocolate Brown with Honey & Golden Blonde Highlights (Ombré)",
            length: "16 inches",
            lace_type: "Full Frontal Lace - ear-to-ear",
            cap: "Breathable cap, adjustable straps",
            hairline: "High-definition lace, glueless or melted install",
            country_of_origin: "Imported",
          },
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
          { location_id: stockLocation.id, stocked_quantity: 10 },
        ],
      },
    ],
    prices: [{ amount: 22000, currency_code: "xaf" }],
  }))

  await createOffersWorkflow(container).run({ input: { offers } })
  logger.info(
    `Product seeded: ${product.id} (${handle}), ${offers.length} offers`
  )
}
