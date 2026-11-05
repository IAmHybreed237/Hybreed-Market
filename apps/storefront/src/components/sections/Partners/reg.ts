"use client"

export type SellerType = "individual" | "business"
export type PayoutMethod = "momo" | "om" | "bank"

export type RegData = {
  city?: string
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  password?: string
  shopName?: string
  sellerType?: SellerType
  idNumber?: string
  companyName?: string
  regNumber?: string
  payoutMethod?: PayoutMethod
  payoutName?: string
  payoutAccount?: string
  bankName?: string
}

const KEY = "hybreed_seller_reg"

export const loadReg = (): RegData => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{}")
  } catch {
    return {}
  }
}

export const saveReg = (patch: RegData) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...loadReg(), ...patch }))
  } catch {}
}

export const clearReg = () => {
  try {
    sessionStorage.removeItem(KEY)
  } catch {}
}

export async function submitRegistration(reg: RegData) {
  // proxied through a storefront API route — the seller/vendor endpoints are
  // not CORS-open to the storefront origin
  const res = await fetch("/api/seller-registration", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reg),
  })
  const j = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(j.error || "Could not create your shop. Please try again.")
  }
  return j
}
