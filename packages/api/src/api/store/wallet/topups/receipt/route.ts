// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

const MAX_BYTES = 5 * 1024 * 1024 // 5MB decoded

/**
 * POST /store/wallet/topups/receipt
 * Body: { filename, content_type, data } where data is base64 (data-url ok).
 * Stores the image via the file module and returns its public URL.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id as string | undefined
  if (!customerId) {
    res.status(401).json({ message: "Authentication required" })
    return
  }

  const contentType = String(req.body?.content_type ?? "")
  if (!contentType.startsWith("image/")) {
    res.status(400).json({ message: "Receipt must be an image" })
    return
  }

  let b64 = String(req.body?.data ?? "")
  b64 = b64.replace(/^data:[^;]+;base64,/, "")
  if (!b64) {
    res.status(400).json({ message: "Missing image data" })
    return
  }

  let buffer: Buffer
  try {
    buffer = Buffer.from(b64, "base64")
  } catch {
    res.status(400).json({ message: "Invalid image data" })
    return
  }
  if (!buffer.length || buffer.length > MAX_BYTES) {
    res.status(400).json({ message: "Image too large (max 5MB)" })
    return
  }

  const filename =
    String(req.body?.filename ?? "receipt.jpg").replace(/[^\w.\-]/g, "_") ||
    "receipt.jpg"

  try {
    const fileModule = req.scope.resolve(Modules.FILE)
    const [file] = await fileModule.createFiles([
      {
        filename,
        mimeType: contentType,
        content: b64,
        access: "public",
      } as never,
    ])
    res.json({ url: (file as { url?: string })?.url })
  } catch (err) {
    const e = err as Error
    req.scope
      .resolve("logger")
      .error(`wallet receipt upload failed: ${e?.message}\n${e?.stack ?? ""}`)
    res.status(500).json({ message: "Failed to upload receipt" })
  }
}
