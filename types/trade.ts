export type TradeStatus =
  | 'PROPOSED' | 'ACCEPTING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED'
  | 'EXPIRED' | 'COUNTERED' | 'COMPLETED' | 'DISPUTED';

export interface TradeAddress {
  full_name: string;
  street: string;
  city: string;
  zip: string;
  province?: string | null;
  country: string;
  phone?: string | null;
}

export type TradeItemInput =
  | { inventory_item_id: number; marketplace_listing_id?: never; quantity: number }
  | { marketplace_listing_id: string; inventory_item_id?: never; quantity: number };

export interface TradeItem {
  id: number;
  direction: 'offered' | 'requested';
  owner_user_id: string;
  inventory_source: 'sync' | 'marketplace';
  inventory_item_id: number | null;
  marketplace_listing_id: string | null;
  quantity: number;
  blueprint_id: number;
  price_cents: number;
  properties: Record<string, unknown> | null;
  description: string | null;
  graded: boolean | null;
  was_cardtrader_linked: boolean;
  available: boolean | null;
  escrowed_at: string | null;
  released_at: string | null;
  release_target: string | null;
}

export interface TradeParty {
  user_id: string;
  role: 'proposer' | 'receiver';
  address: TradeAddress | null;
  shipped_at: string | null;
  tracking_carrier: string | null;
  tracking_code: string | null;
  receipt_confirmed_at: string | null;
  cancel_requested_at: string | null;
}

export interface Trade {
  id: number;
  proposer_id: string;
  receiver_id: string;
  proposer_display_name: string | null;
  receiver_display_name: string | null;
  status: TradeStatus;
  message: string | null;
  delivery_method: 'direct';
  parent_trade_id: number | null;
  offered_credits_cents: 0;
  requested_credits_cents: 0;
  due_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  items: TradeItem[];
  parties?: TradeParty[];
}

export interface CreateTradeInput {
  receiver_id: string;
  offered: TradeItemInput[];
  requested: TradeItemInput[];
  message?: string;
  delivery_method: 'direct';
  offered_credits_cents: 0;
  requested_credits_cents: 0;
}

export interface TradeResponse { success: boolean; data: Trade }
export interface TradeListResponse {
  success: boolean; data: Trade[]; total: number; limit: number; offset: number;
}
export interface TradeHistoryEntry {
  id: number;
  from_status: TradeStatus | null;
  to_status: TradeStatus;
  actor_user_id: string | null;
  reason: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}
export interface TradeHistoryResponse { success: boolean; data: TradeHistoryEntry[] }
