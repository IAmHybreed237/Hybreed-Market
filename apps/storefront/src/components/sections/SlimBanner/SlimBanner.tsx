import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

const ShieldIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M12 2l7 3v6c0 4.97-3.5 8.59-7 10-3.5-1.41-7-5.03-7-10V5l7-3z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M9 11.5l2.2 2.2L15.5 9.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const SlimBanner = () => {
  return (
    <section
      className="hidden lg:block w-full px-[5px] lg:px-10 mt-4 lg:mt-2 -mb-4"
      data-testid="slim-banner"
    >
      <div className="max-w-[1400px] mx-auto rounded-2xl bg-action-secondary flex items-center justify-center gap-3 px-4 h-10 text-center">
        <span className="text-action shrink-0">
          <ShieldIcon />
        </span>
        <p className="text-sm md:text-base text-primary">
          Every order is{" "}
          <span className="font-semibold text-action">
            protected by Hybreed Escrow
          </span>{" "}
          - your money is held safely until you receive your item.
        </p>
        <LocalizedClientLink
          href="/categories"
          className="hidden md:inline text-sm font-semibold text-action underline underline-offset-2 hover:opacity-80"
        >
          Learn more
        </LocalizedClientLink>
      </div>
    </section>
  )
}
