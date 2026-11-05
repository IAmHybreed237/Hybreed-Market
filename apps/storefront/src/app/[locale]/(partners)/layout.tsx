import { redirect } from "next/navigation"
import { checkRegion } from "@/lib/helpers/check-region"
import { PartnersHeader } from "@/components/sections/Partners/PartnersHeader"
import { ScrollReset } from "@/components/sections/Partners/ScrollReset"

export default async function PartnersLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  if (!(await checkRegion(locale))) return redirect("/")

  return (
    <div className="min-h-screen bg-[#F6F6F8] text-[#1F1F23]">
      <ScrollReset />
      <PartnersHeader />
      {children}
    </div>
  )
}
