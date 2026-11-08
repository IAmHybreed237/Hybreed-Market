import { model } from "@medusajs/framework/utils"

/** Extra per-review data Mercur's Review model doesn't carry. */
export const ReviewDetail = model.define("review_detail", {
  id: model.id({ prefix: "revd" }).primaryKey(),
  review_id: model.text().unique(),
  product_id: model.text().nullable().index(),
  variant_id: model.text().nullable(),
  variant_label: model.text().nullable(),
  language: model.text().nullable(), // "fr" | "en" | ...
  translations: model.json().nullable(), // { en: "...", fr: "..." }
  edited_at: model.dateTime().nullable(),
  is_demo: model.boolean().default(false),
})

export const ReviewMedia = model.define("review_media", {
  id: model.id({ prefix: "revm" }).primaryKey(),
  review_id: model.text().index(),
  product_id: model.text().index(),
  type: model.enum(["image", "video"]).default("image"),
  url: model.text(),
  thumbnail_url: model.text().nullable(),
  rank: model.number().default(0),
})

export const ReviewReaction = model.define("review_reaction", {
  id: model.id({ prefix: "revr" }).primaryKey(),
  review_id: model.text().index(),
  actor_key: model.text(), // customer id or anonymous device id
  type: model.enum(["like", "heart", "clap"]),
})

export const ReviewReport = model.define("review_report", {
  id: model.id({ prefix: "revp" }).primaryKey(),
  review_id: model.text().index(),
  actor_key: model.text(),
  reason: model.text().nullable(),
})

export const AuthorFollow = model.define("review_author_follow", {
  id: model.id({ prefix: "revf" }).primaryKey(),
  follower_id: model.text().index(), // customer id
  author_id: model.text().index(), // customer id of the review author
})
