import { ExecArgs } from "@medusajs/framework/types"
import type { CreateOfferDTO } from "@mercurjs/types"
import {
  createOffersWorkflow,
  createProductAttributeValuesWorkflow,
  createProductsWorkflow,
} from "@mercurjs/core/workflows"
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"

const SELLER_EMAIL = "noellys@hybreed.dev"
const BASE = process.env.STOREFRONT_URL || "http://192.168.31.130:3000"

const DESCRIPTION = `Turn heads with the timeless elegance of the 14-Inch Fringe Flip Bounce Bob. This wig is the ultimate solution for effortless, high-glamour styling. Featuring a beautifully structured silhouette, it combines a sleek, full-coverage fringe bang with layered, voluminous sides that curve beautifully inward - creating that iconic, retro-modern "flipped bounce" that perfectly contours the jawline and shoulders.

Built as a full machine-made unit, this wig offers a completely glueless, beginner-friendly application. There is no lace to cut or glue down; simply slide it on, adjust the inner straps, and you are ready to go. Available in three stunning shades - timeless Natural Black, rich Chocolate Brown, and a sultry Deep Burgundy - this unit delivers a full, bouncy look with a radiant, healthy sheen that elevates any outfit instantly.

Specifications:
- Length: 14 inches
- Texture: Silky smooth with a voluminous under-bump and flipped layered ends
- Cap Construction: Non-lace full machine-made wig (glueless / throw-and-go)
- Front Styling: Full brow-skimming fringe bangs - no lace blending required
- Colors: Natural Black / Darkest Brown (classic), Rich Chocolate Brown (warm), Deep Burgundy / Plum Wine (bold)
- Composition: Premium heat-resistant fiber blend
- Gender: Women
- Origin: Imported

Care: detangle gently with a wide-tooth comb and use a synthetic-safe serum after wear to prevent frizz at the nape.`

const COLORS = ["Black", "Brown", "Burgundy"]

// gallery order: black pair, brown pair, burgundy pair
const IMAGES = [
  `${BASE}/images/noellys-flipbob/flip-2.jpg`,
  `${BASE}/images/noellys-flipbob/flip-3.jpg`,
  `${BASE}/images/noellys-flipbob/flip-4.jpg`,
  `${BASE}/images/noellys-flipbob/flip-5.jpg`,
  `${BASE}/images/noellys-flipbob/flip-6.jpg`,
  `${BASE}/images/noellys-flipbob/flip-1.jpg`,
]

export default async function seedNoellysFlipBob({ container }: ExecArgs) {
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

  const missingColors = COLORS.filter(
    (c) => !colorAttr.values.find((v: any) => v.name === c)
  )
  if (missingColors.length) {
    await createProductAttributeValuesWorkflow(container).run({
      input: {
        attribute_id: colorAttr.id,
        values: missingColors.map((name, i) => ({
          name,
          rank: colorAttr.values.length + i,
        })),
      },
    })
    attrByHandle = await loadAttributes()
    colorAttr = attrByHandle.get("color")
  }

  const valueId = (attr: any, name: string) =>
    attr.values.find((v: any) => v.name === name)?.id

  const handle = "noellys-fringe-flip-bob"
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: { handle },
  })
  if (existing[0]) {
    logger.info(`Product already exists: ${existing[0].id}`)
    return
  }

  const { result: products } = await createProductsWorkflow(container).run({
    input: {
      created_by: memberId,
      products: [
        {
          title: `Fringe Flip Bounce Bob Wig`,
          handle,
          subtitle:
            "14\" voluminous flip ends · Full fringe bangs · Glueless machine-made",
          description: DESCRIPTION,
          status: "published",
          category_ids: [catId],
          thumbnail: IMAGES[0],
          images: IMAGES.map((url) => ({ url })),
          attributes: [
            {
              id: colorAttr.id,
              value_ids: COLORS.map((c) => valueId(colorAttr, c)).filter(
                Boolean
              ),
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
          variants: COLORS.map((c) => ({
            title: c,
            sku: `NOELLYS-FLIPBOB-${c.toUpperCase()}`,
            options: {
              Color: c,
              ...(conditionAttr ? { Condition: "New" } : {}),
            },
          })),
          seller_ids: [seller.id],
          metadata: {
            brand: "Noellys' Hair",
            gender: "Women",
            condition: "New",
            product_type: "Wigs",
            breadcrumb: ["Beauty & Hair", "Women", "Wigs & Extensions"],
            length: "14 inches",
            texture:
              "Silky smooth with voluminous under-bump and flipped layered ends",
            style:
              "Non-lace full machine-made wig, glueless throw-and-go",
            front:
              "Full brow-skimming fringe bangs - no lace blending",
            composition:
              "Premium heat-resistant fiber blend",
            color_options:
              "Natural Black / Darkest Brown, Rich Chocolate Brown, Deep Burgundy / Plum Wine",
            color_images: {
              Black: `${BASE}/images/noellys-flipbob/flip-2.jpg`,
              Brown: `${BASE}/images/noellys-flipbob/flip-4.jpg`,
              Burgundy: `${BASE}/images/noellys-flipbob/flip-6.jpg`,
            },
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
          { location_id: stockLocation.id, stocked_quantity: 6 },
        ],
      },
    ],
    prices: [{ amount: 30000, currency_code: "xaf" }],
  }))

  await createOffersWorkflow(container).run({ input: { offers } })
  logger.info(
    `Product seeded: ${product.id} (${handle}), ${offers.length} offers`
  )
}
