// @ts-nocheck
import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";

// EUR -> XAF is pegged at 655.56; we use 655 for readable prices.
const EUR_TO_XAF = 655;

export default async function setupXafPrices({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const pricingModule = container.resolve(Modules.PRICING);

  const { data: priceSets } = await query.graph({
    entity: "price_set",
    fields: ["id", "prices.id", "prices.currency_code", "prices.amount"],
    filters: {},
  });

  // Only price sets linked to product variants are relevant for checkout.
  const { data: variantLinks } = await query.graph({
    entity: "product_variant",
    fields: ["id", "price_set.id"],
    filters: {},
  });

  const variantPriceSetIds = new Set(
    variantLinks
      .map((v: any) => v.price_set?.id)
      .filter(Boolean) as string[]
  );

  let created = 0;
  let skipped = 0;

  for (const ps of priceSets as any[]) {
    if (!variantPriceSetIds.has(ps.id)) continue;

    const prices = ps.prices ?? [];
    if (prices.some((p: any) => p.currency_code === "xaf")) {
      skipped++;
      continue;
    }

    const eur = prices.find((p: any) => p.currency_code === "eur");
    const base = eur ?? prices.find((p: any) => p.currency_code === "usd");
    if (!base) {
      logger.warn(`No eur/usd price found for price set ${ps.id}, skipping`);
      continue;
    }

    const sourceAmount = Number(base.amount);
    const sourceCurrency = base.currency_code;
    // If only USD exists, convert roughly USD -> EUR -> XAF (1 USD ~ 0.92 EUR)
    const xafAmount =
      sourceCurrency === "eur"
        ? Math.round((sourceAmount * EUR_TO_XAF) / 100) * 100
        : Math.round((sourceAmount * 0.92 * EUR_TO_XAF) / 100) * 100;

    try {
      await pricingModule.createPrices([
        {
          price_set_id: ps.id,
          currency_code: "xaf",
          amount: xafAmount,
        } as any,
      ]);
      created++;
      logger.info(
        `Added xaf price ${xafAmount} to price set ${ps.id} (from ${sourceAmount} ${sourceCurrency})`
      );
    } catch (e) {
      logger.error(`Failed to add xaf price to ${ps.id}: ${e}`);
    }
  }

  logger.info(`Done. Created ${created} xaf prices, skipped ${skipped} sets.`);
}
