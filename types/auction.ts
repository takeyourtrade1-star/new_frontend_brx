/** Types matching backend ebartex_auction schemas */

export type AuctionStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'UNKNOWN';

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
    increment: number;
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
  video_url?: string | null;
  buy_now_enabled?: boolean;
  buy_now_url?: string | null;
  buy_now_price?: number | null;
}

export interface PlaceBidPayload {
  amount: number;
  maxAmount?: number | null;
}
