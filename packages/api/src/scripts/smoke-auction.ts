import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { AUCTION_MODULE } from "../modules/auction/service"
import { createAuctionWorkflow } from "../workflows/auction/create-auction"
import { placeBidWorkflow } from "../workflows/auction/place-bid"

export default async function smokeAuction({ container }: ExecArgs) {
  const wf = container.resolve(Modules.WORKFLOW_ENGINE)
  const svc = container.resolve<any>(AUCTION_MODULE)

  const now = Date.now()
  const { result: auction } = await wf.run(createAuctionWorkflow, {
    input: {
      title: "Smoke Test Auction",
      offer_id: "offer_01M5N7EKB8QDX8RAKV4XW8HV18",
      product_id: "prod_01M5N7EEPS15KXZVS3Y6WSXXDN",
      seller_id: "sel_01M5N7EE1AFD1HECD5WMZP7HAS",
      currency_code: "xaf",
      starting_price: 10000,
      bid_increment: 1000,
      start_at: new Date(now - 60_000),
      end_at: new Date(now + 15 * 60_000),
    },
  })
  console.log("CREATED", auction.id, auction.status)

  await svc.updateAuctions({ id: auction.id, status: "live" })

  const b1 = await wf.run(placeBidWorkflow, {
    input: { auction_id: auction.id, bidder_id: "cus_smoke_a", amount: 12000 },
  })
  console.log("BID1", JSON.stringify(b1.result))

  const b2 = await wf.run(placeBidWorkflow, {
    input: { auction_id: auction.id, bidder_id: "cus_smoke_b", amount: 15000 },
  })
  console.log("BID2", JSON.stringify(b2.result))

  const after = await svc.retrieveAuction(auction.id)
  console.log(
    "FINAL price=",
    after.current_price?.toString?.() ?? after.current_price,
    "leader=",
    after.leading_bid_id,
    "status=",
    after.status
  )
}
