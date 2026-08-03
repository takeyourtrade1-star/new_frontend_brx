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
import { useAuthStore } from '@/lib/stores/auth-store';

const KEYS = {
  all: ['orders'] as const,
  buyer: (owner: string, params?: OrderListParams) => ['orders', owner, 'buyer', params ?? {}] as const,
  seller: (owner: string, params?: OrderListParams) => ['orders', owner, 'seller', params ?? {}] as const,
  detail: (owner: string, id: number) => ['orders', owner, 'detail', id] as const,
  history: (owner: string, id: number) => ['orders', owner, 'history', id] as const,
};

export function useBuyerOrders(
  params?: OrderListParams,
  options?: Partial<UseQueryOptions<OrderListResponse>>,
) {
  const owner = useAuthStore((state) => state.user?.id || 'anonymous');
  return useQuery({
    queryKey: KEYS.buyer(owner, params),
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
  const owner = useAuthStore((state) => state.user?.id || 'anonymous');
  return useQuery({
    queryKey: KEYS.seller(owner, params),
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
  const owner = useAuthStore((state) => state.user?.id || 'anonymous');
  return useQuery({
    queryKey: KEYS.detail(owner, id),
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
  const owner = useAuthStore((state) => state.user?.id || 'anonymous');
  return useQuery({
    queryKey: KEYS.history(owner, id),
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
  const owner = useAuthStore((state) => state.user?.id || 'anonymous');
  return useMutation<PayOrderResponse, Error, { orderId: number }>({
    mutationFn: ({ orderId }) => ordersApi.payOrder(orderId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      // invalidateQueries(['notifications']) copre già ['notifications','unread-count'];
      // il vecchio setQueryData(prev => prev) era un no-op ed è stato rimosso.
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.setQueryData(KEYS.detail(owner, res.data.id), { success: true, data: res.data });
    },
  });
}
