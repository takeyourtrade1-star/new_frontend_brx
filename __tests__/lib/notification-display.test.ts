import { describe, expect, it } from 'vitest';
import {
  getGroupedCount,
  getNotificationCategoryKey,
  getNotificationHref,
  isRepeatedNotificationLabel,
} from '@/lib/notifications/notification-display';
import type { NotificationAPI } from '@/types/notification';

function notification(overrides: Partial<NotificationAPI> = {}): NotificationAPI {
  return {
    id: 'n:1',
    type: 'TRADE_ACCEPTED',
    source: 'trade',
    title: 'Scambio accettato',
    body: 'Lo scambio è confermato.',
    related_kind: 'trade',
    related_id: 12,
    action: { kind: 'TRADE_DETAIL', id: '12' },
    payload: {},
    read_at: null,
    created_at: '2026-07-15T10:00:00Z',
    updated_at: '2026-07-15T10:00:00Z',
    ...overrides,
  };
}

describe('notification display', () => {
  it('usa l’azione esplicita senza indovinare la rotta dal tipo', () => {
    expect(getNotificationHref(notification())).toBe('/scambi/12');
    expect(
      getNotificationHref(
        notification({
          type: 'SYSTEM_ANNOUNCEMENT',
          related_kind: 'announcement',
          related_id: null,
          action: { kind: 'TOURNAMENTS', id: null },
        }),
      ),
    ).toBe('/tornei');
  });

  it('espone il contatore solo per notifiche realmente raggruppate', () => {
    expect(getGroupedCount(notification({ payload: { count: 7 } }))).toBe(7);
    expect(getGroupedCount(notification({ payload: { count: 1 } }))).toBeNull();
  });

  it('classifica gli annunci globali come comunicazioni Ebartex', () => {
    expect(
      getNotificationCategoryKey(
        notification({
          type: 'SYSTEM_ANNOUNCEMENT',
          related_kind: 'announcement',
        }),
      ),
    ).toBe('notifications.category.system');
  });

  it('riconosce etichetta e titolo ripetuti ignorando maiuscole e spazi', () => {
    expect(isRepeatedNotificationLabel('SCAMBIO COMPLETATO', 'Scambio completato')).toBe(true);
    expect(isRepeatedNotificationLabel('Scambio', 'Scambio completato')).toBe(false);
  });
});
