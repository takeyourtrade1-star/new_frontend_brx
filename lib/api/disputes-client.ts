import { tokenManager } from '@/lib/api/refresh-token';
import type {
  DisputeDetailResponse,
  DisputeListResponse,
  DisputeMessagesResponse,
  DisputeWsTicketResponse,
  MaybeDisputeResponse,
} from '@/types/dispute';

async function request<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
  const res = await fetch(`/api/disputes${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !retried && typeof window !== 'undefined') {
      const refreshed = await tokenManager.ensureFreshSession();
      if (refreshed) {
        return request<T>(path, options, true);
      }
    }
    const msg = data?.detail || data?.error || data?.message || `Disputes API error ${res.status}`;
    const err = new Error(msg) as Error & { status: number; data: unknown };
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

export const disputesApi = {
  listMine(limit = 50, offset = 0): Promise<DisputeListResponse> {
    return request<DisputeListResponse>(`?limit=${limit}&offset=${offset}`);
  },
  get(disputeId: number): Promise<DisputeDetailResponse> {
    return request<DisputeDetailResponse>(`/${disputeId}`);
  },
  getOpenByOrder(orderId: number): Promise<MaybeDisputeResponse> {
    return request<MaybeDisputeResponse>(`/orders/${orderId}/open`);
  },
  open(orderId: number, reason?: string): Promise<DisputeDetailResponse> {
    return request<DisputeDetailResponse>(`/orders/${orderId}/open`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || null }),
    });
  },
  listMessages(disputeId: number, limit = 200, offset = 0): Promise<DisputeMessagesResponse> {
    return request<DisputeMessagesResponse>(`/${disputeId}/messages?limit=${limit}&offset=${offset}`);
  },
  postMessage(disputeId: number, body: string): Promise<{ success: boolean; data: unknown }> {
    return request<{ success: boolean; data: unknown }>(`/${disputeId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  },
  resolveReassign(disputeId: number, reason?: string): Promise<{ success: boolean; data: unknown }> {
    return request<{ success: boolean; data: unknown }>(`/${disputeId}/resolve/reassign`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || null }),
    });
  },
  resolveCancel(disputeId: number, reason?: string): Promise<{ success: boolean; data: unknown }> {
    return request<{ success: boolean; data: unknown }>(`/${disputeId}/resolve/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || null }),
    });
  },
  createWsTicket(disputeId: number): Promise<DisputeWsTicketResponse> {
    return request<DisputeWsTicketResponse>(`/${disputeId}/ws-ticket`, { method: 'POST' });
  },
};
