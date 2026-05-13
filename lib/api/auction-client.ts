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
  ProxyLimitPayload,
  ProxyLimitResponse,
  AuctionCreatePayload,
  SavedAuctionListResponse,
  SavedAuctionStatusResponse,
} from '@/types/auction';
import { refreshAccessToken } from '@/lib/api/refresh-token';
import { authApi } from '@/lib/api/auth-client';
import { useAuthStore } from '@/lib/stores/auth-store';

export function createIdempotencyKey(): string {
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `bid-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ebartex_access_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const REQUEST_TIMEOUT_MS = 15_000;
const NETWORK_RETRY_DELAY_MS = 900;

function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return /load failed|failed to fetch|network request failed|networkerror|the network connection was lost|connessione non riuscita/i.test(
    err.message,
  );
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      throw new Error('Connessione non riuscita. Verifica la rete e riprova.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retried = false,
  networkRetry = false,
): Promise<T> {
  const url = `/api/auctions${path}`;
  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  };

  let res: Response;
  try {
    res = await fetchWithTimeout(url, mergedOptions);
  } catch (err) {
    // One automatic retry for transient network errors (e.g. Safari "Load failed")
    if (!networkRetry && isNetworkError(err)) {
      await new Promise((resolve) => setTimeout(resolve, NETWORK_RETRY_DELAY_MS));
      return request<T>(path, options, retried, true);
    }
    throw new Error('Connessione non riuscita. Verifica la rete e riprova.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && !retried && typeof window !== 'undefined') {
      const result = await refreshAccessToken();
      if (result) {
        authApi.setToken(result.accessToken, result.refreshToken);
        useAuthStore.getState().setToken(result.accessToken, result.refreshToken);
        return request<T>(path, options, true, networkRetry);
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
    const idempotencyKey = createIdempotencyKey();
    return request<PlaceBidResponse>(`/${auctionId}/bids`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
  },

  updateProxyLimit(
    auctionId: number,
    payload: ProxyLimitPayload
  ): Promise<ProxyLimitResponse> {
    return request<ProxyLimitResponse>(`/${auctionId}/proxy-limit`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  cancelProxyLimit(auctionId: number): Promise<ProxyLimitResponse> {
    return request<ProxyLimitResponse>(`/${auctionId}/proxy-limit`, {
      method: 'DELETE',
    });
  },
};

async function savedRequest<T>(
  path: string,
  options: RequestInit = {},
  retried = false,
  networkRetry = false,
): Promise<T> {
  const url = `/api/saved-auctions${path}`;
  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  };

  let res: Response;
  try {
    res = await fetchWithTimeout(url, mergedOptions);
  } catch (err) {
    if (!networkRetry && isNetworkError(err)) {
      await new Promise((resolve) => setTimeout(resolve, NETWORK_RETRY_DELAY_MS));
      return savedRequest<T>(path, options, retried, true);
    }
    throw new Error('Connessione non riuscita. Verifica la rete e riprova.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !retried && typeof window !== 'undefined') {
      const result = await refreshAccessToken();
      if (result) {
        authApi.setToken(result.accessToken, result.refreshToken);
        useAuthStore.getState().setToken(result.accessToken, result.refreshToken);
        return savedRequest<T>(path, options, true, networkRetry);
      }
    }
    const msg = data?.detail || data?.error || data?.message || `Saved API error ${res.status}`;
    const err = new Error(msg) as Error & { status: number; data: unknown };
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

export const savedApi = {
  saveAuction(auctionId: number): Promise<SavedAuctionStatusResponse> {
    return savedRequest<SavedAuctionStatusResponse>(`/${auctionId}`, { method: 'POST' });
  },
  unsaveAuction(auctionId: number): Promise<void> {
    return savedRequest<void>(`/${auctionId}`, { method: 'DELETE' });
  },
  getSavedStatus(auctionId: number): Promise<SavedAuctionStatusResponse> {
    return savedRequest<SavedAuctionStatusResponse>(`/me/${auctionId}`);
  },
  listSaved(params?: { limit?: number; offset?: number }): Promise<SavedAuctionListResponse> {
    const sp = new URLSearchParams();
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.offset) sp.set('offset', String(params.offset));
    const qs = sp.toString();
    return savedRequest<SavedAuctionListResponse>(`/me${qs ? `?${qs}` : ''}`);
  },
};
