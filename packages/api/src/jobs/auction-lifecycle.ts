import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { AUCTION_MODULE } from "../modules/auction/service"
import { closeAuctionWorkflow } from "../workflows/auction/close-auction"

/**
 * Runs every minute:
 *  1. Flips `scheduled` auctions to `live` once start_at passes.
 *  2. Closes `live` auctions whose end_at has passed via the close workflow.
 */
export default async function auctionLifecycleJob(container: MedusaContainer) {
  const service = container.resolve(AUCTION_MODULE)
  const wfEngine = container.resolve(Modules.WORKFLOW_ENGINE)
  const eventBus = container.resolve(Modules.EVENT_BUS)
  const now = new Date()

  // Activate auctions whose start time has arrived.
  const scheduled = await service.listAuctions({ status: "scheduled" })
  for (const auction of scheduled) {
    if (new Date(auction.start_at) <= now) {
      await service.updateAuctions({ id: auction.id, status: "live" })
    }
  }

  // Close auctions whose end time has passed.
  const live = await service.listAuctions({ status: "live" })
  for (const auction of live) {
    if (new Date(auction.end_at) <= now) {
      const { result } = await wfEngine.run(closeAuctionWorkflow, {
        input: { auction_id: auction.id },
      })
      await eventBus.emit({
        name: "auction.ended",
        data: { auction_id: auction.id, ...(result ?? {}) },
      })
    }
  }
}

export const config = {
  name: "auction-lifecycle",
  schedule: "* * * * *",
}
