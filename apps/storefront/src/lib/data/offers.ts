'use server';

import { OfferDTO } from '@mercurjs/types';

import { sdk } from '../client';
import { getAuthHeaders } from './cookies';
import { CACHE_TAGS, getGlobalCacheOptions } from './cache-tags';
import { getRegion } from './regions';
import { getBuyboxWinner, rankOffers, StoreOffer } from '@/lib/helpers/buybox';

// All fields are `+`-prefixed so they MERGE with the route defaults instead of
// replacing them. The defaults carry `product_variant.price_set.id` and the
// `inventory_item_link.*.location_levels` fields that the computed
// `calculated_price` / `inventory_quantity` depend on - dropping them (via an
// unprefixed field) silently yields null prices and zero stock.
const OFFER_FIELDS =
  '+seller.logo,+seller.banner,+seller.is_premium,+seller.name,+seller.handle,' +
  '+calculated_price,+inventory_quantity,+prices,' +
  '+product.id,+product.title,+product.handle,+product.thumbnail';

export const listOffers = async ({
  productId,
  sellerId,
  countryCode,
  regionId,
  limit,
  offset,
}: {
  productId?: string;
  sellerId?: string;
  countryCode?: string;
  regionId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ offers: OfferDTO[]; count: number }> => {
  const region = regionId
    ? { id: regionId }
    : countryCode
      ? await getRegion(countryCode)
      : null;

  const next = getGlobalCacheOptions(
    CACHE_TAGS.offers,
    productId ? CACHE_TAGS.productOffers(productId) : undefined
  );

  return (
    sdk.store.offers.query({
      product_id: productId,
      seller_id: sellerId,
      region_id: region?.id,
      country_code: countryCode,
      limit,
      offset,
      fields: OFFER_FIELDS,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        cache: 'force-cache',
        next,
      },
    } as never) as unknown as Promise<{ offers: OfferDTO[]; count: number }>
  )
    .then(({ offers, count }) => ({ offers, count }))
    .catch(() => ({ offers: [], count: 0 }));
};

/**
 * Mercur products have no seller of their own - sellers attach to offers.
 * Listing cards still need a seller name, so this maps each product id to the
 * seller of its buybox-winning offer.
 */
export const getProductSellerMap = async ({
  countryCode,
  regionId,
}: {
  countryCode?: string;
  regionId?: string;
}): Promise<
  Record<
    string,
    { id: string; name: string; handle?: string; is_premium?: boolean }
  >
> => {
  const { offers } = await listOffers({ countryCode, regionId, limit: 200 });

  const byProduct = new Map<string, StoreOffer[]>();
  for (const offer of offers as StoreOffer[]) {
    const productId = (offer as { product_id?: string }).product_id;
    if (!productId) continue;
    const list = byProduct.get(productId) ?? [];
    list.push(offer);
    byProduct.set(productId, list);
  }

  const map: Record<
    string,
    { id: string; name: string; handle?: string; is_premium?: boolean }
  > = {};
  for (const [productId, list] of byProduct) {
    const seller = getBuyboxWinner(rankOffers(list))?.seller as
      | {
          id?: string
          name?: string
          handle?: string
          is_premium?: boolean
        }
      | undefined;
    if (seller?.id && seller?.name) {
      map[productId] = {
        id: seller.id,
        name: seller.name,
        handle: seller.handle,
        is_premium: seller.is_premium,
      };
    }
  }
  return map;
};

/**
 * Flags products whose displayed (buybox) price is the lowest purchasable
 * offer for that product across sellers. Requires at least 2 competing
 * sellers - with a single seller "best price" is meaningless.
 */
export const getBestPriceProductIds = async ({
  products,
  countryCode,
  regionId,
}: {
  products: any[];
  countryCode?: string;
  regionId?: string;
}): Promise<Set<string>> => {
  const ids = (products || []).map((p) => p?.id).filter(Boolean);
  if (!ids.length) return new Set();

  const region = regionId
    ? { id: regionId }
    : countryCode
      ? await getRegion(countryCode)
      : null;

  const { offers } = await (
    sdk.store.offers.query({
      product_id: ids,
      region_id: region?.id,
      country_code: countryCode,
      limit: Math.min(500, Math.max(50, ids.length * 10)),
      fields:
        '+calculated_price,+product.id,+variant_id,+inventory_quantity,+seller.id',
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        cache: 'force-cache',
        next: getGlobalCacheOptions(CACHE_TAGS.offers),
      },
    } as never) as unknown as Promise<{ offers: any[]; count: number }>
  ).catch(() => ({ offers: [], count: 0 }));

  const byProduct = new Map<string, any[]>();
  for (const o of offers || []) {
    const pid = o?.product_id ?? o?.product?.id;
    if (!pid) continue;
    const list = byProduct.get(pid) ?? [];
    list.push(o);
    byProduct.set(pid, list);
  }

  const best = new Set<string>();
  for (const p of products || []) {
    const pOffers = byProduct.get(p?.id) ?? [];
    if (pOffers.length < 2) continue;

    const variantId = p?.variants?.[0]?.id;
    const cardPrice =
      p?.variants?.[0]?.calculated_price?.calculated_amount ??
      p?.variants?.[0]?.prices?.find(
        (pr: any) => String(pr.currency_code || '').toLowerCase() === 'xaf'
      )?.amount ??
      null;
    if (cardPrice == null) continue;

    const sellers = new Set<string>();
    let min = Infinity;
    for (const o of pOffers) {
      if (variantId && o?.variant_id && o.variant_id !== variantId) continue;
      const amt = o?.calculated_price?.calculated_amount;
      const stock = o?.inventory_quantity ?? 0;
      if (amt == null || stock <= 0) continue;
      sellers.add(String(o?.seller_id ?? o?.seller?.id ?? ""));
      if (amt < min) min = amt;
    }
    if (sellers.size >= 2 && cardPrice <= min + 0.5) best.add(p.id);
  }
  return best;
};

export const retrieveOffer = async (
  id: string,
  { countryCode, regionId }: { countryCode?: string; regionId?: string } = {}
): Promise<OfferDTO | null> => {
  const region = regionId
    ? { id: regionId }
    : countryCode
      ? await getRegion(countryCode)
      : null;

  return (
    sdk.store.offers.$id.query({
      $id: id,
      region_id: region?.id,
      country_code: countryCode,
      fields: OFFER_FIELDS,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        cache: 'force-cache',
        next: getGlobalCacheOptions(CACHE_TAGS.offers, CACHE_TAGS.offer(id)),
      },
    } as never) as unknown as Promise<{ offer: OfferDTO }>
  )
    .then(({ offer }) => offer)
    .catch(() => null);
};
