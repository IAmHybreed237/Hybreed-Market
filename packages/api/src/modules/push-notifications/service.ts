import { MedusaService } from "@medusajs/framework/utils"
import PushSubscription from "./models/subscription"

export const PUSH_MODULE = "pushNotifications"

export default class PushNotificationsService extends MedusaService({
  PushSubscription,
}) {}
