/**
 * In-app notification types (bell icon dropdown).
 *
 * Notifications are produced by the backend lifecycle services and consumed
 * by the bell icon in the header. ``related_kind`` + ``related_id`` give the
 * frontend enough information to deep-link to the relevant page.
 */

export type NotificationType =
  | 'AUCTION_WON'
  | 'AUCTION_SOLD'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_OVERDUE'
  | 'DISPUTE_OPENED'
  | 'DISPUTE_MESSAGE'
  | 'AUCTION_REASSIGNED'
  | 'AUCTION_CANCELLED'
  | 'TRADE_PROPOSED'
  | 'TRADE_RECEIVED'
  | 'TRADE_COUNTERED'
  | 'TRADE_ACCEPTED'
  | 'TRADE_DECLINED'
  | 'TRADE_CANCEL_REQUESTED'
  | 'TRADE_CANCELLED'
  | 'TRADE_SHIPPED'
  | 'TRADE_COMPLETED'
  | 'TRADE_EXPIRING'
  | 'TRADE_EXPIRED'
  | 'TRADE_ASSISTANCE';

export type NotificationRelatedKind = 'order' | 'auction' | 'dispute' | 'trade';

export interface NotificationAPI {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  related_kind: NotificationRelatedKind | null;
  related_id: number | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: NotificationAPI[];
  total: number;
  unread: number;
  limit: number;
  offset: number;
}

export interface NotificationUnreadCountResponse {
  success: boolean;
  data: { unread: number };
}
