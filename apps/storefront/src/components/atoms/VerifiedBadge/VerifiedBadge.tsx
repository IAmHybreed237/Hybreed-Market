export const VerifiedBadge = ({ size = 16 }: { size?: number }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="/images/verified-badge.png"
    alt="Verified seller"
    width={size}
    height={size}
    className="inline-block shrink-0 align-middle"
    style={{ width: size, height: size }}
  />
)
