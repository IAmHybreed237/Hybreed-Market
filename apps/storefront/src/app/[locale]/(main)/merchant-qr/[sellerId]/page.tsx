import QRCode from "qrcode"

export default async function MerchantQrPage({
  params,
}: {
  params: Promise<{ locale: string; sellerId: string }>
}) {
  const { sellerId } = await params
  const payload = `hbpay:s:${sellerId}`
  const dataUrl = await QRCode.toDataURL(payload, { width: 640, margin: 2 })

  return (
    <main className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px] bg-white rounded-[24px] p-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt="Merchant payment QR" className="w-64 h-64 mx-auto" />
        <h1 className="mt-4 text-[22px] font-semibold text-[#1F1F23]">Merchant payment QR</h1>
        <p className="mt-2 text-[14px] text-[#8A8A96] leading-relaxed">
          Customers scan this with the Hybreed app to pay your wallet directly.
          Print it, put it on your price tags, or share it on WhatsApp and Instagram.
        </p>
        <p className="mt-4 text-[12px] text-[#8A8A96] break-all">{payload}</p>
        <p className="mt-4 text-[12px] text-[#8A8A96]">
          Keep this page private - anyone with the QR can be paid by, not charge you.
        </p>
      </div>
    </main>
  )
}
