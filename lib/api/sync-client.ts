/**
 * Sync API Client - BRX Sync microservice (CardTrader)
 * Usa NEXT_PUBLIC_SYNC_API_URL + /api/v1 per chiamate dirette al server Sync (CORS consentito dal backend).
 * Su 401 (token scaduto) tenta un refresh automatico e ritenta la richiesta una volta.
 */

import { authApi } from '@/lib/api/auth-client';
import { config } from '@/lib/config';
import { useAuthStore } from '@/lib/stores/auth-store';

/** Un solo refresh in corso: le richieste che ricevono 401 attendono questo promise invece di lanciare N refresh. */
let syncRefreshPromise: Promise<string | null> | null = null;

/** Esegue il refresh del token; aggiorna authApi e ritorna il nuovo access token o null. Condiviso tra tutte le richieste 401. */
async function getNewTokenViaRefresh(): Promise<string | null> {
  if (syncRefreshPromise) return syncRefreshPromise;
  syncRefreshPromise = (async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    const refreshToken = localStorage.getItem(config.auth.refreshTokenKey);
    if (!refreshToken) return null;
    try {
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
        credentials: 'same-origin',
      });
      const refreshData = await refreshRes.json().catch(() => ({}));
      const newAccess = (refreshData?.data?.access_token ?? refreshData?.access_token) as string | undefined;
      const newRefresh = (refreshData?.data?.refresh_token ?? refreshData?.refresh_token) as string | undefined;
      if (newAccess) {
        authApi.setToken(newAccess, newRefresh);
        useAuthStore.getState().setToken(newAccess, newRefresh);
        return newAccess;
      }
      return null;
    } catch {
      return null;
    } finally {
      syncRefreshPromise = null;
    }
  })();
  return syncRefreshPromise;
}

/** Base URL for sync requests: forza NEXT_PUBLIC_SYNC_API_URL + /api/v1 (chiamata diretta al server Sync). */
function getSyncBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SYNC_API_URL || 'https://sync.ebartex.com';
  return `${baseUrl.replace(/\/+$/, '')}/api/v1`;
}

export type SyncStatus = 'idle' | 'initial_sync' | 'active' | 'error';

export interface SyncStatusResponse {
  user_id: string;
  sync_status: SyncStatus;
  last_sync_at: string | null;
  last_error: string | null;
  /** True if CardTrader link was removed (no token); user must re-configure. */
  disconnected?: boolean | null;
}

export interface WebhookUrlResponse {
  user_id: string;
  webhook_url: string;
  instructions: {
    step_1: string;
    step_2: string;
    step_3: string;
    step_4: string;
    note?: string;
  };
  webhook_secret_configured: boolean;
}

export interface SyncProgressResponse {
  user_id: string;
  operation_id?: string;
  status: string;
  progress_percent: number;
  total_chunks?: number;
  processed_chunks?: number;
  total_products?: number;
  processed?: number;
  created?: number;
  updated?: number;
  skipped?: number;
  created_at?: string | null;
  completed_at?: string | null;
}

export interface SyncStartResponse {
  status: string;
  task_id: string;
  user_id: string;
  message: string;
}

export interface InventoryItemResponse {
  id: number;
  blueprint_id: number;
  quantity: number;
  price_cents: number;
  properties?: Record<string, unknown> | null;
  external_stock_id?: string | null;
  description?: string | null;
  user_data_field?: string | null;
  graded?: boolean | null;
  updated_at: string;
  created_at?: string | null;
}

export interface InventoryResponse {
  user_id: string;
  items: InventoryItemResponse[];
  total: number;
}

/** Single listing (item for sale) for marketplace by blueprint. */
export interface ListingItem {
  item_id: number;
  seller_id: string;
  seller_display_name: string;
  country: string | null;
  quantity: number;
  price_cents: number;
  condition: string | null;
  mtg_language: string | null;
}

export interface ListingsByBlueprintResponse {
  blueprint_id: number;
  listings: ListingItem[];
}

/** Response from purchase (simulate buyer) endpoint: checks inventory + CardTrader availability then decrements. */
export interface PurchaseItemResponse {
  status: string;
  item_id: number;
  message: string;
  available: boolean;
  quantity_purchased: number;
  quantity_before: number;
  quantity_after: number;
  cardtrader_sync_queued: boolean;
  external_stock_id?: string | null;
  error?: string | null;
}

