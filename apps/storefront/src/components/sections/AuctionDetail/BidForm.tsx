"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { placeBid } from "@/lib/data/auctions";
import { convertToLocale } from "@/lib/helpers/money";

export function BidForm({
  auctionId,
  minBid,
  currency,
  depositAmount,
  isAuthed,
  loginUrl,
}: {
  auctionId: string;
  minBid: number;
  currency: string;
  depositAmount: number | null;
  isAuthed: boolean;
  loginUrl: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(minBid));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const fmt = (v: number) =>
    convertToLocale({ amount: v, currency_code: currency });

  const submit = () => {
    setError(null);
    setSuccess(null);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid amount");
      return;
    }
    startTransition(async () => {
      const res = await placeBid(auctionId, value);
      if (res.ok) {
        setSuccess("Bid placed!");
        router.refresh();
      } else {
        setError(res.message || "Bid failed");
      }
    });
  };

  if (!isAuthed) {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600 mb-3">
          Sign in to place a bid.
        </p>
        <a
          href={loginUrl}
          className="inline-block bg-black text-white px-4 py-2 rounded text-sm font-medium"
        >
          Sign in
        </a>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <label className="block text-sm font-medium mb-1">
        Your max bid (minimum {fmt(minBid)})
      </label>
      <div className="flex gap-2">
        <input
          type="number"
          min={minBid}
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <button
          onClick={submit}
          disabled={pending}
          className="bg-black text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
        >
          {pending ? "Bidding..." : "Place bid"}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        You only pay the standing price if you win - enter your true maximum.
        {depositAmount
          ? ` A ${fmt(depositAmount)} deposit is required for this auction.`
          : ""}
      </p>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {success && <p className="text-sm text-green-700 mt-2">{success}</p>}
    </div>
  );
}
