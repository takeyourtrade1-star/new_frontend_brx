/**
 * React Query hooks for the orders API.
 *
 * The "DA PAGARE" tab on /ordini/acquisti polls every 30s so a payment that
 * just succeeded shows up without a hard refresh; the "PAGATO" tab can use a
 * larger staleTime since orders don't move around as fast.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { ordersApi, type OrderListParams } from '@/lib/api/orders-client';
import type {
  OrderDetailResponse,
  OrderHistoryResponse,
  OrderListResponse,
  PayOrderResponse,
} from '@/types/order';
import type { NotificationUnreadCountResponse } from '@/types/notification';

const KEYS = {
  all: ['orders'] as const,
  buyer: (params?: OrderListParams) => ['orders', 'buyer', params ?? {}] as const,
  seller: (params?: OrderListParams) => ['orders', 'seller', params ?? {}] as const,
  detail: (id: number) => ['orders', 'detail', id] as const,
  history: (id: number) => ['orders', 'history', id] as const,
};

export function useBuyerOrders(
  params?: OrderListParams,
  options?: Partial<UseQueryOptions<OrderListResponse>>,
) {
  return useQuery({
    queryKey: KEYS.buyer(params),
    queryFn: () => ordersApi.listBuyer(params),
    staleTime: 15_000,
    refetchInterval: 30_000,
    ...options,
  });
}

export function useSellerOrders(
  params?: OrderListParams,
  options?: Partial<UseQueryOptions<OrderListResponse>>,
) {
  return useQuery({
    queryKey: KEYS.seller(params),
    queryFn: () => ordersApi.listSeller(params),
    staleTime: 15_000,
    refetchInterval: 30_000,
    ...options,
  });
}

export function useOrderDetail(
  id: number,
  options?: Partial<UseQueryOptions<OrderDetailResponse>>,
) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => ordersApi.getOrder(id),
    enabled: id > 0,
    staleTime: 15_000,
    ...options,
  });
}

export function useOrderHistory(
  id: number,
  options?: Partial<UseQueryOptions<OrderHistoryResponse>>,
) {
  return useQuery({
    queryKey: KEYS.history(id),
    queryFn: () => ordersApi.getHistory(id),
    enabled: id > 0,
    staleTime: 60_000,
    ...options,
  });
}

/** Mock-payment mutation. On success invalidates the buyer/seller list and
 * the order detail so both views update without a manual refetch. */
export function useMarkOrderPaid() {
  const qc = useQueryClient();
  return useMutation<PayOrderResponse, Error, { orderId: number }>({
    mutationFn: ({ orderId }) => ordersApi.payOrder(orderId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.setQueryData<NotificationUnreadCountResponse>(['notifications', 'unread-count'], (prev) => prev);
      qc.setQueryData(KEYS.detail(res.data.id), { success: true, data: res.data });
    },
  });
}