async function request<T>(
  path: string,
  token: string,
  options: RequestInit = {},
  retried = false
): Promise<T> {
  const t = token?.trim();
  if (!t) {
    const err = new Error('Token required for sync API') as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  const base = getSyncBaseUrl();
  // base = SYNC_API_URL + /api/v1 → path /api/v1/sync/... diventa base + /sync/...
  const pathSuffix = path.startsWith('/api/v1') ? path.replace(/^\/api\/v1/, '') : path;
  const url = path.startsWith('http')
    ? path
    : `${base}${pathSuffix.startsWith('/') ? '' : '/'}${pathSuffix}`;
  const res = await fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: {
      Authorization: `Bearer ${t}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Su 401 (token scaduto): un solo refresh condiviso tra tutte le richieste, poi ritenta una volta
    if (res.status === 401 && !retried && typeof window !== 'undefined') {
      const newAccess = await getNewTokenViaRefresh();
      if (newAccess) {
        return request<T>(path, newAccess, options, true);
      }
    }
    const err = new Error((data.detail as string) || data.message || res.statusText) as Error & { status?: number; data?: unknown };
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

export const syncClient = {
  /**
   * GET /api/v1/sync/status/{userId}
   */
  getSyncStatus(userId: string, token: string): Promise<SyncStatusResponse> {
    return request<SyncStatusResponse>(`/api/v1/sync/status/${userId}`, token, { method: 'GET' });
  },

  /**
   * POST /api/v1/sync/disconnect/{userId}
   * Body: { action: 'suspend' | 'remove' }
   * suspend = set status to idle (keep token). remove = clear token and webhook.
   */
  disconnectSync(
    userId: string,
    token: string,
    action: 'suspend' | 'remove' = 'suspend'
  ): Promise<{ status: string; message: string; action: string; sync_status: string }> {
    return request(`/api/v1/sync/disconnect/${userId}`, token, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },

  /**
   * GET /api/v1/sync/webhook-url/{userId}
   * Returns webhook_url, instructions, webhook_secret_configured.
   */
  getWebhookUrl(userId: string, token: string): Promise<WebhookUrlResponse> {
    return request<WebhookUrlResponse>(`/api/v1/sync/webhook-url/${userId}`, token, { method: 'GET' });
  },

  /**
   * POST /api/v1/sync/setup-test-user
   * Body: { user_id, cardtrader_token }
   */
  setupTestUser(
    body: { user_id: string; cardtrader_token: string },
    token: string
  ): Promise<{ status: string; user_id: string; sync_status: string; webhook_secret_configured: boolean }> {
    return request(`/api/v1/sync/setup-test-user`, token, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * POST /api/v1/sync/start/{userId}?force=false
   */
  startSync(userId: string, token: string, force = false): Promise<SyncStartResponse> {
    const qs = force ? '?force=true' : '';
    return request<SyncStartResponse>(`/api/v1/sync/start/${userId}${qs}`, token, {
      method: 'POST',
    });
  },

  /**
   * GET /api/v1/sync/progress/{userId}
   */
  getSyncProgress(userId: string, token: string): Promise<SyncProgressResponse> {
    return request<SyncProgressResponse>(`/api/v1/sync/progress/${userId}`, token, { method: 'GET' });
  },

  /**
   * GET /api/v1/sync/inventory/{userId}?limit=&offset=
   * Returns { items, total }.
   */
  getInventory(
    userId: string,
    token: string,
    limit = 100,
    offset = 0
  ): Promise<InventoryResponse> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    return request<InventoryResponse>(
      `/api/v1/sync/inventory/${userId}?${params.toString()}`,
      token,
      { method: 'GET' }
    );
  },

  /**
   * GET /api/listings?blueprint_id= (public, no auth). Listings per stampa/carta.
   */
  getListingsByBlueprint(blueprintId: number): Promise<ListingsByBlueprintResponse> {
    const url = `/api/listings?blueprint_id=${encodeURIComponent(blueprintId)}`;
    return fetch(url, { method: 'GET', credentials: 'same-origin' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.error && !data?.blueprint_id) throw new Error(data.error || 'Listings failed');
        return data as ListingsByBlueprintResponse;
      });
  },

  /**
   * GET /api/v1/sync/task/{taskId}
   */
  getTaskStatus(taskId: string, token: string): Promise<{
    task_id: string;
    status: string;
    ready: boolean;
    result?: unknown;
    error?: string;
    message?: string;
  }> {
    return request(`/api/v1/sync/task/${taskId}`, token, { method: 'GET' });
  },

  updateInventoryItem(
    userId: string,
    itemId: number,
    body: {
      quantity?: number;
      price_cents?: number;
      description?: string | null;
      user_data_field?: string | null;
      graded?: boolean | null;
      properties?: Record<string, unknown> | null;
    },
    token: string
  ): Promise<{
    status: string;
    item_id: number;
    quantity: number;
    price_cents: number;
    description?: string | null;
    user_data_field?: string | null;
    graded?: boolean | null;
    properties?: Record<string, unknown> | null;
    cardtrader_sync_queued: boolean;
    external_stock_id?: string | null;
    has_external_id: boolean;
    sync_queue_error?: string | null;
    sync_task_id?: string | null;
  }> {
    return request(
      `/api/v1/sync/inventory/${userId}/item/${itemId}`,
      token,
      { method: 'PUT', body: JSON.stringify(body) }
    );
  },

  deleteInventoryItem(
    userId: string,
    itemId: number,
    token: string
  ): Promise<{
    status: string;
    item_id: number;
    cardtrader_sync_queued: boolean;
    external_stock_id?: string | null;
    sync_queue_error?: string | null;
    sync_task_id?: string | null;
  }> {
    return request(
      `/api/v1/sync/inventory/${userId}/item/${itemId}`,
      token,
      { method: 'DELETE' }
    );
  },

  /**
   * POST /api/v1/sync/purchase/{userId}/item/{itemId}
   * Simula acquisto: verifica inventario locale + disponibilità su CardTrader, poi decrementa entrambi (evita doppie vendite).
   */
  purchaseInventoryItem(
    userId: string,
    itemId: number,
    body: { quantity: number },
    token: string
  ): Promise<PurchaseItemResponse> {
    return request<PurchaseItemResponse>(
      `/api/v1/sync/purchase/${userId}/item/${itemId}`,
      token,
      { method: 'POST', body: JSON.stringify(body) }
    );
  },
};

export default syncClient;
