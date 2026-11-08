import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"
import { REVIEW_EXTRAS_MODULE } from "../../../../../modules/review-extras/service"
import { translateText } from "../../../../../lib/review-extras"

/** Translates a review's text to FR or EN, cached on the review detail. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const target = (req.body as any)?.target
  if (target !== "en" && target !== "fr") {
    res.status(400).json({ message: "target must be 'en' or 'fr'" })
    return
  }
  const reviewId = req.params.id as string
  const extras = req.scope.resolve(REVIEW_EXTRAS_MODULE) as any
  const reviews = req.scope.resolve(MercurModules.REVIEW) as any

  const review = await reviews.retrieveReview(reviewId).catch(() => null)
  if (!review || review.status !== "published") {
    res.status(404).json({ message: "Review not found" })
    return
  }
  const text = String(review.customer_note ?? "").trim()
  if (!text) {
    res.json({ text: "", target, cached: false })
    return
  }

  const [detail] = await extras.listReviewDetails({ review_id: reviewId })
  const cached = detail?.translations?.[target]
  if (cached) {
    res.json({ text: cached, target, source: detail?.language ?? null, cached: true })
    return
  }

  const out = await translateText(text, target)
  if (!out) {
    res.status(502).json({ message: "Translation unavailable, try again" })
    return
  }

  const translations = { ...(detail?.translations ?? {}), [target]: out.text }
  const language = detail?.language || (out.detected ? out.detected.slice(0, 2) : null)
  if (detail) {
    await extras.updateReviewDetails(detail.id, { translations, language })
  } else {
    await extras.createReviewDetails({ review_id: reviewId, translations, language })
  }

  res.json({ text: out.text, target, source: language, cached: false })
}
