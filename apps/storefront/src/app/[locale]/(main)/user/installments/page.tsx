import { retrieveCustomer } from "@/lib/data/customer"
import { listInstallmentPlans } from "@/lib/data/installments"
import { redirect } from "next/navigation"
import InstallmentsClient from "./InstallmentsClient"

export const dynamic = "force-dynamic"

export default async function InstallmentsPage() {
  const user = await retrieveCustomer().catch(() => null)
  if (!user) redirect("/login")

  const plans = await listInstallmentPlans().catch(() => [])

  return (
    <main className="w-full max-w-[1400px] mx-auto px-2 pb-10">
      <InstallmentsClient plans={plans} userName={[user.first_name, user.last_name].filter(Boolean).join(" ") || "Hybreed user"} />
    </main>
  )
}
