import { Module } from "@medusajs/framework/utils"
import PushNotificationsService from "./service"

export default Module("pushNotifications", {
  service: PushNotificationsService,
})
