// Top-up sheet configuration.
// TODO(replace): set the real MoMo/OM receiving number and limit, then set
// SHOW_NUMBER_ROW = true to display the number row.
export const TOPUP_NUMBER = "+237 6XX XX XX XX" // placeholder — supply the real receiving number
export const TOPUP_NUMBER_RAW = "+2376XXXXXXXX" // copied to clipboard (no spaces)
export const TOPUP_LIMIT = "500 000 XAF" // placeholder — supply the real per-transfer limit

// When false, the sheet uses the in-app flow steps and hides the number row.
export const SHOW_NUMBER_ROW = false

export const STEPS = SHOW_NUMBER_ROW
  ? [
      "In your MTN MoMo or Orange Money app, choose transfer to a phone number",
      "Enter the Hybreed number, the amount, and your HB ID as the reference",
    ]
  : [
      "Choose a payment method below",
      "Enter the amount and confirm the prompt on your phone",
    ]

export type TopUpMethod = {
  id: string
  label: string
  enabled: boolean
  tileLight: string
  tileDark?: string
  logoBg: string
  logoText: string
  logoTextColor: string
  logoImg?: string
}

export const METHODS: TopUpMethod[] = [
  { id: "mtn", label: "MTN MoMo", enabled: false, tileLight: "#FFF4C2", tileDark: "#3E3410", logoBg: "#FFCC00", logoText: "MTN", logoTextColor: "#000", logoImg: "/images/payments/mtn-momo.png" },
  { id: "om", label: "Orange Money", enabled: false, tileLight: "#FFE3CC", tileDark: "#43240E", logoBg: "#FF7900", logoText: "OM", logoTextColor: "#fff", logoImg: "/images/payments/orange-money.png" },
  { id: "visa", label: "Visa card", enabled: false, tileLight: "#DDE3FF", tileDark: "#1B2250", logoBg: "#fff", logoText: "VISA", logoTextColor: "#1A1F71", logoImg: "/images/payments/visa.png" },
  { id: "crypto", label: "Crypto", enabled: false, tileLight: "#D5F5EA", tileDark: "#12392E", logoBg: "#26A17B", logoText: "₮", logoTextColor: "#fff" },
  { id: "bank", label: "Bank transfer", enabled: false, tileLight: "#DBEAFE", tileDark: "#14284F", logoBg: "#2563EB", logoText: "◈", logoTextColor: "#fff" },
]
