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

export function useNotificationList(
  params?: NotificationListParams,
  options?: Partial<UseQueryOptions<NotificationListResponse>>,
) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => notificationsApi.list(params),
    staleTime: 10_000,
    refetchInterval: 30_000,
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
    refetchInterval: 30_000,
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
