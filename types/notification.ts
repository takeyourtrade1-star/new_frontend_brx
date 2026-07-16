/**
 * In-app notification types (bell icon dropdown).
 *
 * Notifications are produced by the backend lifecycle services and consumed
 * by the bell icon in the header. ``related_kind`` + ``related_id`` give the
 * frontend enough information to deep-link to the relevant page.
 */

export type KnownNotificationType =
  | 'AUCTION_WON'
  | 'AUCTION_SOLD'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_OVERDUE'
  | 'DISPUTE_OPENED'
  | 'DISPUTE_MESSAGE'
  | 'AUCTION_REASSIGNED'
  | 'AUCTION_CANCELLED'
  | 'AUCTION_BID_RECEIVED'
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
  | 'TRADE_ASSISTANCE'
  | 'SYSTEM_ANNOUNCEMENT';

export type NotificationType = KnownNotificationType | (string & {});

export type NotificationRelatedKind = 'order' | 'auction' | 'dispute' | 'trade' | 'announcement';

export type NotificationActionKind =
  | 'AUCTION_DETAIL'
  | 'TRADE_DETAIL'
  | 'ORDER_BUYER'
  | 'ORDER_SELLER'
  | 'DISPUTE_DETAIL'
  | 'TOURNAMENTS'
  | 'HOME'
  | 'NOTIFICATIONS';

export interface NotificationAction {
  kind: NotificationActionKind;
  id: string | null;
}

export interface NotificationAPI {
  id: string;
  type: NotificationType;
  source: string;
  title: string;
  body: string;
  related_kind: NotificationRelatedKind | null;
  related_id: number | null;
  action: NotificationAction | null;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
  updated_at: string;
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
