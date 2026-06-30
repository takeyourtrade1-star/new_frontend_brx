/**
 * Marketplace API Client — brx-marketplace microservice (port 8004)
 *
 * Routing:
 *  - browser → same-origin proxy /api/marketplace (avoids CORS on mobile)
 *  - server  → direct NEXT_PUBLIC_MARKETPLACE_API_URL/api/v1
 *
 * Auth: all requests attach the user's JWT as Authorization: Bearer <token>
 */

import { config } from '@/lib/config';
import { tokenManager } from '@/lib/api/refresh-token';

function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(config.auth.tokenKey);
}

export type SyncMode = 'demo' | 'partial' | 'real';

/** Thrown when the marketplace API returns a non-2xx response. */
export class MarketplaceApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'MarketplaceApiError';
    this.status = status;
    this.detail = detail;
  }
}

function parseMarketplaceErrorBody(body: string, status: number): string {
  if (!body.trim()) {
    return status === 401
      ? 'Sessione scaduta. Effettua di nuovo l\'accesso.'
      : `Errore del marketplace (${status}).`;
  }
  try {
    const json = JSON.parse(body) as {
      detail?: string | Array<{ msg?: string } | string>;
    };
    if (typeof json.detail === 'string') return json.detail;
    if (Array.isArray(json.detail)) {
      return json.detail
        .map((item) =>
          typeof item === 'string' ? item : (item.msg ?? JSON.stringify(item)),
        )
        .join(', ');
    }
  } catch {
    /* plain text body */
  }
  return body.length > 240 ? `${body.slice(0, 240)}…` : body;
}

export interface MarketplaceSyncStatus {
  user_id: string;
  sync_mode: SyncMode;
  is_active: boolean;
  last_sync_event_at: string | null;
  total_listings: number;
  synced_listings: number;
  pending_events: number;
}

