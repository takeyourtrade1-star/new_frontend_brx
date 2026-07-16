'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import {
  formatNotificationTime,
  getGroupedCount,
  getNotificationCategoryKey,
  getNotificationHref,
  isRepeatedNotificationLabel,
} from '@/lib/notifications/notification-display';
import type { NotificationAPI } from '@/types/notification';

export function NotificationFeedItem({
  notification,
  onActivate,
  roomy = false,
}: {
  notification: NotificationAPI;
  onActivate: (notification: NotificationAPI) => void;
  roomy?: boolean;
}) {
  const { t } = useTranslation();
  const intlLocale = useIntlLocale();
  const href = getNotificationHref(notification);
  const groupedCount = getGroupedCount(notification);
  const categoryLabel = t(getNotificationCategoryKey(notification));
  const showCategory = !isRepeatedNotificationLabel(categoryLabel, notification.title);
  const content = (
    <div
      className={cn(
        'flex flex-col gap-1 transition-colors',
        roomy ? 'px-5 py-4' : 'px-4 py-3',
        notification.read_at ? 'bg-white' : 'bg-[#FFF7EC]',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        {showCategory ? (
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#FF7300]">
            {categoryLabel}
          </span>
        ) : null}
        <span className="ml-auto text-[10px] text-gray-500">
          {formatNotificationTime(notification.updated_at || notification.created_at, intlLocale)}
        </span>
      </div>
      <div className="flex items-start justify-between gap-3">
        <span className="line-clamp-2 text-sm font-semibold text-gray-900">
          {notification.title}
        </span>
        {groupedCount ? (
          <span className="shrink-0 rounded-full bg-[#1D3160] px-2 py-0.5 text-[10px] font-bold text-white">
            {t('notifications.groupedOffers', { count: groupedCount })}
          </span>
        ) : null}
      </div>
      <span className={cn('text-xs leading-relaxed text-gray-600', roomy ? '' : 'line-clamp-2')}>
        {notification.body}
      </span>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={() => onActivate(notification)}
        className="block w-full text-left hover:bg-gray-50"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onActivate(notification)}
      className="block w-full text-left hover:bg-gray-50"
    >
      {content}
    </button>
  );
}
