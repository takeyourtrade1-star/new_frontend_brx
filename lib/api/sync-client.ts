/**
 * Sync API Client - BRX Sync microservice
 * Le richieste browser passano esclusivamente dal BFF same-origin /api/sync.
 * Su 401 (token scaduto) tenta un refresh automatico e ritenta la richiesta una volta.
 */

import { tokenManager } from '@/lib/api/refresh-token';

/** Base URL same-origin; le origini dei servizi non entrano nel bundle client. */
function getSyncBaseUrl(): string {
  return '';
}

export type SyncStatus = 'idle' | 'initial_sync' | 'active' | 'error';

export interface SyncStatusResponse {
  user_id: string;
  sync_status: SyncStatus;
  last_sync_at: string | null;
  last_error: string | null;
  /** True if marketplace link was removed (no token); user must re-configure. */
  disconnected?: boolean | null;
  execution_mode: 'demo' | 'partial' | 'real';
  mode_version: number;
  writes_enabled: boolean;
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
  reserved_quantity?: number;
  price_cents: number;
  properties?: Record<string, unknown> | null;
  external_stock_id?: string | null;
  source?: 'cardtrader' | 'trade' | 'internal_test';
  environment?: 'demo' | 'partial' | 'real';
  lifecycle_status?: 'active' | 'sold_out' | 'stale' | 'archived' | 'pending_delete' | 'sync_failed';
  sync_state?: 'synced' | 'pending' | 'accepted' | 'failed' | 'uncertain';
  mapping_status?: 'mapped' | 'unsupported' | 'missing' | 'error';
  row_version?: number;
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

export interface LinkCardtraderResponse {
  status: string;
  user_id: string;
  sync_status: string;
  webhook_secret_configured: boolean;
  execution_mode: 'demo' | 'partial' | 'real';
  mode_version: number;
  writes_enabled: boolean;
}

/** Single listing (item for sale) for marketplace by blueprint. */
export interface ListingItem {
  item_id: number;
  /** EBARTEX marketplace listing UUID when listing_source is marketplace. */
  marketplace_listing_id?: string;
  /** Distinguishes sync inventory rows from brx-marketplace listings. */
  listing_source?: 'sync' | 'marketplace';
  seller_id: string;
  seller_display_name: string;
  country: string | null;
  quantity: number;
  /** Quantity visible but unavailable because an accepted trade holds it. */
  reserved_quantity?: number;
  price_cents: number;
  condition: string | null;
  mtg_language: string | null;
  description?: string | null;
  mtg_foil?: boolean;
  signed?: boolean;
  altered?: boolean;
  graded?: boolean;
  /** Tipo account venditore (da profilo pubblico) */
  seller_account_type?: string | null;
  /** Media recensioni (es. 4.5) — opzionale, da API venditore */
  seller_rating?: number | null;
  /** Numero recensioni — opzionale */
  seller_review_count?: number | null;
  /** Vendite completate — opzionale */
  seller_sales_count?: number | null;
}

export interface ListingsByBlueprintResponse {
  blueprint_id: number;
  listings: ListingItem[];
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
  const isBrowser = typeof window !== 'undefined';
  const normalizedPath = path.replace(/^\/api\/v1\/sync/, '/api/sync');
  const url = path.startsWith('http')
    ? path
    : `${base}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;

  const controller = new AbortController();
  const timeoutMs = 20000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, {
    ...options,
    credentials: isBrowser ? 'same-origin' : options.credentials,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutError = new Error('Sync request timeout. Riprova tra qualche secondo.') as Error & {
        status?: number;
      };
      timeoutError.status = 408;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Su 401: refresh centralizzato — tokenManager deduplicates concurrent calls
    if (res.status === 401 && !retried && typeof window !== 'undefined') {
      const refreshed = await tokenManager.ensureFreshSession();
      if (refreshed) {
        return request<T>(path, t, options, true);
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

  /** Body user_id must match the authoritative JWT subject in the Sync service. */
  linkCardtrader(
    body: { user_id: string; cardtrader_token: string },
    token: string
  ): Promise<LinkCardtraderResponse> {
    return request(`/api/v1/sync/link-cardtrader`, token, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /** POST /api/v1/sync/start/{userId} — initial import only. */
  startSync(userId: string, token: string): Promise<SyncStartResponse> {
    return request<SyncStartResponse>(`/api/v1/sync/start/${userId}`, token, {
      method: 'POST',
    });
  },

  /** POST /api/v1/sync/sync-from-cardtrader/{userId} — safe single-flight reconcile. */
  reconcileFromCardTrader(userId: string, token: string): Promise<SyncStartResponse> {
    return request<SyncStartResponse>(
      `/api/v1/sync/sync-from-cardtrader/${userId}`,
      token,
      { method: 'POST' },
    );
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

};

export default syncClient;
