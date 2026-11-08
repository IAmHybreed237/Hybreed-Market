import { Module } from "@medusajs/framework/utils"
import ProductQaModuleService from "./service"

export default Module("productQa", { service: ProductQaModuleService })
