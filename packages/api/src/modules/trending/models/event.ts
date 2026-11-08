import { model } from "@medusajs/framework/utils"

const TrendingEvent = model.define("trending_event", {
  id: model.id().primaryKey(),
  type: model.text(), // "search" | "view"
  term: model.text().nullable(), // normalized search term
  product_id: model.text().nullable(),
  category_ids: model.text().nullable(), // comma-joined
  customer_id: model.text().nullable(),
})

export default TrendingEvent
