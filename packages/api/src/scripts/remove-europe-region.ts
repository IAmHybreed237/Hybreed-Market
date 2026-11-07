import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function removeEuropeRegion({ container }: ExecArgs) {
  const regionService = container.resolve(Modules.REGION);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "countries.iso_2"],
  });

  const europe = regions.find(
    (r: any) => r.currency_code === "eur" || r.name?.toLowerCase().includes("europe")
  );

  if (!europe) {
    console.log("No Europe/EUR region found - nothing to do.");
    return;
  }

  console.log(`Removing region: ${europe.id} (${europe.name}, ${europe.currency_code})`);

  // Re-point any carts still on the Europe region to the Cameroon region
  const cameroon = regions.find((r: any) => r.currency_code === "xaf");
  if (cameroon) {
    const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);
    const result = await pg.raw(
      `UPDATE cart SET region_id = ? WHERE region_id = ?`,
      [cameroon.id, europe.id]
    );
    console.log(`Re-pointed carts:`, result?.rowCount ?? result);
  }

  await regionService.deleteRegions([europe.id]);
  console.log("Europe region deleted.");
}
