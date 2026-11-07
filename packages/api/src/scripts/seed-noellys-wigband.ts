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

const DESCRIPTION = `Secure your wig like a pro with this Adjustable Elastic Wig Band! Tired of your wig shifting or feeling too tight? This adjustable elastic strap na the ultimate hair accessory every wig wearer needs. With a smooth slide buckle, you fit am well well to your head size — no more "one size fits all" wahala.

Why you need am for your hair vanity:
- 100% glueless freedom: save your hairline and natural edges! This band keeps your lace flat and secure without glue or gel wey go damage your edges.
- Perfect custom fit: the metal slide buckle lets you tighten or loosen the strap exactly how you like am.
- Heavy-duty & comfortable: made of durable, breathable elastic wey no lose shape. E dey sit well for your head back, no pinch.
- Easy DIY project: simple to sew inside any wig cap, lace closure or frontal.
- Unbeatable market deal: 1 piece na 500 frs, or take the 3-piece bundle for 1,000 frs — save 500 frs and always get spare!

How to use:
1. Sew each end of the elastic strap inside your wig cap mesh (usually ear to ear across the back).
2. Put the wig on your head.
3. Slide the buckle until the strap dey snug, secure and comfortable.

Perfect for stylists, wig influencers and anyone wey wan glueless install without stress.`

const PACKS = [
  { title: "1 Piece", sku: "NOELLYS-BAND-1PC", price: 500 },
  { title: "3 Pieces (Promo Bundle)", sku: "NOELLYS-BAND-3PC", price: 1000 },
]

export default async function seedNoellysWigBand({ container }: ExecArgs) {
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
          { name, handle, is_active: true, parent_category_id: parentId },
        ],
      },
    })
    return result[0].id
  }

  const beautyId = await ensureCategory("Beauty & Hair", "beauty-hair")
  const womenId = await ensureCategory("Women", "women", beautyId)
  const accessoriesId = await ensureCategory(
    "Hair Accessories",
    "hair-accessories",
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
  const conditionAttr = attrByHandle.get("condition")

  let packAttr = attrByHandle.get("pack")
  if (!packAttr) {
    await createProductAttributesWorkflow(container).run({
      input: {
        attributes: [
          {
            name: "Pack",
            handle: "pack",
            type: AttributeType.MULTI_SELECT,
            is_variant_axis: true,
            is_filterable: true,
            rank: 10,
            values: PACKS.map((p, i) => ({ name: p.title, rank: i })),
          },
        ],
      },
    })
    attrByHandle = await loadAttributes()
    packAttr = attrByHandle.get("pack")
  } else {
    const missing = PACKS.filter(
      (p) => !packAttr.values.find((v: any) => v.name === p.title)
    )
    if (missing.length) {
      await createProductAttributeValuesWorkflow(container).run({
        input: {
          attribute_id: packAttr.id,
          values: missing.map((p, i) => ({
            name: p.title,
            rank: packAttr.values.length + i,
          })),
        },
      })
      attrByHandle = await loadAttributes()
      packAttr = attrByHandle.get("pack")
    }
  }

  const valueId = (attr: any, name: string) =>
    attr.values.find((v: any) => v.name === name)?.id

  const handle = "noellys-adjustable-wig-band"
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: { handle },
  })
  if (existing[0]) {
    logger.info(`Product already exists: ${existing[0].id}`)
    return
  }

  const images = [1, 2, 3].map((i) => `/images/noellys-wigband/band-${i}.png`)

  const { result: products } = await createProductsWorkflow(container).run({
    input: {
      created_by: memberId,
      products: [
        {
          title: `Adjustable Elastic Wig Band / Wig Strap`,
          handle,
          subtitle:
            "Glueless secure fit · Slide buckle · 1pc 500 frs / 3pc bundle 1,000 frs",
          description: DESCRIPTION,
          status: "published",
          category_ids: [accessoriesId],
          thumbnail: images[0],
          images: images.map((url) => ({ url })),
          attributes: [
            {
              id: packAttr.id,
              value_ids: PACKS.map((p) => valueId(packAttr, p.title)).filter(
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
          variants: PACKS.map((p) => ({
            title: p.title,
            sku: p.sku,
            options: {
              Pack: p.title,
              ...(conditionAttr ? { Condition: "New" } : {}),
            },
          })),
          seller_ids: [seller.id],
          metadata: {
            brand: "Noellys' Hair",
            gender: "Unisex",
            condition: "New",
            product_type: "Hair Accessories",
            breadcrumb: ["Beauty & Hair", "Hair Accessories"],
            material:
              "Premium high-elastic polyester fiber with stainless steel slide buckle",
            color: "Classic Black",
            width: "2.5 cm",
            application:
              "Sewn inside wig caps, lace frontals or closures for a custom secure fit",
            fit: "Adjustable - fits most head sizes",
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

  const priceBySku = new Map(PACKS.map((p) => [p.sku, p.price]))
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
          { location_id: stockLocation.id, stocked_quantity: 20 },
        ],
      },
    ],
    prices: [
      { amount: priceBySku.get(v.sku) ?? 500, currency_code: "xaf" },
    ],
  }))

  await createOffersWorkflow(container).run({ input: { offers } })
  logger.info(
    `Product seeded: ${product.id} (${handle}), ${offers.length} offers`
  )
}
