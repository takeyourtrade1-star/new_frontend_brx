/**
 * Adapts backend AuctionAPI response to the UI types used by existing components.
 * Design stays identical; only data source changes.
 */

import type { AuctionAPI, BidAPI } from '@/types/auction';

export type AuctionGame = 'mtg' | 'lorcana' | 'pokemon' | 'op' | 'ygo' | 'other';

export interface AuctionUI {
  id: string;
  numericId: number;
  title: string;
  image: string;
  hoursFromNow: number;
  currentBidEur: number;
  bidCount: number;
  seller: string;
  sellerCountry: string;
  sellerRating: number;
  sellerReviewCount: number;
  game: AuctionGame;
  startingBidEur: number;
  reservePriceEur: number;
  status?: 'live' | 'ended';
  winnerUsername?: string | null;
  endsAt: string;
  description: string;
  imageFront: string;
  imageBack: string;
  reservePrice: number | null;
  videoUrl: string | null;
  buyNowEnabled: boolean;
  buyNowPrice: number | null;
  buyNowUrl: string | null;
  winnerId: string | null;
  reserveNotReachedMessage: string | null;
  createdByUserId: string | null;
  startTime: string;
}

export function apiToAuctionUI(a: AuctionAPI, bidCount?: number): AuctionUI {
  const endMs = new Date(a.end_time).getTime();
  const nowMs = Date.now();
  const hoursFromNow = (endMs - nowMs) / 3_600_000;
  const isEnded = a.status === 'CLOSED' || hoursFromNow < 0;

  return {
    id: String(a.id),
    numericId: a.id,
    title: a.title,
    image: a.image_front,
    hoursFromNow,
    currentBidEur: a.current_price,
    bidCount: bidCount ?? 0,
    seller: a.created_by_user_id?.slice(0, 8) ?? 'Venditore',
    sellerCountry: 'IT',
    sellerRating: 98,
    sellerReviewCount: 0,
    game: 'mtg',
    startingBidEur: a.starting_price,
    reservePriceEur: a.reserve_price ?? 0,
    status: isEnded ? 'ended' : 'live',
    winnerUsername: a.winner_id ? a.winner_id.slice(0, 8) : null,
    endsAt: a.end_time,
    description: a.description,
    imageFront: a.image_front,
    imageBack: a.image_back,
    reservePrice: a.reserve_price,
    videoUrl: a.video_url,
    buyNowEnabled: a.buy_now_enabled,
    buyNowPrice: a.buy_now_price,
    buyNowUrl: a.buy_now_url,
    winnerId: a.winner_id ?? null,
    reserveNotReachedMessage: a.reserve_not_reached_message ?? null,
    createdByUserId: a.created_by_user_id ?? null,
    startTime: a.start_time,
  };
}

export interface BidRowUI {
  username: string;
  amountEur: number;
  countryCode?: string;
  atLabel?: string;
  userId: string;
}

export function apiBidToBidRow(b: BidAPI): BidRowUI {
  const ago = Date.now() - new Date(b.created_at).getTime();
  const hours = Math.floor(ago / 3_600_000);
  let atLabel = 'adesso';
  if (hours >= 48) atLabel = `${Math.floor(hours / 24)} g fa`;
  else if (hours >= 1) atLabel = `${hours} h fa`;
  else if (ago > 60_000) atLabel = `${Math.floor(ago / 60_000)} min fa`;

  return {
    username: b.user_id.slice(0, 8),
    amountEur: b.amount,
    countryCode: 'IT',
    atLabel,
    userId: b.user_id,
  };
}

export function isAuctionEndedUI(a: AuctionUI): boolean {
  if (a.status === 'ended') return true;
  return a.hoursFromNow < 0;
}

export function isEndingSoonUI(hoursFromNow: number): boolean {
  return hoursFromNow > 0 && hoursFromNow <= 48;
}
