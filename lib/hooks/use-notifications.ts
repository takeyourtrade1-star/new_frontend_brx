/**
 * React Query hooks for the in-app notification feed.
 *
 * The unread-count query is split from the list query because the bell icon
 * polls it constantly while the dropdown is closed; we don't want to ship the
 * full payload on every poll.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  notificationsApi,
  type NotificationListParams,
} from '@/lib/api/notifications-client';
import type {
  NotificationListResponse,
  NotificationUnreadCountResponse,
} from '@/types/notification';

const KEYS = {
  all: ['notifications'] as const,
  list: (params?: NotificationListParams) =>
    ['notifications', 'list', params ?? {}] as const,
  unread: ['notifications', 'unread-count'] as const,
};

/** Thrown by ``notifications-client`` on HTTP errors (see ``err.status``). */
function isHttp401Error(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status: number }).status === 401
  );
}

/** Avoid RQ default retries + interval polling hammering the BFF when auth is gone. */
function notificationsRetry(failureCount: number, error: unknown): boolean {
  if (isHttp401Error(error)) return false;
  return failureCount < 3;
}

/** Narrow shape so refetch callbacks stay compatible with every query generic. */
type QueryWithErrorState = { state: { error: unknown } };

function notificationsRefetchInterval(query: QueryWithErrorState): number | false {
  if (query.state.error && isHttp401Error(query.state.error)) return false;
  return 30_000;
}

function notificationsRefetchOnWindowFocus(query: QueryWithErrorState): boolean {
  if (query.state.error && isHttp401Error(query.state.error)) return false;
  return true;
}

export function useNotificationList(
  params?: NotificationListParams,
  options?: Partial<UseQueryOptions<NotificationListResponse>>,
) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => notificationsApi.list(params),
    staleTime: 10_000,
    refetchInterval: notificationsRefetchInterval,
    retry: notificationsRetry,
    refetchOnWindowFocus: notificationsRefetchOnWindowFocus,
    ...options,
  });
}

export function useUnreadNotificationsCount(
  options?: Partial<UseQueryOptions<NotificationUnreadCountResponse>>,
) {
  return useQuery({
    queryKey: KEYS.unread,
    queryFn: () => notificationsApi.unreadCount(),
    staleTime: 15_000,
    refetchInterval: notificationsRefetchInterval,
    retry: notificationsRetry,
    refetchOnWindowFocus: notificationsRefetchOnWindowFocus,
    ...options,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
