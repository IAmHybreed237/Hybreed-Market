export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="md:pt-4 bg-[#F5F5F7] min-h-screen">
      {/* hide the header below lg on account pages — applies at SSR so no flash */}
      <style>{`@media (max-width:1023.98px){[data-testid="header"],[data-testid="mobile-header-spacer"]{display:none}}`}</style>
      {children}
    </div>
  )
}
