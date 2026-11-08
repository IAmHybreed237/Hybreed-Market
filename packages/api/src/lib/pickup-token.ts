import crypto from "crypto"

/**
 * Pickup QR tokens: `hbp1.<orderGroupId>.<expUnix>.<hmac>`
 * HMAC-SHA256 over `hbp1.<orderGroupId>.<expUnix>` keyed by JWT_SECRET.
 * The token is a bearer capability - whoever holds it can redeem the pickup,
 * which is why redemption is single-use and order details shown are minimal.
 */
const PREFIX = "hbp1"

const secret = () =>
  process.env.PICKUP_TOKEN_SECRET || process.env.JWT_SECRET || "supersecret"

export const createPickupToken = (orderGroupId: string, ttlSeconds = 30 * 24 * 3600) => {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const body = `${PREFIX}.${orderGroupId}.${exp}`
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("hex")
  return `${body}.${sig}`
}

export const verifyPickupToken = (
  token: string
): { orderGroupId: string; exp: number } | null => {
  const parts = token.trim().split(".")
  if (parts.length !== 4 || parts[0] !== PREFIX) return null
  const [, orderGroupId, expStr, sig] = parts
  const exp = Number(expStr)
  if (!orderGroupId || !Number.isFinite(exp)) return null
  if (exp * 1000 < Date.now()) return null
  const body = `${PREFIX}.${orderGroupId}.${expStr}`
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("hex")
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  return { orderGroupId, exp }
}

export const pickupTokenHash = (token: string) =>
  crypto.createHash("sha256").update(token.trim()).digest("hex")
