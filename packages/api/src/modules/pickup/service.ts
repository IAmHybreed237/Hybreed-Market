import { MedusaService } from "@medusajs/framework/utils"
import PickupRedemption from "./models/redemption"

export const PICKUP_MODULE = "pickup"

class PickupModuleService extends MedusaService({
  PickupRedemption,
}) {
  async findByTokenHash(tokenHash: string) {
    const [row] = await this.listPickupRedemptions({ token_hash: tokenHash })
    return row ?? null
  }

  async redeem(input: {
    tokenHash: string
    orderGroupId: string
    customerId?: string | null
    redeemedBy?: string | null
    agentNote?: string | null
  }) {
    const created = await this.createPickupRedemptions({
      token_hash: input.tokenHash,
      order_group_id: input.orderGroupId,
      customer_id: input.customerId ?? null,
      redeemed_by: input.redeemedBy ?? null,
      agent_note: input.agentNote ?? null,
      redeemed_at: new Date(),
    })
    return Array.isArray(created) ? created[0] : created
  }
}

export default PickupModuleService
