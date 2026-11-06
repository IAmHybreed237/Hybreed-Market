import { model } from "@medusajs/framework/utils"
import Auction from "./auction"

const Bid = model.define("bid", {
  id: model.id().primaryKey(),
  auction: model.belongsTo(() => Auction, {
    mappedBy: "bids",
  }),
  // Medusa customer id of the bidder.
  bidder_id: model.text(),
  // The bidder's maximum amount — proxy bidding semantics: the engine only
  // ever charges the standing price, never this ceiling.
  amount: model.bigNumber(),
  // The amount this bid currently represents on the auction.
  standing_amount: model.bigNumber().nullable(),
  // Optional Notch Pay transaction reference for the bid deposit.
  deposit_reference: model.text().nullable(),
  status: model
    .enum(["active", "leading", "outbid", "won", "lost", "cancelled"])
    .default("active"),
})

export default Bid
