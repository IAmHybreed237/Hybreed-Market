import { ExecArgs } from "@medusajs/framework/types"
import type { CreateOfferDTO } from "@mercurjs/types"
import {
  createOffersWorkflow,
  createProductAttributeValuesWorkflow,
  createProductAttributesWorkflow,
  createProductsWorkflow,
} from "@mercurjs/core/workflows"
import { AttributeType } from "@mercurjs/types"
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"

const SELLER_EMAIL = "noellys@hybreed.dev"
const BASE = process.env.STOREFRONT_URL || "http://192.168.31.130:3000"

const DESCRIPTION = `Elevate your everyday look effortlessly with the "Coup Waterwaves" Curly Fringe Wig. Designed for ultimate convenience and style, this glueless, machine-made wig features rich, voluminous waterwave curls paired with a trendy, face-framing fringe bang.

- Ready-to-Wear Convenience: No glue, no lace cutting, and no styling experience required. Simply shake, wear, and go!
- Breathable Cap Design: Built with an adjustable, secure-fit internal strap mechanism to guarantee all-day comfort without slipping.
- Versatile Styling: Perfect for both casual daytime outings and glamorous evening events. Available in three stunning colors to match your mood.

Specifications:
- Item No.: CW-WIG-21K
- Gender: Women
- Composition: High-quality temperature-resistant synthetic fiber
- Texture: Premium sassy waterwave curls
- Style: Glueless machine-made fringe bob with full curly bangs
- Density: High volume / full body
- Cap: One size - elasticated adjustable straps
- Origin: Imported`

const COLORS = ["Black", "Brown Blend", "Burgundy"]

export default async function seedNoellysWig({ container }: ExecArgs) {
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

  // --- categories: Beauty & Hair > Women > Wigs & Extensions ---
  const ensureCategory = async (
    name: string,
    handle: string,
    parentId?: string
  ) => {
    const { data } = await query.graph({
      entity: "product_category",
      fields: ["id"],
      filters: { handle },
    })
    if (data[0]) return data[0].id
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            name,
            handle,
            is_active: true,
            parent_category_id: parentId,
          },
        ],
      },
    })
    return result[0].id
  }

  const beautyId = await ensureCategory("Beauty & Hair", "beauty-hair")
  const womenId = await ensureCategory("Women", "women", beautyId)
  const wigsId = await ensureCategory(
    "Wigs & Extensions",
    "wigs-extensions",
    womenId
  )

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

  // missing color values
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

  // cap size attribute
  let capAttr = attrByHandle.get("cap-size")
  if (!capAttr) {
    await createProductAttributesWorkflow(container).run({
      input: {
        attributes: [
          {
            name: "Cap Size",
            handle: "cap-size",
            type: AttributeType.MULTI_SELECT,
            is_variant_axis: true,
            is_filterable: true,
            rank: 10,
            values: [{ name: "One Size", rank: 0 }],
          },
        ],
      },
    })
    attrByHandle = await loadAttributes()
    capAttr = attrByHandle.get("cap-size")
  }

  const valueId = (attr: any, name: string) =>
    attr.values.find((v: any) => v.name === name)?.id

  const handle = "noellys-coup-waterwaves-wig"
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: { handle },
  })
  if (existing[0]) {
    logger.info(`Product already exists: ${existing[0].id}`)
    return
  }

  const images = [1, 2, 3].map(
    (i) => `${BASE}/images/noellys-wig/wig-${i}.jpg`
  )

  const { result: products } = await createProductsWorkflow(container).run({
    input: {
      created_by: memberId,
      products: [
        {
          title: `Premium "Coup Waterwaves" Curly Fringe Wig`,
          handle,
          subtitle:
            "Glueless waterwave curls · Face-framing fringe · One size adjustable",
          description: DESCRIPTION,
          status: "published",
          category_ids: [wigsId],
          thumbnail: images[0],
          images: images.map((url) => ({ url })),
          attributes: [
            {
              id: colorAttr.id,
              value_ids: COLORS.map((c) => valueId(colorAttr, c)).filter(
                Boolean
              ),
            },
            {
              id: capAttr.id,
              value_ids: [valueId(capAttr, "One Size")].filter(Boolean),
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
            sku: `NOELLYS-WIG-${c.toUpperCase().replace(/\s+/g, "")}`,
            options: {
              Color: c,
              "Cap Size": "One Size",
              ...(conditionAttr ? { Condition: "New" } : {}),
            },
          })),
          seller_ids: [seller.id],
          metadata: {
            brand: "Noellys' Hair",
            gender: "Women",
            condition: "New",
            item_no: "CW-WIG-21K",
            composition:
              "High-quality temperature-resistant synthetic fiber",
            texture: "Premium sassy waterwave curls",
            style: "Glueless machine-made fringe bob with full curly bangs",
            density: "High volume / full body",
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
    prices: [{ amount: 21000, currency_code: "xaf" }],
  }))

  await createOffersWorkflow(container).run({ input: { offers } })
  logger.info(
    `Product seeded: ${product.id} (${handle}), ${offers.length} offers`
  )
}
