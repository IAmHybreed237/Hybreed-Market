import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

const ORPHAN_SKUS = [
  "OFFER-NOELLYS-NOELLYS-WW-16IN",
  "OFFER-NOELLYS-AFRO-NOELLYS-AFROPUFF",
]

export default async function cleanupNoellysInventory({ container }: ExecArgs) {
  const inventory = container.resolve(Modules.INVENTORY) as any
  const logger = container.resolve("logger") as any

  for (const sku of ORPHAN_SKUS) {
    const [item] = await inventory.listInventoryItems({ sku })
    if (!item) {
      logger.info(`No inventory item for sku ${sku}`)
      continue
    }
    await inventory.deleteInventoryItems([item.id])
    logger.info(`Deleted orphaned inventory item ${item.id} (${sku})`)
  }
}
