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
  const base = process.env.NEXT_PUBLIC_MARKETPLACE_API_URL || 'https://api.ebartex.com/marketplace';
  return `${base.replace(/\/+$/, '')}/api/v1`;
}

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

  const res = await fetch(`${getMarketplaceBaseUrl()}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && !retried && typeof window !== 'undefined') {
    const newToken = await tokenManager.ensureFreshToken();
    if (newToken) {
      return marketplaceFetch<T>(path, options, true);
    }
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Marketplace API ${res.status}: ${body}`);
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

export async function triggerMarketplaceSync(): Promise<{ status: string; message: string }> {
  return marketplaceFetch('/sync/trigger', { method: 'POST' });
}
