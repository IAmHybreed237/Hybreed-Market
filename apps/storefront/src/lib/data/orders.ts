'use server';

import { HttpTypes } from '@medusajs/types';

import { SellerDTO } from '@mercurjs/types';

import { sdk } from '../client';
import medusaError from '../helpers/medusa-error';
import { getAuthHeaders, getCacheOptions } from './cookies';

// TODO: legacy returns endpoints - migrate when the returns module lands
type LooseRoute = {
  query: <T = unknown>(i?: never) => Promise<T>;
  mutate: <T = unknown>(i?: never) => Promise<T>;
  delete: <T = unknown>(i?: never) => Promise<T>;
} & { [k: string]: LooseRoute };
const storeLoose = sdk.store as unknown as LooseRoute;

export const retrieveOrderGroup = async (id: string) => {
  return (
    sdk.store.orderGroups.$id.query({
      $id: id,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        cache: 'no-cache'
      }
    } as never) as unknown as Promise<{ order_group: Record<string, unknown> }>
  )
    .then(({ order_group }) => order_group)
    .catch(err => medusaError(err));
};

export const retrieveOrder = async (id: string) => {
  const next = {
    ...(await getCacheOptions('orders'))
  };

  return (
    sdk.store.orders.$id.query({
      $id: id,
      fields:
        '*payment_collections.payments,*items,*items.metadata,*items.variant,*items.product,*seller,*order_group',
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        next,
        cache: 'force-cache'
      }
    } as never) as unknown as Promise<
      HttpTypes.StoreOrderResponse & { seller: SellerDTO }
    >
  )
    .then(({ order }) => order)
    .catch(err => medusaError(err));
};

export const createReturnRequest = async (data: Record<string, unknown>) => {
  const response = await storeLoose.returnRequest
    .mutate<{ order_return_request: { id: string } }>({
      ...data,
      fetchOptions: { headers: { ...(await getAuthHeaders()) } }
    } as never)
    .catch(err => medusaError(err));

  return response;
};

export const getReturns = async () => {
  return storeLoose.returnRequest
    .query<{
      order_return_requests: Array<
        { line_items: Array<{ created_at: string; reason_id?: string }> } & Record<
          string,
          unknown
        >
      >;
    }>({
      fields: '*line_items.reason_id',
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        cache: 'force-cache'
      }
    } as never)
    .then(res => res)
    .catch(err => medusaError(err));
};

export const retriveReturnMethods = async (order_id: string) => {
  return storeLoose.shippingOptions.return
    .query<{ shipping_options: Array<Record<string, unknown>> }>({
      order_id,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        cache: 'no-cache'
      }
    } as never)
    .then(({ shipping_options }) => shipping_options)
    .catch(() => []);
};

export const listOrders = async (
  limit: number = 10,
  offset: number = 0,
  filters?: Record<string, unknown>
) => {
  const headers = { ...(await getAuthHeaders()) };
  const next = {
    ...(await getCacheOptions('orders'))
  };

  // Mercur marketplace orders live under order groups. The store orders
  // endpoint does not reliably populate the `order_group` link (and we
  // filter it out below), so fetch the groups first and attach them to
  // each order by id. If /store/orders comes back empty we fall back to
  // the orders nested inside the groups.
  const { order_groups = [] } = (await (
    sdk.store.orderGroups.query({
      limit: 100,
      order: '-created_at',
      fetchOptions: { headers, next, cache: 'no-cache' }
    } as never) as unknown as Promise<{ order_groups?: any[] }>
  ).catch(() => ({ order_groups: [] as any[] })));

  const groupByOrderId = new Map<string, any>();
  const ordersFromGroups: any[] = [];
  for (const group of order_groups) {
    for (const order of group.orders ?? []) {
      groupByOrderId.set(order.id, group);
      ordersFromGroups.push(order);
    }
  }

  const orders = await (
    sdk.store.orders.query({
      limit: 100,
      offset: 0,
      order: '-created_at',
      fields:
        '*items,+items.metadata,*items.variant,*items.product,*seller,*order_group,shipping_total,total,created_at,status',
      ...filters,
      fetchOptions: {
        headers,
        next,
        cache: 'no-cache'
      }
    } as never) as unknown as Promise<{
      orders: Array<
        HttpTypes.StoreOrder & {
          seller: { id: string; name: string };
          order_group: { id: string };
        }
      >;
    }>
  )
    .then(({ orders }) => orders)
    .catch(() => [] as any[]);

  const source = orders.length ? orders : ordersFromGroups;

  return source
    .map((order: any) => ({
      ...order,
      order_group:
        order.order_group ??
        groupByOrderId.get(order.id) ??
        order_groups.find((g: any) => g.id === order.order_group_id) ??
        null
    }))
    .filter((order: any) => order.order_group)
    .slice(offset, offset + limit);
};

export const createTransferRequest = async (
  state: {
    success: boolean;
    error: string | null;
    order: HttpTypes.StoreOrder | null;
  },
  formData: FormData
): Promise<{
  success: boolean;
  error: string | null;
  order: HttpTypes.StoreOrder | null;
}> => {
  const id = formData.get('order_id') as string;

  if (!id) {
    return { success: false, error: 'Order ID is required', order: null };
  }

  const headers = { ...(await getAuthHeaders()) };

  return await (
    sdk.store.orders.$id.transfer.request.mutate({
      $id: id,
      fetchOptions: { headers }
    } as never) as unknown as Promise<{ order: HttpTypes.StoreOrder }>
  )
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch(err => ({ success: false, error: err.message, order: null }));
};

export const acceptTransferRequest = async (id: string, token: string) => {
  const headers = { ...(await getAuthHeaders()) };

  return await (
    sdk.store.orders.$id.transfer.accept.mutate({
      $id: id,
      token,
      fetchOptions: { headers }
    } as never) as unknown as Promise<{ order: HttpTypes.StoreOrder }>
  )
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch(err => ({ success: false, error: err.message, order: null }));
};

export const declineTransferRequest = async (id: string, token: string) => {
  const headers = { ...(await getAuthHeaders()) };

  return await (
    sdk.store.orders.$id.transfer.decline.mutate({
      $id: id,
      token,
      fetchOptions: { headers }
    } as never) as unknown as Promise<{ order: HttpTypes.StoreOrder }>
  )
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch(err => ({ success: false, error: err.message, order: null }));
};

export const retrieveReturnReasons = async () => {
  return (
    sdk.store.returnReasons.query({
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        cache: 'force-cache'
      }
    } as never) as unknown as Promise<{
      return_reasons: Array<HttpTypes.StoreReturnReason>;
    }>
  )
    .then(({ return_reasons }) => return_reasons)
    .catch(err => medusaError(err));
};
