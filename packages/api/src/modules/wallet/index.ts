import { Module } from "@medusajs/framework/utils"
import WalletModuleService from "./service"

export default Module("wallet", { service: WalletModuleService })
