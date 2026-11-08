import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { detectComponents } from "../../../../lib/vision"

// POST /store/image-search/detect - { image: "<base64 or url>" } -> components with dot positions
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const image = (req.body as { image?: string })?.image
  if (!image) return res.status(400).json({ message: "image required" })

  try {
    const buf = image.startsWith("data:")
      ? Buffer.from(image.split(",")[1], "base64")
      : image.startsWith("http")
        ? Buffer.from(await (await fetch(image)).arrayBuffer())
        : Buffer.from(image, "base64")
    res.json(await detectComponents(buf))
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "detection failed" })
  }
}