export interface MarketplaceSyncConfig {
  id: string;
  user_id: string;
  sync_mode: SyncMode;
  cardtrader_seller_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function getMarketplaceBaseUrl(): string {
  if (typeof window !== 'undefined') return '/api/marketplace';
  const base = process.env.NEXT_PUBLIC_MARKETPLACE_API_URL || 'https://marketplace-api.ebartex.com';
  return `${base.replace(/\/+$/, '')}/api/v1`;
}

const MARKETPLACE_FETCH_TIMEOUT_MS = 10000;

const MARKETPLACE_TIMEOUT_MESSAGE =
  'Marketplace non raggiungibile (timeout). Riprova tra poco.';

async function marketplaceFetch<T>(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<T> {
  const token = getStoredAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MARKETPLACE_FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${getMarketplaceBaseUrl()}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new MarketplaceApiError(504, MARKETPLACE_TIMEOUT_MESSAGE);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 401 && !retried && typeof window !== 'undefined') {
    const newToken = await tokenManager.ensureFreshToken();
    if (newToken) {
      return marketplaceFetch<T>(path, options, true);
    }
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 504) {
      throw new MarketplaceApiError(504, MARKETPLACE_TIMEOUT_MESSAGE);
    }
    throw new MarketplaceApiError(res.status, parseMarketplaceErrorBody(body, res.status));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// ── Sync mode ─────────────────────────────────────────────────────────────────

export async function getMarketplaceSyncStatus(): Promise<MarketplaceSyncStatus> {
  return marketplaceFetch<MarketplaceSyncStatus>('/sync/status');
}

export async function updateMarketplaceSyncMode(
  mode: SyncMode,
): Promise<MarketplaceSyncConfig> {
  return marketplaceFetch<MarketplaceSyncConfig>('/sync/mode', {
    method: 'PUT',
    body: JSON.stringify({ sync_mode: mode }),
  });
}

export async function triggerMarketplaceSync(): Promise<SyncTriggerResponse> {
  return marketplaceFetch<SyncTriggerResponse>('/sync/trigger', { method: 'POST' });
}

/** Alias for triggerMarketplaceSync. */
export const triggerSync = triggerMarketplaceSync;

// ── Listings ──────────────────────────────────────────────────────────────────

export type CardCondition = 'NM' | 'EX' | 'VG' | 'G' | 'P';

export type ListingStatus =
  | 'active'
  | 'sold'
  | 'cancelled'
  | 'pending_sync'
  | 'sync_failed';

export interface ListingCreate {
  card_id: string;
  cardtrader_blueprint_id?: number | null;
  title: string;
  price: number;
  quantity: number;
  condition?: CardCondition;
  language?: string;
}

export interface ListingUpdate {
  title?: string;
  price?: number;
  quantity?: number;
  condition?: CardCondition;
  language?: string;
}

export interface ListingResponse {
  id: string;
  user_id: string;
  card_id: string;
  cardtrader_blueprint_id: number | null;
  cardtrader_article_id: number | null;
  title: string;
  price: string;
  quantity: number;
  condition: CardCondition;
  language: string;
  status: ListingStatus;
  sync_mode_at_creation: string;
  cardtrader_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingListResponse {
  items: ListingResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface SyncTriggerResponse {
  status: string;
  message: string;
  user_id: string;
  sync_mode: SyncMode;
}

export async function createListing(body: ListingCreate): Promise<ListingResponse> {
  return marketplaceFetch<ListingResponse>('/listings', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getMyListings(params?: {
  page?: number;
  page_size?: number;
  status_filter?: ListingStatus;
}): Promise<ListingListResponse> {
  const qs = new URLSearchParams();
  if (params?.page != null) qs.set('page', String(params.page));
  if (params?.page_size != null) qs.set('page_size', String(params.page_size));
  if (params?.status_filter) qs.set('status_filter', params.status_filter);
  const query = qs.toString();
  return marketplaceFetch<ListingListResponse>(`/listings${query ? `?${query}` : ''}`);
}

export async function updateListing(
  listingId: string,
  body: ListingUpdate,
): Promise<ListingResponse> {
  return marketplaceFetch<ListingResponse>(`/listings/${listingId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function cancelListing(listingId: string): Promise<void> {
  await marketplaceFetch<void>(`/listings/${listingId}`, { method: 'DELETE' });
}

export interface PublicListingResponse {
  id: string;
  seller_id: string;
  card_id: string;
  cardtrader_blueprint_id: number | null;
  title: string;
  price: string;
  quantity: number;
  condition: CardCondition;
  language: string;
  created_at: string;
}

export interface PublicListingListResponse {
  blueprint_id: number;
  items: PublicListingResponse[];
  total: number;
}

/** Public catalog listings for a blueprint (no auth required). */
export async function getPublicListingsByBlueprint(
  blueprintId: number,
  cardId?: string,
): Promise<PublicListingListResponse> {
  const qs = new URLSearchParams();
  if (cardId) qs.set('card_id', cardId);
  const query = qs.toString();
  return marketplaceFetch<PublicListingListResponse>(
    `/listings/public/by-blueprint/${blueprintId}${query ? `?${query}` : ''}`,
  );
}

/** Una carta del feed "best sellers" pubblico: ha almeno una listing attiva. */
export interface PublicBestSellerItem {
  card_id: string;
  blueprint_id: number | null;
  name: string;
  set_name: string;
  image: string | null;
  game_slug: string;
  /** Prezzo della listing attiva più economica (euro, stringa es. "12.50"). */
  min_price: string | null;
  /** Numero di listing attive su questa carta (venditori registrati). */
  listings_count: number;
  /** Vendite completate — segnale di ranking (opzionale). */
  sales_count?: number;
}

export interface PublicBestSellersResponse {
  items: PublicBestSellerItem[];
  total: number;
}

/**
 * Feed pubblico "best sellers": carte con listing attive dei venditori registrati,
 * ordinate per popolarità (`sales_count`). Nessuna auth.
 *
 * ⚠️ CONTRATTO BACKEND da implementare in brx-marketplace:
 *   GET /api/v1/listings/public/best-sellers?game=mtg&limit=12
 *   → { items: PublicBestSellerItem[], total: number }
 *   Il path sotto `listings/public/` è già instradato come GET pubblico dal proxy
 *   (app/api/marketplace/[...path]/route.ts). Finché l'endpoint non esiste la fetch
 *   fallisce e il chiamante fa fallback al catalogo (vedi useBestSellers + MarketplaceDashboard).
 */
export async function getPublicBestSellers(params: {
  game?: string;
  limit?: number;
}): Promise<PublicBestSellersResponse> {
  const qs = new URLSearchParams();
  if (params.game) qs.set('game', params.game);
  if (params.limit != null) qs.set('limit', String(params.limit));
  const query = qs.toString();
  return marketplaceFetch<PublicBestSellersResponse>(
    `/listings/public/best-sellers${query ? `?${query}` : ''}`,
  );
}

// ── Orders ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'mock';

export interface PurchaseRequest {
  listing_id: string;
  quantity: number;
  idempotency_key: string;
}

export interface OrderResponse {
  id: string;
  buyer_user_id: string;
  listing_id: string;
  quantity: number;
  unit_price: string;
  total_amount: string;
  status: OrderStatus;
  is_mock: boolean;
  cardtrader_order_id: number | null;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
  listing_title?: string | null;
  card_id?: string | null;
}

export interface OrderListResponse {
  items: OrderResponse[];
  total: number;
  page: number;
  page_size: number;
}

export async function purchaseListing(body: PurchaseRequest): Promise<OrderResponse> {
  return marketplaceFetch<OrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getMyOrders(params?: {
  page?: number;
  page_size?: number;
}): Promise<OrderListResponse> {
  const qs = new URLSearchParams();
  if (params?.page != null) qs.set('page', String(params.page));
  if (params?.page_size != null) qs.set('page_size', String(params.page_size));
  const query = qs.toString();
  return marketplaceFetch<OrderListResponse>(`/orders${query ? `?${query}` : ''}`);
}

// ── Collection ────────────────────────────────────────────────────────────────

export async function getMyCollection(params?: {
  page?: number;
  page_size?: number;
}): Promise<ListingListResponse> {
  const qs = new URLSearchParams();
  if (params?.page != null) qs.set('page', String(params.page));
  if (params?.page_size != null) qs.set('page_size', String(params.page_size));
  const query = qs.toString();
  return marketplaceFetch<ListingListResponse>(`/collections${query ? `?${query}` : ''}`);
}

// ── Sync events ───────────────────────────────────────────────────────────────

export interface SyncEvent {
  id: string;
  event_type: string;
  source: string;
  processed: boolean;
  error: string | null;
  created_at: string | null;
}

export interface SyncEventsResponse {
  events: SyncEvent[];
  total: number;
  page: number;
  page_size: number;
}

export async function getSyncEvents(params?: {
  page?: number;
  page_size?: number;
}): Promise<SyncEventsResponse> {
  const qs = new URLSearchParams();
  if (params?.page != null) qs.set('page', String(params.page));
  if (params?.page_size != null) qs.set('page_size', String(params.page_size));
  const query = qs.toString();
  return marketplaceFetch<SyncEventsResponse>(`/sync/events${query ? `?${query}` : ''}`);
}
