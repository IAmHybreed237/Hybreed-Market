import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createPromotionsWorkflow,
  updateRegionsWorkflow,
} from "@medusajs/medusa/core-flows"

export const WALLET_PROMO_CODE = "WALLET3"
export const WALLET_DISCOUNT_PERCENT = 3

/**
 * Enables the Hybreed Wallet payment provider on the Cameroon region.
 * Run: medusa exec ./src/scripts/setup-wallet.ts
 */
export default async function setupWallet({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "payment_providers.id"],
  })

  const region = regions.find(
    (r: any) => r.currency_code === "xaf" || /cameroon/i.test(r.name ?? "")
  )
  if (!region) {
    logger.error("No XAF/Cameroon region found")
    return
  }

  const current: string[] = (region.payment_providers ?? []).map(
    (p: any) => p.id
  )
  const wanted = "pp_wallet_wallet"
  if (!current.includes(wanted)) {
    const providers = [...new Set([...current, wanted])]
    logger.info(`Setting region ${region.id} payment providers: ${providers.join(", ")}`)

    await updateRegionsWorkflow(container).run({
      input: {
        selector: { id: region.id },
        update: { payment_providers: providers },
      },
    })
    logger.info("Done - Hybreed Wallet is enabled for checkout")
  } else {
    logger.info(`Region ${region.id} already has ${wanted}`)
  }

  // Instant wallet discount: 3% off the order total when paying with
  // Hybreed Balance. The storefront applies/removes this code at checkout.
  const { data: promos } = await query.graph({
    entity: "promotion",
    fields: ["id", "code", "status"],
    filters: { code: WALLET_PROMO_CODE },
  })
  if (promos.length) {
    logger.info(`Promotion ${WALLET_PROMO_CODE} already exists`)
    return
  }

  await createPromotionsWorkflow(container).run({
    input: {
      promotionsData: [
        {
          code: WALLET_PROMO_CODE,
          type: "standard",
          status: "active",
          application_method: {
            type: "percentage",
            target_type: "order",
            allocation: "across",
            value: WALLET_DISCOUNT_PERCENT,
          },
        },
      ],
    },
  })
  logger.info(`Created promotion ${WALLET_PROMO_CODE} (${WALLET_DISCOUNT_PERCENT}% off)`)
}
