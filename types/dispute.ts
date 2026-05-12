export type DisputeStatus =
  | 'OPEN'
  | 'RESOLVED_PAID'
  | 'RESOLVED_CANCELLED'
  | 'RESOLVED_REASSIGNED';

export interface DisputeAPI {
  id: number;
  order_id: number;
  status: DisputeStatus;
  opened_by: 'system' | 'buyer' | 'seller';
  resolution: string | null;
  resolved_by_user_id: string | null;
  resolved_at: string | null;
  created_at: string;
  /** Present on detail and open-by-order endpoints; used to determine seller/buyer role. */
  seller_id?: string;
  buyer_id?: string;
}

export interface DisputeMessageAPI {
  id: number;
  dispute_id: number;
  sender_user_id: string;
  body: string;
  created_at: string;
}

export interface DisputeListResponse {
  success: boolean;
  data: DisputeAPI[];
  limit: number;
  offset: number;
}

export interface DisputeDetailResponse {
  success: boolean;
  data: DisputeAPI;
}

export interface MaybeDisputeResponse {
  success: boolean;
  data: DisputeAPI | null;
}

export interface DisputeMessagesResponse {
  success: boolean;
  data: DisputeMessageAPI[];
  limit: number;
  offset: number;
}

export interface DisputeWsTicketResponse {
  success: boolean;
  data: { ticket: string; expires_in: number };
}
