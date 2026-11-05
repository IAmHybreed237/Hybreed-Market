import { MedusaService } from "@medusajs/framework/utils"
import ProductEmbedding from "./models/embedding"

export default class ImageSearchService extends MedusaService({ ProductEmbedding }) {}
