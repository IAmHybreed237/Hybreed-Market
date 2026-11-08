import QRCode from "qrcode"
import { createPickupToken } from "@/lib/pickup"

/**
 * Pickup QR for an order group. Rendered server-side so the QR image is
 * part of the page - it keeps working offline once loaded (PWA cache),
 * which matters at pickup points with poor connectivity.
 */
export const PickupQrCard = async ({
  orderGroupId,
  displayId,
}: {
  orderGroupId: string
  displayId?: string | number | null
}) => {
  const token = createPickupToken(orderGroupId)
  const dataUrl = await QRCode.toDataURL(token, { width: 360, margin: 1 })

  return (
    <div className="mt-6 bg-white rounded-[20px] p-5 max-w-[420px]">
      <h2 className="text-[17px] font-semibold text-[#1F1F23]">Pickup QR</h2>
      <p className="text-[13px] text-[#8A8A96] mt-1">
        Show this code at pickup. It works once - a new code is generated for
        each order and stays valid for 30 days.
        {displayId != null && <> Order #{displayId}.</>}
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt="Order pickup QR code" className="mt-4 w-48 h-48 mx-auto" />
      <p className="mt-3 text-center text-[11px] text-[#8A8A96] break-all px-2">{token}</p>
      <p className="mt-2 text-[12px] text-[#8A8A96] text-center">
        No signal? The code still works - the seller can confirm with your
        order number and phone number instead.
      </p>
    </div>
  )
}
