"use client"

import { usePathname, useRouter } from "next/navigation"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { ArrowLeftIcon } from "@/icons"

export const fieldCls =
  "w-full h-[46px] px-[14px] border border-[#D9D9E0] rounded-[10px] bg-white focus:border-[#1F1F23] focus:outline-none text-[15px] text-[#1F1F23] placeholder:text-[#8A8A96]"

export const Field = ({
  id,
  label,
  hint,
  ...props
}: {
  id: string
  label: string
  hint?: string
} & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label
      htmlFor={id}
      className="block text-[14px] leading-[20px] text-[#1F1F23] mb-1.5"
    >
      {label}
    </label>
    <input id={id} className={fieldCls} {...props} />
    {hint && (
      <p className="mt-1.5 text-[13px] leading-[18px] text-[#8A8A96]">{hint}</p>
    )}
  </div>
)

export const BackLink = ({ href }: { href: string }) => (
  <LocalizedClientLink
    href={href}
    className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#8A8A96] hover:text-[#1F1F23] transition-colors mb-6"
  >
    <ArrowLeftIcon size={16} />
    Back
  </LocalizedClientLink>
)

export const StepShell = ({
  step,
  total = 5,
  title,
  sub,
  back,
  children,
}: {
  step: number
  total?: number
  title: string
  sub?: React.ReactNode
  back?: string
  children: React.ReactNode
}) => (
  <div className="w-full">
    {back && <BackLink href={back} />}
    <div className="lg:flex lg:items-start lg:justify-center lg:gap-16 xl:gap-24">
      <div className="lg:w-[380px] xl:w-[440px] lg:shrink-0 lg:pt-1">
        <p className="text-[13px] font-medium text-[#8A8A96] mb-2">
          Step {step} of {total}
        </p>
        <h1 className="text-[28px] leading-[34px] lg:text-[40px] lg:leading-[48px] font-extrabold tracking-[-0.02em] text-[#1F1F23]">
          {title}
        </h1>
        {sub && (
          <p className="mt-3 text-[15px] lg:text-[16px] leading-[22px] text-[#1F1F23]">
            {sub}
          </p>
        )}
      </div>
      <div className="mt-8 lg:mt-1 w-full max-w-[420px] lg:w-[420px] lg:shrink-0">
        {children}
      </div>
    </div>
  </div>
)

/** navigate while keeping the locale prefix (/dk/partners/...) */
export const useStepNav = () => {
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split("/")[1]
  return (to: string) => router.push(`/${locale}${to}`)
}
