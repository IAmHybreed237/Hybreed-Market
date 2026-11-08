import { model } from "@medusajs/framework/utils"

// Buyer questions on a product. Admin-mediated for now: questions land in
// the admin queue, staff relay them to the seller offline, and the answer
// is posted back here where it shows publicly on the PDP.
const ProductQuestion = model.define("product_question", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  customer_id: model.text().nullable(),
  author_name: model.text(),
  body: model.text(),
  answer: model.text().nullable(),
  status: model
    .enum(["pending", "answered"])
    .default("pending"),
  answered_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
})

export default ProductQuestion
