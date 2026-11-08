import { Module } from "@medusajs/framework/utils"
import PickupModuleService from "./service"

export default Module("pickup", { service: PickupModuleService })
