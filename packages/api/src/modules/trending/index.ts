import { Module } from "@medusajs/framework/utils"
import TrendingService from "./service"

export default Module("trending", {
  service: TrendingService,
})
