import { model } from "@medusajs/framework/utils"

const ProductEmbedding = model.define("product_embedding", {
  id: model.id().primaryKey(),
  product_id: model.text().unique(),
  embedding: model.json(),
})

export default ProductEmbedding
