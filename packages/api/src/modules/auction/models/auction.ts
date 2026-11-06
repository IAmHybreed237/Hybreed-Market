import { model } from "@medusajs/framework/utils"
import Bid from "./bid"

const Auction = model.define("auction", {
  id: model.id().primaryKey(),
  title: model.text(),
  description: model.text().nullable(),
  status: model
    .enum(["draft", "scheduled", "live", "ended", "canceled"])
    .default("scheduled"),

  // Sellable entity: a Mercur offer (variant + seller + price + inventory).
  offer_id: model.text(),
  product_id: model.text().nullable(),
  seller_id: model.text(),

  currency_code: model.text(),
  starting_price: model.bigNumber(),
  bid_increment: model.bigNumber(),
  // Denormalized for cheap store reads; recomputed on every accepted bid.
  current_price: model.bigNumber().nullable(),
  leading_bid_id: model.text().nullable(),

  reserve_price: model.bigNumber().nullable(),
  buy_now_price: model.bigNumber().nullable(),
  // Required MoMo deposit per bid (commitment against bad-faith bidding).
  // Null/0 = no deposit required.
  deposit_amount: model.bigNumber().nullable(),

  start_at: model.dateTime(),
  end_at: model.dateTime(),
  // Anti-sniping: a bid inside the last `extension_window_seconds` extends
  // `end_at` by `extension_seconds`, at most `max_extensions` times.
  extension_seconds: model.number().default(120),
  extension_window_seconds: model.number().default(300),
  max_extensions: model.number().default(3),
  extension_count: model.number().default(0),

  winner_id: model.text().nullable(),
  winning_bid_id: model.text().nullable(),
  ended_at: model.dateTime().nullable(),

  bids: model.hasMany(() => Bid, {
    mappedBy: "auction",
  }),

  metadata: model.json().nullable(),
})

export default Auction
