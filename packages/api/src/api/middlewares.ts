import {
  authenticate,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { defineMiddlewares } from "@medusajs/medusa"
import { WALLET_MODULE } from "../modules/wallet/service"
import { getInstallmentCredit } from "../lib/installments"
import { storeWishlistMiddlewares } from "./store/wishlist/middlewares"

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
      fields: ["id", "amount", "currency_code", "cart.id"],
      filters: { id: req.params.id as string },
    })
    const pc = data?.[0]
    const amount = Number(pc?.amount ?? 0)
    if (amount <= 0) {
      next()
      return
    }

    const wallet = req.scope.resolve(WALLET_MODULE)
    const { balance } = await wallet.getBalance(customerId)
    if (balance < amount) {
      // Pay-in-Parts: carts containing pip-enabled products may finance the
      // unpaid portion - the wallet balance is allowed to go negative by up
      // to the installment credit, repaid later via MoMo top-ups.
      const credit = await getInstallmentCredit(query, pc?.cart?.id)
      if (amount - balance > credit) {
        res.status(402).json({
          message: `Insufficient Hybreed Wallet balance: have ${balance}, need ${amount} ${pc?.currency_code ?? "xaf"}`,
        })
        return
      }
    }
    next()
  } catch (err) {
    next(err as Error)
  }
}

export default defineMiddlewares({
  routes: [
    ...storeWishlistMiddlewares,
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
      matcher: "/store/product-reviews/*",
      method: ["GET"],
      middlewares: [
        authenticate("customer", ["session", "bearer"], {
          allowUnauthenticated: true,
        }),
      ],
    },
    {
      matcher: "/store/review-actions/*",
      method: ["POST"],
      middlewares: [
        authenticate("customer", ["session", "bearer"], {
          allowUnauthenticated: true,
        }),
      ],
    },
    {
      matcher: "/store/review-authors/*",
      method: ["POST"],
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/seller-follows",
      method: ["GET"],
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/seller-follow/*",
      method: ["POST"],
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/tracking/events",
      method: ["POST"],
      middlewares: [
        authenticate("customer", ["session", "bearer"], {
          allowUnauthenticated: true,
        }),
      ],
    },
    {
      matcher: "/store/push/subscribe",
      method: ["POST"],
      middlewares: [
        authenticate("customer", ["session", "bearer"], {
          allowUnauthenticated: true,
        }),
      ],
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
