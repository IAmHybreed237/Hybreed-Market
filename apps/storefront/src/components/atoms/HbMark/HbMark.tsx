/**
 * The Hybreed "hb" brand mark (blue rounded badge).
 * Use anywhere a brand pill/badge is needed instead of a text "HB" span.
 */
export const HbMark = ({
  h = 24,
  className = "",
}: {
  h?: number
  className?: string
}) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="/images/brand-mark.png"
    alt="HB"
    style={{ height: h, width: "auto" }}
    className={`object-contain ${className}`}
  />
)
