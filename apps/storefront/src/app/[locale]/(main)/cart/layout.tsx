export default function CartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {/* hide the site header below md on the cart page - applies at SSR so no flash */}
      <style>{`@media (max-width:767.98px){[data-testid="header"],[data-testid="mobile-header-spacer"]{display:none}}`}</style>
      {children}
    </div>
  )
}
