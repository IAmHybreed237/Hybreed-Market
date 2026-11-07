import { ExecArgs } from "@medusajs/framework/types"
import type { CreateOfferDTO } from "@mercurjs/types"
import {
  createOffersWorkflow,
  createProductAttributeValuesWorkflow,
  createProductsWorkflow,
} from "@mercurjs/core/workflows"
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"

const SELLER_EMAIL = "noellys@hybreed.dev"


const DESCRIPTION = `Get an instant, effortlessly glamorous look on a budget with the "Skull Cap Chioma" Pixie Cut Wig! This ultra-affordable, classic short wig features perfectly sculpted, vintage-style finger waves and tight roll curls that hold their shape permanently.

- No Styling Needed: The permanent curl retention means you never need rollers or curling irons. Simply put it on, finger style the edges, and you are ready to go!
- Ultra-Flat Skull Cap Base: Designed with a slim, breathable machine-made weft base that hugs your head closely. It mimics a low-profile cropped cut without looking bulky or heavy.
- Premium Heat-Safe Fiber: Crafted with high-grade synthetic fibers that offer a realistic, glossy sheen resembling freshly gelled natural hair. Available in three vibrant colors to elevate your style instantly.

Specifications:
- Item No.: SK-CHIOMA-5K
- Gender: Women
- Composition: Premium high-temperature synthetic fiber
- Texture: Structured finger waves / sculpted pixie curls
- Style: Glueless, non-lace full machine-weft skull cap wig
- Length: Short crop (pixie cut)
- Cap: One size - elasticated skull cap, capless construction for zero bulking
- Weight: Light-weight, flat-fitting
- Origin: Imported`

const COLORS = ["Black", "Brown", "Burgundy"]

export default async function seedNoellysChioma({ container }: ExecArgs) {
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
  const capAttr = attrByHandle.get("cap-size")

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

  const handle = "noellys-skull-cap-chioma"
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
    (i) => `/images/noellys-chioma/chioma-${i}.jpg`
  )

  const { result: products } = await createProductsWorkflow(container).run({
    input: {
      created_by: memberId,
      products: [
        {
          title: `"Skull Cap Chioma" Short Finger Wave Pixie Cut Wig`,
          handle,
          subtitle:
            "Sculpted finger waves · Glueless skull cap · Lightweight flat fit",
          description: DESCRIPTION,
          status: "published",
          category_ids: [catId],
          thumbnail: images[0],
          images: images.map((url) => ({ url })),
          attributes: [
            {
              id: colorAttr.id,
              value_ids: COLORS.map((c) => valueId(colorAttr, c)).filter(
                Boolean
              ),
            },
            ...(capAttr
              ? [
                  {
                    id: capAttr.id,
                    value_ids: [valueId(capAttr, "One Size")].filter(
                      Boolean
                    ),
                  },
                ]
              : []),
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
            sku: `NOELLYS-CHIOMA-${c.toUpperCase()}`,
            options: {
              Color: c,
              ...(capAttr ? { "Cap Size": "One Size" } : {}),
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
            item_no: "SK-CHIOMA-5K",
            composition:
              "Premium high-temperature synthetic fiber",
            texture: "Structured finger waves / sculpted pixie curls",
            style:
              "Glueless, non-lace full machine-weft skull cap wig",
            length: "Short crop (pixie cut)",
            weight: "Light-weight, flat-fitting",
            color_images: {
              Black: `/images/noellys-chioma/chioma-2.jpg`,
              Brown: `/images/noellys-chioma/chioma-1.jpg`,
              Burgundy: `/images/noellys-chioma/chioma-3.jpg`,
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
          { location_id: stockLocation.id, stocked_quantity: 15 },
        ],
      },
    ],
    prices: [{ amount: 5000, currency_code: "xaf" }],
  }))

  await createOffersWorkflow(container).run({ input: { offers } })
  logger.info(
    `Product seeded: ${product.id} (${handle}), ${offers.length} offers`
  )
}
