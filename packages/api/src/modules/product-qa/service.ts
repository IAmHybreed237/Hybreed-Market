import { MedusaService } from "@medusajs/framework/utils"
import ProductQuestion from "./models/question"

export const PRODUCT_QA_MODULE = "productQa"

class ProductQaModuleService extends MedusaService({
  ProductQuestion,
}) {
  async ask(input: {
    productId: string
    customerId?: string | null
    authorName: string
    body: string
  }) {
    const created = await this.createProductQuestions({
      product_id: input.productId,
      customer_id: input.customerId ?? null,
      author_name: input.authorName,
      body: input.body,
      status: "pending",
    })
    return Array.isArray(created) ? created[0] : created
  }

  async answer(input: { id: string; answer: string }) {
    const updated = await this.updateProductQuestions({
      id: input.id,
      answer: input.answer,
      status: "answered",
      answered_at: new Date(),
    })
    return Array.isArray(updated) ? updated[0] : updated
  }
}

export default ProductQaModuleService
