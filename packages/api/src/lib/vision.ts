/**
 * Local vision helpers: object detection + CLIP embeddings/labels.
 * Models download from HuggingFace on first use and cache in node_modules/.cache.
 * Everything runs on CPU - no external API, no fees.
 */

type Det = { label: string; score: number; box: { xmin: number; ymin: number; xmax: number; ymax: number } }

const FASHION_LABELS = [
  "shoes", "bag", "hat", "dress", "shirt", "pants", "jacket",
  "watch", "glasses", "jewelry", "phone", "laptop", "furniture", "food", "cosmetics",
]

let _pipelines: Promise<{ det: any; emb: any; cls: any }> | null = null

const loadPipelines = () => {
  if (!_pipelines) {
    _pipelines = (async () => {
      const { pipeline } = await import("@huggingface/transformers")
      const [det, emb, cls] = await Promise.all([
        pipeline("object-detection" as never, "Xenova/yolos-tiny" as never),
        pipeline("image-feature-extraction" as never, "Xenova/clip-vit-base-patch32" as never),
        pipeline("zero-shot-image-classification" as never, "Xenova/clip-vit-base-patch32" as never),
      ])
      return { det, emb, cls }
    })()
  }
  return _pipelines
}

const toImage = async (input: string | Buffer) => {
  const { RawImage } = await import("@huggingface/transformers")
  return RawImage.read(input)
}

/** Detect searchable components and return dot positions (0-100 % of image dims). */
export const detectComponents = async (image: string | Buffer) => {
  const { det, cls } = await loadPipelines()
  const img = await toImage(image)
  const detections: Det[] = await det(img, { threshold: 0.35, percentage: true } as never)

  const seen = new Map<string, { label: string; x: number; y: number; score: number; box: { x: number; y: number; w: number; h: number } }>()

  for (const d of detections.slice(0, 8)) {
    const { xmin, ymin, xmax, ymax } = d.box
    const crop = await img.crop(xmin, ymin, xmax - xmin, ymax - ymin)
    const [best] = await cls(crop, FASHION_LABELS)
    if (!best || best.score < 0.25) continue

    const label = best.label
    const prev = seen.get(label)
    if (!prev || best.score > prev.score) {
      seen.set(label, {
        label,
        x: ((xmin + xmax) / 2) * 100,
        y: ((ymin + ymax) / 2) * 100,
        score: best.score,
        box: { x: xmin * 100, y: ymin * 100, w: (xmax - xmin) * 100, h: (ymax - ymin) * 100 },
      })
    }
  }
  return { width: img.width, height: img.height, components: [...seen.values()] }
}

/** 512-dim normalized CLIP embedding for an image/crop. */
export const embedImage = async (image: string | Buffer): Promise<number[]> => {
  const { emb } = await loadPipelines()
  const img = await toImage(image)
  const out = await emb(img, { pooling: "mean", normalize: true } as never)
  return Array.from(out.data as Float32Array)
}

export const cosine = (a: number[], b: number[]) => {
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return dot // both vectors are L2-normalized
}
