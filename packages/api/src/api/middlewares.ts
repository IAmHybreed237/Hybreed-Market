import {
  authenticate,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { defineMiddlewares } from "@medusajs/medusa"
import { WALLET_MODULE } from "../modules/wallet/service"

/**
 * Blocks wallet payment sessions when the customer's Hybreed Balance can't
 * cover the payment collection amount. Runs after optional customer auth so
 * guest checkout with other providers is unaffected.
 */
const walletBalanceGuard = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const providerId = String(req.body?.provider_id ?? "")
  if (!providerId.includes("wallet")) {
    next()
    return
  }

  const customerId = req.auth_context?.actor_id as string | undefined
  if (!customerId) {
    res.status(401).json({ message: "Hybreed Wallet requires a logged-in customer" })
    return
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "payment_collection",
      fields: ["id", "amount", "currency_code"],
      filters: { id: req.params.id as string },
    })
    const amount = Number(data?.[0]?.amount ?? 0)
    if (amount <= 0) {
      next()
      return
    }

    const wallet = req.scope.resolve(WALLET_MODULE)
    const { balance } = await wallet.getBalance(customerId)
    if (balance < amount) {
      res.status(402).json({
        message: `Insufficient Hybreed Wallet balance: have ${balance}, need ${amount} ${data?.[0]?.currency_code ?? "xaf"}`,
      })
      return
    }
    next()
  } catch (err) {
    next(err as Error)
  }
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/auctions/*/bids",
      method: ["POST"],
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/wallet*",
      method: ["GET", "POST"],
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/payment-collections/:id/payment-sessions",
      method: ["POST"],
      middlewares: [
        authenticate("customer", ["session", "bearer"], {
          allowUnauthenticated: true,
        }),
        walletBalanceGuard,
      ],
    },
  ],
})
