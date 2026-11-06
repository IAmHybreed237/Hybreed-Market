import { Module } from "@medusajs/framework/utils"
import AuctionModuleService from "./service"

export default Module("auction", { service: AuctionModuleService })
