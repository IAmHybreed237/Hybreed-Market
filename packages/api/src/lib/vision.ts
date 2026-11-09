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

let _emb: Promise<any> | null = null
let _detCls: Promise<{ det: any; cls: any }> | null = null

/** CLIP image embeddings only - used by search queries and product embedding. */
const loadEmbedding = () => {
  if (!_emb) {
    _emb = (async () => {
      const { pipeline } = await import("@huggingface/transformers")
      return pipeline("image-feature-extraction" as never, "Xenova/clip-vit-base-patch32" as never)
    })()
  }
  return _emb
}

/** Object detection + zero-shot labels - only needed for component detection. */
const loadDetection = () => {
  if (!_detCls) {
    _detCls = (async () => {
      const { pipeline } = await import("@huggingface/transformers")
      const [det, cls] = await Promise.all([
        pipeline("object-detection" as never, "Xenova/yolos-tiny" as never),
        pipeline("zero-shot-image-classification" as never, "Xenova/clip-vit-base-patch32" as never),
      ])
      return { det, cls }
    })()
  }
  return _detCls
}

const toImage = async (input: string | Buffer) => {
  const { RawImage } = await import("@huggingface/transformers")
  const source =
    typeof input === "string"
      ? input
      : new Blob([input as unknown as BlobPart])
  return RawImage.read(source)
}

/** Product images are often stored as site-relative paths (/images/...). */
export const resolveImageUrl = (url: string) => {
  if (/^https?:\/\//.test(url)) return url
  const base = (process.env.STOREFRONT_URL || "http://localhost:3000").replace(/\/$/, "")
  return `${base}${url.startsWith("/") ? url : `/${url}`}`
}

/** Detect searchable components and return dot positions (0-100 % of image dims). */
export const detectComponents = async (image: string | Buffer) => {
  const { det, cls } = await loadDetection()
  const img = await toImage(image)
  const detections: Det[] = await det(img, { threshold: 0.35, percentage: true } as never)

  const seen = new Map<string, { label: string; x: number; y: number; score: number; box: { x: number; y: number; w: number; h: number } }>()

  for (const d of detections.slice(0, 8)) {
    const { xmin, ymin, xmax, ymax } = d.box
    const crop = await img.crop([xmin, ymin, xmax, ymax])
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
  const emb = await loadEmbedding()
  const img = await toImage(image)
  const out = await emb(img, { pooling: "mean", normalize: true } as never)
  return Array.from(out.data as Float32Array)
}

const l2normalize = (v: number[]) => {
  let norm = 0
  for (const x of v) norm += x * x
  norm = Math.sqrt(norm) || 1
  return v.map((x) => x / norm)
}

/**
 * Mean CLIP embedding across several product images.
 * Embedding every gallery photo (not just the thumbnail) means detail shots
 * still match buyer photos. Falls back to the first image on failure.
 */
export const embedImagesMean = async (urls: string[]): Promise<number[] | null> => {
  const vectors: number[][] = []
  for (const url of urls.slice(0, 4)) {
    try {
      vectors.push(await embedImage(url))
    } catch {
      // skip unreadable image
    }
  }
  if (!vectors.length) return null
  if (vectors.length === 1) return vectors[0]
  const dim = vectors[0].length
  const mean = new Array(dim).fill(0)
  for (const v of vectors) for (let i = 0; i < dim; i++) mean[i] += v[i] / vectors.length
  return l2normalize(mean)
}

export const cosine = (a: number[], b: number[]) => {
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return dot // both vectors are L2-normalized
}
