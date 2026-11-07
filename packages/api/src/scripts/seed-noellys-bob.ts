import { ExecArgs } from "@medusajs/framework/types"
import type { CreateOfferDTO } from "@mercurjs/types"
import {
  createOffersWorkflow,
  createProductAttributeValuesWorkflow,
  createProductsWorkflow,
} from "@mercurjs/core/workflows"
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"

const SELLER_EMAIL = "noellys@hybreed.dev"


const DESCRIPTION = `Step out in confidence with this ultra-modern 10-Inch Silver-Grey 13x4 Lace Frontal Bob. Designed for the bold and fashion-forward, this wig features a striking, uniform platinum-grey shade that beautifully complements deep skin tones. The silky, bone-straight texture falls into a crisp, blunt-cut finish right around the jawline, perfectly framing the neck and face.

Equipped with a generous 13x4 lace frontal, this unit allows for realistic, deep side-parting or center-parting styles from ear to ear. The lace hairline is meticulously crafted to mimic a natural growth pattern, offering a seamless "melted" look when installed. Lightweight, breathable, and pre-styled for effortless wear, this chic bob brings high-end salon vibes straight to your daily look.

Specifications:
- Hair Type: Premium heat-resistant synthetic fiber
- Texture: Silky bone straight (STW)
- Color: Trendy silver-grey / platinum grey
- Length: 10 inches (blunt-cut bob styling)
- Lace Type: 13x4 lace frontal - ear-to-ear coverage for versatile parting
- Cap Construction: Glueless cap with adjustable straps and secure inner combs
- Hairline: Pre-plucked with natural baby hairs for a melted finish`

const COLOR = "Silver-Grey"

export default async function seedNoellysBob({ container }: ExecArgs) {
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

  const handle = "noellys-stw-silver-grey-bob"
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: { handle },
  })
  if (existing[0]) {
    logger.info(`Product already exists: ${existing[0].id}`)
    return
  }

  const images = [1, 2].map((i) => `/images/noellys-bob/bob-${i}.jpg`)

  const { result: products } = await createProductsWorkflow(container).run({
    input: {
      created_by: memberId,
      products: [
        {
          title: `STW Silver-Grey 13x4 Lace Frontal Bob (10 Inches)`,
          handle,
          subtitle:
            "Platinum grey bone-straight · 13x4 lace frontal · Glueless pre-plucked bob",
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
              title: `${COLOR} / 10"`,
              sku: "NOELLYS-BOB-SLV10",
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
            hair_type:
              "Premium heat-resistant synthetic fiber",
            texture: "Silky bone straight (STW)",
            color: COLOR,
            length: "10 inches",
            style: "Blunt-cut bob",
            lace_type: "13x4 lace frontal - ear-to-ear",
            cap: "Glueless cap, adjustable straps, inner combs",
            hairline: "Pre-plucked with natural baby hairs",
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
          { location_id: stockLocation.id, stocked_quantity: 8 },
        ],
      },
    ],
    prices: [{ amount: 14000, currency_code: "xaf" }],
  }))

  await createOffersWorkflow(container).run({ input: { offers } })
  logger.info(
    `Product seeded: ${product.id} (${handle}), ${offers.length} offers`
  )
}
