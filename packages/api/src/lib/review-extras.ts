import type { MedusaRequest } from "@medusajs/framework/http"

/** Identity used for reactions/reports: customer id, else anonymous device id. */
export const actorKey = (req: MedusaRequest): string | null => {
  const customerId = (req as any).auth_context?.actor_id as string | undefined
  if (customerId) return `cus:${customerId}`
  const device = String(req.headers["x-hb-device"] ?? "").trim()
  return /^[a-zA-Z0-9_-]{8,64}$/.test(device) ? `dev:${device}` : null
}

/** "Ilya Gromov" -> "Ilya G." */
export const authorName = (first?: string | null, last?: string | null) => {
  const f = (first || "").trim()
  const l = (last || "").trim()
  if (!f) return l || "Hybreed customer"
  return l ? `${f} ${l[0].toUpperCase()}.` : f
}

/** Author tier from published review count (metadata can promote to top). */
export const authorLevel = (count: number, metadata?: Record<string, any> | null) => {
  if (metadata?.review_author_tier === "top" || count >= 10)
    return { label: "Top author", top: true }
  if (count >= 5) return { label: "Review Wizard 2 level", top: false }
  if (count >= 2) return { label: "Review Wizard 1 level", top: false }
  return { label: "Reviewer", top: false }
}

const TIMEOUT_MS = 6000

const withTimeout = async (url: string, init?: RequestInit) => {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

/**
 * Free FR <-> EN translation. Uses DeepL when DEEPL_API_KEY is set, else the
 * keyless Google endpoint, falling back to MyMemory. Returns null on failure.
 */
export const translateText = async (
  text: string,
  target: "en" | "fr"
): Promise<{ text: string; detected?: string } | null> => {
  const q = text.slice(0, 2000)

  const deepl = process.env.DEEPL_API_KEY
  if (deepl) {
    try {
      const host = deepl.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com"
      const res = await withTimeout(`https://${host}/v2/translate`, {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${deepl}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: [q], target_lang: target.toUpperCase() }),
      })
      if (res.ok) {
        const d: any = await res.json()
        const tr = d?.translations?.[0]
        if (tr?.text)
          return { text: tr.text, detected: String(tr.detected_source_language || "").toLowerCase() }
      }
    } catch {}
  }

  try {
    const res = await withTimeout(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(q)}`
    )
    if (res.ok) {
      const d: any = await res.json()
      const out = Array.isArray(d?.[0]) ? d[0].map((s: any) => s?.[0] ?? "").join("") : ""
      if (out) return { text: out, detected: typeof d?.[2] === "string" ? d[2] : undefined }
    }
  } catch {}

  try {
    const src = target === "en" ? "fr" : "en"
    const res = await withTimeout(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q.slice(0, 480))}&langpair=${src}|${target}`
    )
    if (res.ok) {
      const d: any = await res.json()
      const out = d?.responseData?.translatedText
      if (out && d?.responseStatus === 200) return { text: out }
    }
  } catch {}

  return null
}
