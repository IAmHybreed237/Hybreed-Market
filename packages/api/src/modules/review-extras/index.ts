import { Module } from "@medusajs/framework/utils"
import ReviewExtrasService, { REVIEW_EXTRAS_MODULE } from "./service"

export default Module(REVIEW_EXTRAS_MODULE, {
  service: ReviewExtrasService,
})
