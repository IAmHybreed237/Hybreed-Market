import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  approveSellerWorkflow,
  createSellerAccountWorkflow,
  createSellerShippingOptionsWorkflow,
  createSellerStockLocationsWorkflow,
} from "@mercurjs/core/workflows"
import {
  createLocationFulfillmentSetWorkflow,
  createServiceZonesWorkflow,
  createShippingProfilesWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"

const SELLER_EMAIL = "noellys@hybreed.dev"
const SELLER_PASSWORD = "supersecret"

export default async function seedNoellys({ container }: ExecArgs) {
  const query = container.resolve("query") as any
  const link = container.resolve("link") as any
  const logger = container.resolve("logger") as any

  const { data: existing } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: { email: SELLER_EMAIL },
  })

  if (existing[0]) {
    logger.info(`Seller already exists: ${existing[0].id}`)
    return
  }

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
  const { result: seller } = await createSellerAccountWorkflow(container).run({
    input: {
      auth_identity_id: authIdentityId,
      member_email: SELLER_EMAIL,
      first_name: "Noellys",
      last_name: "Hair",
      seller: {
        name: "Noellys' Hair",
        email: SELLER_EMAIL,
        currency_code: "xaf",
        description:
          "Noellys' Hair - wigs, hair bundles, lashes and hair accessories. Wholesale & retail, based in Buea, Cameroon. WhatsApp: +237 672 102 037",
        logo: `https://api.dicebear.com/9.x/initials/svg?seed=Noellys%20Hair`,
        metadata: {
          verified: true,
          whatsapp: "+237672102037",
          location: "Buea, Cameroon",
          business_type: "wholesale and retail - wigs, lashes, hair accessories",
        },
      },
    },
  })
  await approveSellerWorkflow(container).run({
    input: { seller_id: seller.id },
  })
  logger.info(`Seller created: ${seller.id}`)

  // --- stock location ---
  const { result: stockLocations } =
    await createSellerStockLocationsWorkflow(container).run({
      input: {
        seller_id: seller.id,
        locations: [
          {
            name: "Noellys' Hair Shop",
            address: {
              city: "Buea",
              country_code: "cm",
              address_1: "Buea",
            },
          },
        ],
      },
    })
  const stockLocation = stockLocations[0]

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
        name: "Noellys' Hair delivery",
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
    const { result: zones } = await createServiceZonesWorkflow(container).run({
      input: {
        data: [
          {
            fulfillment_set_id: fulfillmentSetId,
            name: "Noellys' Hair zones",
            geo_zones: [{ country_code: "cm", type: "country" as const }],
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
            prices: [{ currency_code: "xaf", amount: 1000 }],
            rules: [
              { attribute: "enabled_in_store", value: "true", operator: "eq" },
              { attribute: "is_return", value: "false", operator: "eq" },
            ],
          },
        ],
      },
    })
  }

  logger.info("Noellys' Hair seed complete")
}
