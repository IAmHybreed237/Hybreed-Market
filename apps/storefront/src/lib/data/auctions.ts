'use server';

import { getAuthHeaders } from './cookies';

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string;

export interface Auction {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'scheduled' | 'live' | 'ended' | 'canceled';
  offer_id: string;
  product_id: string | null;
  seller_id: string;
  currency_code: string;
  starting_price: number | { value: string; precision: number } | null;
  bid_increment: number | { value: string; precision: number } | null;
  current_price: number | { value: string; precision: number } | null;
  leading_bid_id: string | null;
  reserve_price: number | { value: string; precision: number } | null;
  buy_now_price: number | { value: string; precision: number } | null;
  deposit_amount: number | { value: string; precision: number } | null;
  start_at: string;
  end_at: string;
  winner_id: string | null;
  winning_bid_id: string | null;
  ended_at: string | null;
  extension_count: number;
}

export interface AuctionBid {
  id: string;
  bidder_id: string;
  amount: number;
  standing_amount: number | null;
  status: string;
  created_at: string;
}

const num = (v: Auction['current_price']): number => {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return Number(v.value);
};

export const auctionPrice = num;

const headers = async (auth = false) => ({
  'Content-Type': 'application/json',
  'x-publishable-api-key': PUBLISHABLE_KEY,
  ...(auth ? await getAuthHeaders() : {}),
});

export const listAuctions = async (status?: string): Promise<Auction[]> => {
  const qs = status ? `?status=${status}` : '';
  const res = await fetch(`${BACKEND_URL}/store/auctions${qs}`, {
    headers: await headers(),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.auctions ?? [];
};

export const getAuction = async (
  id: string
): Promise<{ auction: Auction; bids: AuctionBid[] } | null> => {
  const res = await fetch(`${BACKEND_URL}/store/auctions/${id}`, {
    headers: await headers(),
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
};

export const placeBid = async (
  auctionId: string,
  amount: number,
  depositReference?: string
): Promise<{ ok: boolean; message?: string; effects?: unknown }> => {
  const res = await fetch(`${BACKEND_URL}/store/auctions/${auctionId}/bids`, {
    method: 'POST',
    headers: await headers(true),
    body: JSON.stringify({ amount, deposit_reference: depositReference }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, message: data.message || 'Bid failed' };
  }
  return { ok: true, effects: data.effects };
};
