import { authenticate } from "@medusajs/framework/http"
import { defineMiddlewares } from "@medusajs/medusa"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/auctions/*/bids",
      method: ["POST"],
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
  ],
})
