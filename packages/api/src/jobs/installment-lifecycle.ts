import { MedusaContainer } from "@medusajs/framework/types"
import { processInstallmentLifecycle } from "../lib/layaway"

/**
 * Runs every 15 minutes:
 *  1. Sends installment due reminders (T-3d, T-1d, due day).
 *  2. Auto-attempts a wallet debit when an installment comes due.
 *  3. Reconciles pending NotchPay charges server-side.
 *  4. Retries plan completion for fully-paid plans.
 *  5. Expires plans whose installment is past the grace period, applying
 *     the cancellation fee split.
 */
export default async function installmentLifecycleJob(container: MedusaContainer) {
  await processInstallmentLifecycle(container)
}

export const config = {
  name: "installment-lifecycle",
  schedule: "*/15 * * * *",
}
