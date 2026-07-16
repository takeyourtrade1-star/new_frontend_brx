'use client';

import { useState } from 'react';
import { CheckCheck, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationList,
} from '@/lib/hooks/use-notifications';
import { useAuthStore } from '@/lib/stores/auth-store';
import { NotificationFeedItem } from './NotificationFeedItem';

const PAGE_SIZE = 30;

export function NotificationHistoryContent() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const query = useNotificationList(
    { limit, offset: 0 },
    { enabled: isAuthenticated },
  );
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const items = query.data?.data ?? [];
  const unread = query.data?.unread ?? 0;
  const total = query.data?.total ?? 0;

  return (
    <div className="font-sans text-gray-900">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide sm:text-3xl">
            {t('notifications.historyTitle')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
            {t('notifications.historyDescription')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => markAll.mutate()}
          disabled={unread === 0 || markAll.isPending}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#1D3160] shadow-sm transition hover:border-[#FF7300] disabled:cursor-default disabled:opacity-50"
        >
          <CheckCheck className="h-4 w-4" aria-hidden />
          {markAll.isPending ? t('notifications.updating') : t('notifications.markAllRead')}
        </button>
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {query.isLoading ? (
          <div className="flex justify-center px-5 py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#FF7300]" aria-hidden />
          </div>
        ) : query.isError ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm text-red-600">{t('notifications.loadFailed')}</p>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="mt-4 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold uppercase text-[#1D3160]"
            >
              {t('notifications.retry')}
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-gray-500">
            {t('notifications.empty')}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((notification) => (
              <li key={notification.id}>
                <NotificationFeedItem
                  notification={notification}
                  roomy
                  onActivate={(item) => {
                    if (!item.read_at) markOne.mutate(item.id);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {items.length < total ? (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setLimit((value) => value + PAGE_SIZE)}
            disabled={query.isFetching}
            className="rounded-full bg-[#1D3160] px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#16264a] disabled:opacity-60"
          >
            {query.isFetching ? t('notifications.updating') : t('notifications.loadMore')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
