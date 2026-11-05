import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import {
  createRegionsWorkflow,
  createTaxRegionsWorkflow,
  updateStoresStep,
} from "@medusajs/medusa/core-flows";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies-cm",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[];
    store_id: string;
  }) => {
    const normalizedInput = transform({ input }, (data) => {
      return {
        selector: { id: data.input.store_id },
        update: {
          supported_currencies: data.input.supported_currencies.map(
            (currency) => ({
              currency_code: currency.currency_code,
              is_default: currency.is_default ?? false,
            })
          ),
        },
      };
    });

    const stores = updateStoresStep(normalizedInput);
    return new WorkflowResponse(stores);
  }
);

export default async function setupCameroon({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const regionModuleService = container.resolve(Modules.REGION);
  const taxModuleService = container.resolve(Modules.TAX);
  const storeModuleService = container.resolve(Modules.STORE);

  // 1. Cameroon region in XAF
  const existingRegions = await regionModuleService.listRegions(
    {},
    { relations: ["countries"] }
  );
  const cmRegion = existingRegions.find((r) =>
    r.countries?.some((c) => c.iso_2 === "cm")
  );

  if (cmRegion) {
    logger.info(`Cameroon already assigned to region ${cmRegion.id}, skipping.`);
  } else {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Cameroon",
            currency_code: "xaf",
            countries: ["cm"],
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    });
    logger.info(`Created Cameroon region: ${result[0].id}`);
  }

  // 2. Tax region for Cameroon
  const existingTaxRegions = await taxModuleService.listTaxRegions();
  if (existingTaxRegions.some((tr) => tr.country_code === "cm")) {
    logger.info("Tax region for cm already exists, skipping.");
  } else {
    await createTaxRegionsWorkflow(container).run({
      input: [{ country_code: "cm", provider_id: "tp_system" }],
    });
    logger.info("Created tax region for cm.");
  }

  // 3. Add XAF to store supported currencies (keep EUR as default until
  //    products carry XAF prices)
  const [store] = await storeModuleService.listStores();
  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [
        { currency_code: "eur", is_default: true },
        { currency_code: "usd" },
        { currency_code: "xaf" },
      ],
    },
  });
  logger.info("Added xaf to store currencies.");
}
