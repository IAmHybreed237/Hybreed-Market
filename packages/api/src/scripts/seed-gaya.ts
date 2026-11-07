import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import type { CreateOfferDTO } from "@mercurjs/types"
import {
  approveSellerWorkflow,
  createOffersWorkflow,
  createProductsWorkflow,
  createSellerAccountWorkflow,
  createSellerShippingOptionsWorkflow,
  createSellerStockLocationsWorkflow,
} from "@mercurjs/core/workflows"
import {
  createLocationFulfillmentSetWorkflow,
  createProductCategoriesWorkflow,
  createServiceZonesWorkflow,
  createShippingProfilesWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"

const SELLER_EMAIL = "gaya@hybreed.dev"
const SELLER_PASSWORD = "supersecret"
const BASE = process.env.STOREFRONT_URL || "http://192.168.31.130:3000"

const DESCRIPTION = `Minimalist low-top sneakers in premium Veau Velours calf suede - rich, matte-black depth with tonal hand-placed matte black spikes across the reinforced toe box. All-black rubber midsole over the signature red lacquered rubber outsole. Made in Italy.

• Upper: fine-nap calf suede (Veau Velours), matte black
• Spikes: hand-placed matte black spikes on structured toe box
• Sole: black rubber midsole, red lacquered rubber outsole
• Lining: premium tan calfskin leather
• Hardware: matte black metal eyelets, flat tonal woven laces
• Construction: upper stitched directly to the rubber cupsole

Sizing: runs true to size to slightly large. The suede breaks in and stretches slightly across the width; the reinforced spiked toe cap does not stretch - wide feet should go half a size up.

Care: apply a water & stain repellent before first wear. Clean only with a crepe suede brush or suede eraser - never water or soap. The red outsole is solid red rubber, so the colour won't wear off - just wipe with a damp cloth.`

const GDC_DESCRIPTION = `Nike Skateboarding × Girls Don't Cry - Verdy's "Coming Back Home" SB Dunk Low Pro QS. Ultra-limited Japan exclusive released ahead of Valentine's Day 2019, celebrated for its bold monochromatic red palette and playful romantic motifs.

• Upper: fully tonal University Red premium nubuck/suede base with matching red overlays and a stitched leather Nike Swoosh
• Heel: contrast white "Girls Don't Cry" script embroidered on the lateral heel panel
• Tongue: Verdy's signature butterfly motif tag on a clean white background
• Hardware: metallic butterfly hangtag clipped to the top eyelets, custom script heel tabs
• Sole: crisp white rubber midsole with Zoom Air cushioning in the insole, slip-resistant University Red rubber outsole
• Style code: BQ6832-600

Sizing: men's sizing, fits true to size with typical plush SB padding.

A region-exclusive QS release - quantities are limited.`

const STUSSY_DESCRIPTION = `Nike SB Dunk Low × Stüssy "Black/Sky Blue" - independent custom-designed homage concept blending the iconic Nike SB Dunk Low silhouette with signature Stüssy branding.

• Upper: deep black nubuck/suede base with crisp white contrast accent stitching around the paneling
• Swoosh: light sky blue Nike Swoosh on the lateral side, plus a custom miniature Swoosh embroidered near the front mudguard
• Heel: classic Stüssy script logo embroidered on the lateral heel counter
• Tongue: matching sky blue tongue branding, thick woven rope laces
• Extras: detachable chrome Stüssy interlocking "S" keychain tag
• Sole: black midsole over a light sky blue rubber outsole

Sizing: unisex sizing, true to size - the padded SB tongue and collar make wide feet prefer half a size up.`

export default async function seedGaya({ container }: ExecArgs) {
  const query = container.resolve("query") as any
  const link = container.resolve("link") as any
  const logger = container.resolve("logger") as any

  // resume-safe: reuse seller if a previous run already created it
  const { data: existing } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: { email: SELLER_EMAIL },
  })

  let seller: { id: string }
  let memberId: string
  let stockLocation: { id: string }

  const { data: members } = await query.graph({
    entity: "member",
    fields: ["id"],
    filters: { email: SELLER_EMAIL },
  })

  // --- shipping profile (shared or new) ---
  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
    filters: {},
  })
  let shippingProfileId = profiles[0]?.id
  if (!shippingProfileId) {
    const {
      result: [p],
    } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Marketplace Shipping", type: "default" }] },
    })
    shippingProfileId = p.id
  }

  if (existing[0]) {
    seller = existing[0]
    memberId = members[0].id
    logger.info(`Reusing existing seller ${seller.id}`)
    const { data: locs } = await query.graph({
      entity: "stock_location",
      fields: ["id"],
      filters: { name: "Gaya Shopping Warehouse" },
    })
    stockLocation = locs[0]
  } else {
    // --- auth identity ---
    const authModuleService = container.resolve(Modules.AUTH) as any
    let authIdentityId: string
    const reg = await authModuleService.register("emailpass", {
      body: { email: SELLER_EMAIL, password: SELLER_PASSWORD },
    })
    if (reg.success && reg.authIdentity) {
      authIdentityId = reg.authIdentity.id
    } else {
      const [pi] = await authModuleService.listProviderIdentities({
        entity_id: SELLER_EMAIL,
        provider: "emailpass",
      })
      authIdentityId = pi.auth_identity_id!
    }

    // --- seller ---
    const { result: createdSeller } = await createSellerAccountWorkflow(
      container
    ).run({
      input: {
        auth_identity_id: authIdentityId,
        member_email: SELLER_EMAIL,
        first_name: "Gaya",
        last_name: "Shopping",
        seller: {
          name: "Gaya Shopping",
          email: SELLER_EMAIL,
          currency_code: "xaf",
          description:
            "Gaya Shopping - verified footwear & fashion seller in Buea, Cameroon.",
          logo: `https://api.dicebear.com/9.x/initials/svg?seed=Gaya%20Shopping`,
          metadata: { verified: true },
        },
      },
    })
    seller = createdSeller
    await approveSellerWorkflow(container).run({
      input: { seller_id: seller.id },
    })
    const { data: newMembers } = await query.graph({
      entity: "member",
      fields: ["id"],
      filters: { email: SELLER_EMAIL },
    })
    memberId = newMembers[0].id
    logger.info(`Seller created: ${seller.id}`)

    const { result: stockLocations } =
      await createSellerStockLocationsWorkflow(container).run({
        input: {
          seller_id: seller.id,
          locations: [
            {
              name: "Gaya Shopping Warehouse",
              address: {
                city: "Buea",
                country_code: "cm",
                address_1: "Molyko",
              },
            },
          ],
        },
      })
    stockLocation = stockLocations[0]

    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    })

    const { data: channels } = await query.graph({
      entity: "sales_channel",
      fields: ["id"],
      filters: {},
    })
    if (channels[0]?.id) {
      await linkSalesChannelsToStockLocationWorkflow(container).run({
        input: { id: stockLocation.id, add: [channels[0].id] },
      })
    }

    await createLocationFulfillmentSetWorkflow(container).run({
      input: {
        location_id: stockLocation.id,
        fulfillment_set_data: {
          name: "Gaya Shopping delivery",
          type: "shipping",
        },
      },
    })

    const {
      data: [locWithSet],
    } = await query.graph({
      entity: "stock_location",
      fields: ["id", "fulfillment_sets.id"],
      filters: { id: stockLocation.id },
    })
    const fulfillmentSetId = locWithSet?.fulfillment_sets?.[0]?.id

    if (fulfillmentSetId) {
      const { result: zones } = await createServiceZonesWorkflow(
        container
      ).run({
        input: {
          data: [
            {
              fulfillment_set_id: fulfillmentSetId,
              name: "Gaya Shopping zones",
              geo_zones: ["cm", "de", "gb", "fr", "us"].map((c) => ({
                country_code: c,
                type: "country" as const,
              })),
            },
          ],
        },
      })

      await createSellerShippingOptionsWorkflow(container).run({
        input: {
          seller_id: seller.id,
          shipping_options: [
            {
              name: "Standard Delivery",
              price_type: "flat",
              provider_id: "manual_manual",
              service_zone_id: zones[0].id,
              shipping_profile_id: shippingProfileId,
              type: {
                label: "Standard",
                description: "Delivery in 1-3 days.",
                code: "standard",
              },
              prices: [
                { currency_code: "xaf", amount: 1500 },
                { currency_code: "eur", amount: 5 },
              ],
              rules: [
                { attribute: "enabled_in_store", value: "true", operator: "eq" },
                { attribute: "is_return", value: "false", operator: "eq" },
              ],
            },
          ],
        },
      })
    }
  }

  // --- category ---
  const { data: cats } = await query.graph({
    entity: "product_category",
    fields: ["id"],
    filters: { handle: "shoes" },
  })
  let catId = cats[0]?.id
  if (!catId) {
    const { result: created } = await createProductCategoriesWorkflow(
      container
    ).run({
      input: {
        product_categories: [
          {
            name: "Shoes",
            handle: "shoes",
            is_active: true,
            description: "Footwear for men and women",
          },
        ],
      },
    })
    catId = created[0].id
  }

  // --- product attributes (Mercur variant axes) ---
  const loadAttributes = async () => {
    const { data } = await query.graph({
      entity: "product_attribute",
      fields: ["id", "handle", "values.id", "values.name"],
      filters: {
        handle: ["size", "color", "condition"],
        product_id: null,
      },
    })
    return new Map((data as any[]).map((a: any) => [a.handle, a]))
  }

  let attrByHandle = await loadAttributes()
  if (!attrByHandle.has("size") || !attrByHandle.has("color")) {
    const { createProductAttributesWorkflow } = await import(
      "@mercurjs/core/workflows"
    )
    const { AttributeType } = await import("@mercurjs/types")
    const defs = [
      { name: "Size", handle: "size", values: ["39", "40", "41", "42", "43", "44", "45", "46"] },
      { name: "Color", handle: "color", values: ["Black"] },
      { name: "Condition", handle: "condition", values: ["New"] },
    ].filter((d) => !attrByHandle.has(d.handle))
    await createProductAttributesWorkflow(container).run({
      input: {
        attributes: defs.map((a, i) => ({
          name: a.name,
          handle: a.handle,
          type: AttributeType.MULTI_SELECT,
          is_variant_axis: true,
          is_filterable: true,
          rank: i,
          values: a.values.map((name, rank) => ({ name, rank })),
        })),
      },
    })
    attrByHandle = await loadAttributes()
  }

  let sizeAttr = attrByHandle.get("size")
  let colorAttr = attrByHandle.get("color")
  const conditionAttr = attrByHandle.get("condition")
  const valueId = (attr: any, name: string) =>
    attr.values.find((v: any) => v.name === name)?.id

  // use the sizes the attribute actually defines
  const sizes = sizeAttr.values.map((v: any) => v.name).sort()

  const PRODUCTS = [
    {
      title: "Spiked Suede Low-Top Sneakers - Red Sole",
      handle: "gaya-spiked-suede-sneakers",
      subtitle:
        "Black Veau Velours · Matte black spikes · Red lacquered sole",
      description: DESCRIPTION,
      imageDir: "gaya",
      imagePrefix: "gaya",
      skuPrefix: "GAYA-SPK",
      color: "Black",
      prices: [
        { amount: 45000, currency_code: "xaf" },
        { amount: 68, currency_code: "eur" },
      ],
      metadata: {
        brand: "Gaya Shopping",
        color: "Black",
        gender: "Men",
        condition: "New",
        country_of_origin: "Italy",
      },
    },
    {
      title: `Nike SB Dunk Low Pro QS "Girls Don't Cry" - Coming Back Home`,
      handle: "nike-sb-dunk-girls-dont-cry",
      subtitle:
        "University Red suede · Verdy butterfly motif · Japan exclusive QS",
      description: GDC_DESCRIPTION,
      imageDir: "gdc-dunk",
      imagePrefix: "gdc",
      skuPrefix: "GDC-DUNK",
      color: "University Red",
      prices: [
        { amount: 95000, currency_code: "xaf" },
        { amount: 145, currency_code: "eur" },
      ],
      metadata: {
        brand: "Nike SB × Girls Don't Cry",
        color: "University Red",
        gender: "Men",
        condition: "New",
        country_of_origin: "Vietnam",
        style_code: "BQ6832-600",
      },
    },
    {
      title: `Nike SB Dunk Low x Stüssy "Black/Sky Blue" Custom`,
      handle: "nike-sb-dunk-stussy-black-sky-custom",
      subtitle:
        "Black nubuck · Sky blue Swoosh · Stüssy heel script · Chrome keychain tag",
      description: STUSSY_DESCRIPTION,
      imageDir: "stussy-dunk",
      imagePrefix: "stussy",
      imageCount: 6,
      skuPrefix: "STU-BLKSKY",
      color: "Black",
      sizes: ["38", "39", "40", "41", "42", "43", "44", "45"],
      prices: [
        { amount: 78000, currency_code: "xaf" },
        { amount: 120, currency_code: "eur" },
      ],
      metadata: {
        brand: "Nike SB × Stüssy (Custom)",
        color: "Black / Sky Blue",
        gender: "Unisex",
        condition: "New",
        country_of_origin: "Custom",
        style_code: "CUSTOM-STU-BLKSKY",
      },
    },
  ]

  // --- color values needed by every product must exist on the attribute ---
  const missingColors = [
    ...new Set(PRODUCTS.map((p) => p.color)),
  ].filter((c) => !colorAttr.values.find((v: any) => v.name === c))
  if (missingColors.length) {
    const { createProductAttributeValuesWorkflow } = await import(
      "@mercurjs/core/workflows"
    )
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

  // --- ensure size values for custom size ranges exist ---
  const neededSizes = [
    ...new Set(PRODUCTS.flatMap((p) => p.sizes || [])),
  ].filter((s) => !sizeAttr.values.find((v: any) => v.name === s))
  if (neededSizes.length) {
    const { createProductAttributeValuesWorkflow } = await import(
      "@mercurjs/core/workflows"
    )
    await createProductAttributeValuesWorkflow(container).run({
      input: {
        attribute_id: sizeAttr.id,
        values: neededSizes.map((name, i) => ({
          name,
          rank: sizeAttr.values.length + i,
        })),
      },
    })
    attrByHandle = await loadAttributes()
    sizeAttr = attrByHandle.get("size")
  }

  // resume-safe: only create products that don't exist yet
  const { data: existingProds } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    filters: { handle: PRODUCTS.map((p) => p.handle) },
  })
  const existingHandles = new Set(
    (existingProds as any[]).map((p) => p.handle)
  )

  for (const def of PRODUCTS) {
    if (existingHandles.has(def.handle)) {
      logger.info(`Skipping existing product ${def.handle}`)
      continue
    }

    const images = Array.from(
      { length: def.imageCount || 4 },
      (_, i) => `${BASE}/images/${def.imageDir}/${def.imagePrefix}-${i + 1}.jpg`
    )

    const { result: products } = await createProductsWorkflow(container).run({
      input: {
        created_by: memberId,
        products: [
          {
            title: def.title,
            handle: def.handle,
            subtitle: def.subtitle,
            description: def.description,
            status: "published",
            category_ids: [catId],
            thumbnail: images[0],
            images: images.map((url) => ({ url })),
            attributes: [
              {
                id: sizeAttr.id,
                value_ids: (def.sizes || sizes)
                  .map((s) => valueId(sizeAttr, s))
                  .filter(Boolean),
              },
              {
                id: colorAttr.id,
                value_ids: [valueId(colorAttr, def.color)].filter(Boolean),
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
            variants: (def.sizes || sizes).map((s) => ({
              title: `EU ${s}`,
              sku: `${def.skuPrefix}-EU${s}`,
              options: {
                Size: s,
                Color: def.color,
                ...(conditionAttr ? { Condition: "New" } : {}),
              },
            })),
            seller_ids: [seller.id],
            metadata: def.metadata,
          },
        ],
      } as any,
    })
    const product = products[0]

    // --- offers (one per size variant) ---
    const { data: prod } = await query.graph({
      entity: "product",
      fields: ["id", "variants.id", "variants.sku"],
      filters: { id: product.id },
    })
    const variants = (prod[0] as any).variants as {
      id: string
      sku: string
    }[]

    const offers: CreateOfferDTO[] = variants.map((v) => ({
      seller_id: seller.id,
      created_by: memberId,
      sku: `OFFER-GAYA-${v.sku}`,
      variant_id: v.id,
      shipping_profile_id: shippingProfileId,
      inventory_items: [
        {
          sku: `OFFER-GAYA-${v.sku}`,
          stock_levels: [
            { location_id: stockLocation.id, stocked_quantity: 12 },
          ],
        },
      ],
      prices: def.prices,
    }))

    await createOffersWorkflow(container).run({ input: { offers } })
    logger.info(
      `Product seeded: ${product.id} (${def.handle}), ${offers.length} offers`
    )
  }

  logger.info(`Gaya Shopping seed complete: seller ${seller.id}`)
}
