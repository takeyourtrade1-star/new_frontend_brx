/**
 * In-app notifications API client.
 *
 * Pattern mirrors ``orders-client.ts``: same-origin proxy to ``/api/notifications/*``,
 * Bearer auth from local storage, transparent 401 refresh.
 */

import { tokenManager } from '@/lib/api/refresh-token';
import type {
  NotificationListResponse,
  NotificationUnreadCountResponse,
} from '@/types/notification';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ebartex_access_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type NotificationRequestMode = 'default' | 'after-refresh' | 'cookie-only';

async function request<T>(
  path: string,
  options: RequestInit = {},
  mode: NotificationRequestMode = 'default',
): Promise<T> {
  const url = `/api/notifications${path}`;
  const cookieOnly = mode === 'cookie-only';
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(cookieOnly ? {} : authHeaders()),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      if (mode === 'default') {
        const newToken = await tokenManager.ensureFreshToken();
        if (newToken) {
          return request<T>(path, options, 'after-refresh');
        }
        return request<T>(path, options, 'cookie-only');
      }
      if (mode === 'after-refresh') {
        return request<T>(path, options, 'cookie-only');
      }
    }
    const msg =
      data?.detail ||
      data?.error ||
      data?.message ||
      `Notifications API error ${res.status}`;
    const err = new Error(msg) as Error & { status: number; data: unknown };
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export interface NotificationListParams {
  onlyUnread?: boolean;
  limit?: number;
  offset?: number;
}

export const notificationsApi = {
  list(params?: NotificationListParams): Promise<NotificationListResponse> {
    const sp = new URLSearchParams();
    if (params?.onlyUnread) sp.set('only_unread', 'true');
    if (params?.limit !== undefined) sp.set('limit', String(params.limit));
    if (params?.offset !== undefined) sp.set('offset', String(params.offset));
    const qs = sp.toString();
    return request<NotificationListResponse>(qs ? `?${qs}` : '');
  },

  unreadCount(): Promise<NotificationUnreadCountResponse> {
    return request<NotificationUnreadCountResponse>('/unread-count');
  },

  markRead(id: number): Promise<{ success: boolean; data: { id: number; marked: boolean } }> {
    return request(`/${id}/read`, { method: 'PATCH' });
  },

  markAllRead(): Promise<{ success: boolean; data: { updated: number } }> {
    return request('/read-all', { method: 'PATCH' });
  },
};
