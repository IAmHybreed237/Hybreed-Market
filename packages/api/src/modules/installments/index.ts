import { Module } from "@medusajs/framework/utils"
import InstallmentModuleService from "./service"

export default Module("installments", { service: InstallmentModuleService })
