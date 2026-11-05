import { Module } from "@medusajs/framework/utils"
import ImageSearchService from "./service"

export const IMAGE_SEARCH_MODULE = "imageSearch"
export default Module(IMAGE_SEARCH_MODULE, { service: ImageSearchService })
