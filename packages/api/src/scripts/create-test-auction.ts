import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { AUCTION_MODULE } from "../modules/auction/service"
import { createAuctionWorkflow } from "../workflows/auction/create-auction"

export default async function createTestAuction({ container }: ExecArgs) {
  const wf = container.resolve(Modules.WORKFLOW_ENGINE)
  const svc = container.resolve<any>(AUCTION_MODULE)

  const now = Date.now()
  const { result: auction } = await wf.run(createAuctionWorkflow, {
    input: {
      title: "Nike Air Max 90 - Test Auction",
      description: "Sandbox test auction for the bidding flow. Ends in 2 hours.",
      offer_id: "offer_01M5N7EKB8QDX8RAKV4XW8HV18",
      product_id: "prod_01M5N7EEPS15KXZVS3Y6WSXXDN",
      seller_id: "sel_01M5N7EE1AFD1HECD5WMZP7HAS",
      currency_code: "xaf",
      starting_price: 25000,
      bid_increment: 2500,
      start_at: new Date(now - 60_000),
      end_at: new Date(now + 2 * 60 * 60 * 1000),
    },
  })

  await svc.updateAuctions({ id: auction.id, status: "live" })
  console.log("LIVE AUCTION", auction.id)
}
