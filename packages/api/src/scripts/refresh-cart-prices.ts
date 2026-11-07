import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { refreshCartItemsWorkflow } from "@medusajs/medusa/core-flows";

export default async function refreshCartPrices({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "completed_at", "region_id", "currency_code"],
    filters: { completed_at: null },
  });

  console.log(`Found ${carts.length} open carts`);

  for (const cart of carts as any[]) {
    try {
      await refreshCartItemsWorkflow(container).run({
        input: { cart_id: cart.id },
      });
      console.log(`Refreshed cart ${cart.id}`);
    } catch (e: any) {
      console.log(`Failed cart ${cart.id}: ${e?.message}`);
    }
  }

  const stale = await pg.raw(
    `SELECT cli.id, cli.unit_price, cli.raw_unit_price
     FROM cart_line_item cli JOIN cart c ON c.id = cli.cart_id
     WHERE c.completed_at IS NULL`
  );
  console.log("Open cart items after refresh:", stale.rows);
}
