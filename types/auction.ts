/** Types matching backend ebartex_auction schemas */

export type AuctionStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'UNKNOWN';

export interface AuctionPhotoEmbed {
  id: number;
  position: number;
  cdn_url: string;
  width?: number | null;
  height?: number | null;
}

export interface AuctionAPI {
  id: number;
  title: string;
  description: string;
  starting_price: number;
  current_price: number;
  reserve_price: number | null;
  start_time: string;
  end_time: string;
  status: AuctionStatus;
  highest_bidder_id: string | null;
  product_id: string | null;
  image_front: string;
  image_back: string;
  /** User-uploaded photos in display order. Empty for legacy auctions; clients
   * should fall back to [image_front, image_back] when this is empty. */
  photos?: AuctionPhotoEmbed[];
  video_url: string | null;
  buy_now_enabled: boolean;
  buy_now_price: number | null;
  buy_now_url: string | null;
  winner_id?: string | null;
  reserve_not_reached_message?: string | null;
  created_by_user_id?: string | null;
}

export interface AuctionListResponse {
  success: boolean;
  data: AuctionAPI[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuctionDetailResponse {
  success: boolean;
  data: AuctionAPI;
}

export interface BidAPI {
  id: number;
  auction_id: number;
  user_id: string;
  amount: number;
  max_amount: number | null;
  created_at: string;
}

export interface BidListResponse {
  success: boolean;
  data: BidAPI[];
  total: number;
  limit: number;
  offset: number;
}

export interface MinimumBidResponse {
  success: boolean;
  data: {
    current_price: number;
    min_increment: number;
    minimum_next_bid: number;
  };
}

export interface PlaceBidResponse {
  success: boolean;
  data: {
    auction: AuctionAPI;
    bids: BidAPI[];
    outbid?: boolean;
    outbid_message?: string | null;
    idempotency_replayed?: boolean;
  };
}

export interface ProxyLimitResponse {
  success: boolean;
  data: {
    auction: AuctionAPI;
    bids: BidAPI[];
    proxy_limit: number;
  };
}

export interface AuctionCreatePayload {
  title: string;
  description: string;
  starting_price: number;
  reserve_price?: number | null;
  start_time: string;
  end_time: string;
  product_id?: number | null;
  product?: {
    name: string;
    description?: string;
    price?: number;
    image_front: string;
    image_back: string;
    condition?: string;
  } | null;
  image_front: string;
  image_back: string;
  /** Ids of finalized auction_photos uploaded via /api/auctions/photos/finalize.
   * Order is significant (position 0 = front cover). */
  photo_ids?: number[];
  video_url?: string | null;
  buy_now_enabled?: boolean;
  buy_now_url?: string | null;
  buy_now_price?: number | null;
}

export interface PlaceBidPayload {
  amount: number;
  maxAmount?: number | null;
}

export interface ProxyLimitPayload {
  maxAmount: number;
}
