/**
 * Auction API client — calls same-origin proxy /api/auctions/* which forwards to auction.ebartex.com.
 * Attaches auth Bearer token when available. On 401 retries once after refreshing the token.
 */

import type {
  AuctionListResponse,
  AuctionDetailResponse,
  BidListResponse,
  MinimumBidResponse,
  PlaceBidResponse,
  PlaceBidPayload,
  AuctionCreatePayload,
} from '@/types/auction';
import { refreshAccessToken } from '@/lib/api/refresh-token';
import { authApi } from '@/lib/api/auth-client';
import { useAuthStore } from '@/lib/stores/auth-store';

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
  const url = `/api/auctions${path}`;
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
      const result = await refreshAccessToken();
      if (result) {
        authApi.setToken(result.accessToken, result.refreshToken);
        useAuthStore.getState().setToken(result.accessToken, result.refreshToken);
        return request<T>(path, options, true);
      }
    }
    const msg =
      data?.detail ||
      data?.error ||
      data?.message ||
      `Auction API error ${res.status}`;
    const err = new Error(msg) as Error & { status: number; data: unknown };
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export const auctionApi = {
  listAuctions(params?: {
    q?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuctionListResponse> {
    const sp = new URLSearchParams();
    if (params?.q) sp.set('q', params.q);
    if (params?.status) sp.set('status', params.status);
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.offset) sp.set('offset', String(params.offset));
    const qs = sp.toString();
    return request<AuctionListResponse>(`${qs ? `?${qs}` : ''}`);
  },

  getAuction(id: number): Promise<AuctionDetailResponse> {
    return request<AuctionDetailResponse>(`/${id}`);
  },

  createAuction(
    payload: AuctionCreatePayload
  ): Promise<{ success: boolean; data: import('@/types/auction').AuctionAPI }> {
    return request(``, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateAuction(
    id: number,
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; data: import('@/types/auction').AuctionAPI }> {
    return request(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteAuction(
    id: number
  ): Promise<{ success: boolean; data?: unknown; message?: string }> {
    return request(`/${id}`, {
      method: 'DELETE',
    });
  },

  listBids(
    auctionId: number,
    params?: { limit?: number; offset?: number }
  ): Promise<BidListResponse> {
    const sp = new URLSearchParams();
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.offset) sp.set('offset', String(params.offset));
    const qs = sp.toString();
    return request<BidListResponse>(
      `/${auctionId}/bids${qs ? `?${qs}` : ''}`
    );
  },

  getMinimumBid(auctionId: number): Promise<MinimumBidResponse> {
    return request<MinimumBidResponse>(`/${auctionId}/minimum-bid`);
  },

  placeBid(
    auctionId: number,
    payload: PlaceBidPayload
  ): Promise<PlaceBidResponse> {
    return request<PlaceBidResponse>(`/${auctionId}/bids`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
