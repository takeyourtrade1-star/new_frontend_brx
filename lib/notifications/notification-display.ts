import type { MessageKey } from '@/lib/i18n/messages/en';
import type { NotificationAPI } from '@/types/notification';

export function getNotificationHref(notification: NotificationAPI): string | null {
  const action = notification.action;
  if (action) {
    switch (action.kind) {
      case 'AUCTION_DETAIL':
        return action.id ? `/aste/${action.id}` : null;
      case 'TRADE_DETAIL':
        return action.id ? `/scambi/${action.id}` : null;
      case 'ORDER_BUYER':
        return '/ordini/acquisti';
      case 'ORDER_SELLER':
        return '/ordini/vendite';
      case 'DISPUTE_DETAIL':
        return action.id ? `/ordini/contestazioni/${action.id}` : null;
      case 'TOURNAMENTS':
        return '/tornei';
      case 'HOME':
        return '/';
      case 'NOTIFICATIONS':
        return '/account/notifiche';
    }
  }

  switch (notification.related_kind) {
    case 'auction':
      return notification.related_id ? `/aste/${notification.related_id}` : null;
    case 'trade':
      return notification.related_id ? `/scambi/${notification.related_id}` : null;
    case 'dispute':
      return notification.related_id
        ? `/ordini/contestazioni/${notification.related_id}`
        : null;
    case 'order':
      return notification.type === 'AUCTION_SOLD' ? '/ordini/vendite' : '/ordini/acquisti';
    case 'announcement':
    default:
      return null;
  }
}

export function getNotificationCategoryKey(notification: NotificationAPI): MessageKey {
  if (notification.type === 'SYSTEM_ANNOUNCEMENT' || notification.related_kind === 'announcement') {
    return 'notifications.category.system';
  }
  switch (notification.related_kind) {
    case 'auction':
      return 'notifications.category.auction';
    case 'order':
      return 'notifications.category.order';
    case 'dispute':
      return 'notifications.category.dispute';
    case 'trade':
      return 'notifications.category.trade';
    default:
      return 'notifications.category.update';
  }
}

export function formatNotificationTime(iso: string, locale: string): string {
  const timestamp = new Date(iso).getTime();
  if (!Number.isFinite(timestamp)) return '';
  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, 'second');
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return formatter.format(days, 'day');
  return new Date(iso).toLocaleDateString(locale);
}

export function getGroupedCount(notification: NotificationAPI): number | null {
  const count = notification.payload.count;
  return typeof count === 'number' && Number.isInteger(count) && count > 1 ? count : null;
}

export function isRepeatedNotificationLabel(label: string, title: string): boolean {
  const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  return normalize(label) === normalize(title);
}
