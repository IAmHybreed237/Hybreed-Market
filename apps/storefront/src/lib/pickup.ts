import crypto from "crypto"

/**
 * Pickup QR tokens - must stay in sync with
 * packages/api/src/lib/pickup-token.ts
 * Format: hbp1.<orderGroupId>.<expUnix>.<hmac-sha256-hex>
 */
const PREFIX = "hbp1"
const TTL_SECONDS = 30 * 24 * 3600 // 30 days - generous validity window

const secret = () =>
  process.env.PICKUP_TOKEN_SECRET || process.env.JWT_SECRET || "supersecret"

export const createPickupToken = (orderGroupId: string) => {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS
  const body = `${PREFIX}.${orderGroupId}.${exp}`
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("hex")
  return `${body}.${sig}`
}
