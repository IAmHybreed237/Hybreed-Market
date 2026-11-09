// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WALLET_MODULE } from "../../../../../modules/wallet/service"

/**
 * POST /admin/wallet/topups/:id - approve or reject a top-up request.
 * Body: { action: "approve" | "reject", review_note? }
 * Approval credits the customer's wallet balance.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(WALLET_MODULE)
  const action = req.body?.action as string | undefined

  if (action !== "approve" && action !== "reject") {
    res.status(400).json({ message: "action must be 'approve' or 'reject'" })
    return
  }

  const reviewedBy =
    (req.auth_context?.actor_id as string | undefined) ?? undefined

  try {
    const topup =
      action === "approve"
        ? await service.approveTopUp({
            topupId: req.params.id,
            reviewedBy,
            reviewNote: req.body?.review_note
              ? String(req.body.review_note)
              : undefined,
          })
        : await service.rejectTopUp({
            topupId: req.params.id,
            reviewedBy,
            reviewNote: req.body?.review_note
              ? String(req.body.review_note)
              : undefined,
          })
    res.json({ topup })
  } catch (e: any) {
    res.status(e?.status ?? 500).json({ message: e?.message ?? "Failed" })
  }
}
