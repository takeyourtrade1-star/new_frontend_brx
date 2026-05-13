/**
 * Orders API client.
 *
 * All requests go through ``/api/orders/*`` (same-origin proxy) which forwards
 * to the auction backend. The auth pattern, 401-refresh and idempotency-key
 * handling mirror ``auction-client.ts`` so the user experience is consistent
 * across feature clients.
 */

import { tokenManager } from '@/lib/api/refresh-token';
import type {
  OrderDetailResponse,
  OrderHistoryResponse,
  OrderListResponse,
  OrderStatus,
  PayOrderResponse,
} from '@/types/order';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ebartex_access_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<T> {
  const url = `/api/orders${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && !retried && typeof window !== 'undefined') {
      const newToken = await tokenManager.ensureFreshToken();
      if (newToken) {
        return request<T>(path, options, true);
      }
    }
    const msg =
      data?.detail ||
      data?.error ||
      data?.message ||
      `Orders API error ${res.status}`;
    const err = new Error(msg) as Error & { status: number; data: unknown };
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export interface OrderListParams {
  /** Comma-separated statuses; combined server-side as IN (...) */
  statuses?: OrderStatus[];
  limit?: number;
  offset?: number;
}

function buildListQuery(params?: OrderListParams): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  if (params.statuses && params.statuses.length > 0) {
    sp.set('status', params.statuses.join(','));
  }
  if (params.limit !== undefined) sp.set('limit', String(params.limit));
  if (params.offset !== undefined) sp.set('offset', String(params.offset));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export const ordersApi = {
  listBuyer(params?: OrderListParams): Promise<OrderListResponse> {
    return request<OrderListResponse>(`/buyer${buildListQuery(params)}`);
  },

  listSeller(params?: OrderListParams): Promise<OrderListResponse> {
    return request<OrderListResponse>(`/seller${buildListQuery(params)}`);
  },

  getOrder(orderId: number): Promise<OrderDetailResponse> {
    return request<OrderDetailResponse>(`/${orderId}`);
  },

  getHistory(orderId: number): Promise<OrderHistoryResponse> {
    return request<OrderHistoryResponse>(`/${orderId}/history`);
  },

  payOrder(orderId: number): Promise<PayOrderResponse> {
    return request<PayOrderResponse>(`/${orderId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ confirm: true }),
    });
  },
};
