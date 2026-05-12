/**
 * Order types matching the backend ``ebartex_auction`` schemas.
 *
 * The backend snapshots buyer/seller email + display_name into the order at
 * finalization time so the frontend never needs to hit the auth service to
 * render the "DA PAGARE / PAGATO" pages.
 */

export type OrderStatus =
  | 'PAYMENT_PENDING'
  | 'PAYMENT_OVERDUE'
  | 'DISPUTED'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REASSIGNED';

/** Statuses the buyer should see in the "DA PAGARE" tab (waiting for action). */
export const ORDER_STATUSES_TO_PAY: OrderStatus[] = [
  'PAYMENT_PENDING',
  'PAYMENT_OVERDUE',
  'DISPUTED',
];

/** Statuses where the buyer has already paid. */
export const ORDER_STATUSES_PAID: OrderStatus[] = ['PAID', 'SHIPPED', 'DELIVERED'];

export const ORDER_STATUSES_SHIPPED: OrderStatus[] = ['SHIPPED', 'DELIVERED'];

export const ORDER_STATUSES_DELIVERED: OrderStatus[] = ['DELIVERED'];

export const ORDER_STATUSES_CANCELLED: OrderStatus[] = ['CANCELLED', 'REASSIGNED'];

export interface OrderAPI {
  id: number;
  auction_id: number;
  /** Snapshot of the auction title at order rendering time; populated by the
   * backend via a batch lookup so the frontend doesn't need an extra query
   * per row to render the order list. */
  auction_title: string | null;
  buyer_id: string;
  seller_id: string;
  /** Only populated when the requesting user is the buyer (PII guard). */
  buyer_email: string | null;
  /** Only populated when the requesting user is the seller (PII guard). */
  seller_email: string | null;
  buyer_display_name: string | null;
  seller_display_name: string | null;
  amount: number;
  shipping_amount: number;
  total_amount: number;
  status: OrderStatus;
  due_at: string;
  paid_at: string | null;
  reassigned_from_order_id: number | null;
  reassignment_reason: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderListResponse {
  success: boolean;
  data: OrderAPI[];
  total: number;
  limit: number;
  offset: number;
}

export interface OrderDetailResponse {
  success: boolean;
  data: OrderAPI;
}

export interface OrderHistoryEntry {
  id: number;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  actor_user_id: string | null;
  reason: string | null;
  created_at: string;
}

export interface OrderHistoryResponse {
  success: boolean;
  data: OrderHistoryEntry[];
}

export interface PayOrderResponse {
  success: boolean;
  data: OrderAPI;
}
