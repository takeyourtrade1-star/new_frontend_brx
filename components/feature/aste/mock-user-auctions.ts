/**
 * Mock “le mie aste” e “partecipazioni” fino all’API dedicata.
 */

/** ID aste in cui sei venditore (mock). Include c1 (chiusa con vendita → spedizione). */
export const MY_AUCTION_LISTING_IDS = ['a2', 'a6', 'a10', 'c1'] as const;

export function isMyAuctionListing(auctionId: string): boolean {
  return (MY_AUCTION_LISTING_IDS as readonly string[]).includes(auctionId);
}

/** Aste in cui hai offerto: id + ultima offerta mock (€). */
export const PARTICIPATED_AUCTION_MOCK: { id: string; myLastBidEur: number }[] = [
  { id: 'a1', myLastBidEur: 11800 },
  { id: 'a3', myLastBidEur: 850 },
  { id: 'a7', myLastBidEur: 42000 },
];
