import { tokenManager } from '@/lib/api/refresh-token';
import type {
  CreateTradeInput,
  TradeAddress,
  TradeHistoryResponse,
  TradeListResponse,
  TradeResponse,
  TradeStatus,
} from '@/types/trade';

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('ebartex_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function idempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `trade-${Date.now()}-${Math.random()}`;
}

async function request<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
  const response = await fetch(`/api/trades${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && !retried && typeof window !== 'undefined') {
      const token = await tokenManager.ensureFreshToken();
      if (token) return request<T>(path, options, true);
    }
    const body = data as { detail?: string; message?: string; code?: string };
    const error = new Error(body.detail || body.message || `Trades API error ${response.status}`) as Error & {
      status: number;
      code?: string;
      data: unknown;
    };
    error.status = response.status;
    error.code = body.code;
    error.data = data;
    throw error;
  }
  return data as T;
}

export interface TradeListParams {
  role?: 'sent' | 'received';
  statuses?: TradeStatus[];
  limit?: number;
  offset?: number;
}

function listQuery(params?: TradeListParams): string {
  const query = new URLSearchParams();
  if (params?.role) query.set('role', params.role);
  if (params?.statuses?.length) query.set('status', params.statuses.join(','));
  if (params?.limit !== undefined) query.set('limit', String(params.limit));
  if (params?.offset !== undefined) query.set('offset', String(params.offset));
  const value = query.toString();
  return value ? `?${value}` : '';
}

function post(path: string, body?: unknown, withIdempotency = false): Promise<TradeResponse> {
  return request<TradeResponse>(path, {
    method: 'POST',
    headers: withIdempotency ? { 'Idempotency-Key': idempotencyKey() } : undefined,
    body: JSON.stringify(body ?? {}),
  });
}

export const tradesApi = {
  list: (params?: TradeListParams) => request<TradeListResponse>(listQuery(params)),
  get: (tradeId: number) => request<TradeResponse>(`/${tradeId}`),
  history: (tradeId: number) => request<TradeHistoryResponse>(`/${tradeId}/history`),
  create: (body: CreateTradeInput) => post('', body, true),
  accept: (tradeId: number, shipAddress: TradeAddress) =>
    post(`/${tradeId}/accept`, { ship_address: shipAddress }),
  decline: (tradeId: number, reason?: string) => post(`/${tradeId}/decline`, { reason }),
  cancel: (tradeId: number, reason?: string) => post(`/${tradeId}/cancel`, { reason }),
  counter: (tradeId: number, body: Omit<CreateTradeInput, 'receiver_id' | 'delivery_method'>) =>
    post(`/${tradeId}/counter`, body, true),
  ship: (tradeId: number, tracking?: { tracking_carrier?: string; tracking_code?: string }) =>
    post(`/${tradeId}/ship`, tracking),
  confirmReceipt: (tradeId: number) => post(`/${tradeId}/confirm-receipt`),
  requestCancel: (tradeId: number) => post(`/${tradeId}/request-cancel`),
  confirmCancel: (tradeId: number) => post(`/${tradeId}/confirm-cancel`),
  assistance: (tradeId: number, reason: string) => post(`/${tradeId}/assistance`, { reason }),
};
