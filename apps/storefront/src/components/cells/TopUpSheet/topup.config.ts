// Top-up sheet configuration.
export const TOPUP_NUMBER = "+237 654 146 237"
export const TOPUP_NUMBER_RAW = "237654146237"
export const TOPUP_NAME = "Ayuketang Eyong Agbornoh"
export const TOPUP_LIMIT = "500 000 XAF"

// MTN MoMo USSD code that opens the send-money flow on the user's phone.
export const MTN_USSD = "*126#"
export const MTN_USSD_TEL = "tel:*126%23"

// Hybreed WhatsApp business chat - top-up requests are sent here for review.
export const WHATSAPP_NUMBER = "237654146237"

// When false, the sheet uses the in-app flow steps and hides the number row.
export const SHOW_NUMBER_ROW = false

export const STEPS = SHOW_NUMBER_ROW
  ? [
      "In your MTN MoMo or Orange Money app, choose transfer to a phone number",
      "Enter the Hybreed number, the amount, and your HB ID as the reference",
    ]
  : [
      "Select MTN MoMo and enter the amount",
      "Tap the MoMo code to send the money, then confirm your details",
    ]

export type TopUpMethod = {
  id: string
  label: string
  enabled: boolean
  badge?: string
  tileLight: string
  tileDark?: string
  logoBg: string
  logoText: string
  logoTextColor: string
  logoImg?: string
}

export const METHODS: TopUpMethod[] = [
  { id: "mtn", label: "MTN MoMo", enabled: true, tileLight: "#FFF4C2", tileDark: "#3E3410", logoBg: "#FFCC00", logoText: "MTN", logoTextColor: "#000", logoImg: "/images/payments/mtn-momo.png" },
  { id: "om", label: "Orange Money", enabled: false, badge: "Coming soon", tileLight: "#FFE3CC", tileDark: "#43240E", logoBg: "#FF7900", logoText: "OM", logoTextColor: "#fff", logoImg: "/images/payments/orange-money.png" },
]
