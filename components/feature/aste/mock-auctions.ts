/**
 * Dati di esempio per la hub aste (sostituire con API quando disponibile).
 * `hoursFromNow`: scadenza rispetto al momento in cui la pagina monta il client.
 * Valori negativi = asta già chiusa (mock).
 *
 * Ogni `id` corrisponde alla route App Router `/aste/[id]` (vedi `auctionDetailPath` in
 * `lib/auction/auction-paths.ts` e `getAuctionDetailMock` per il dettaglio mock).
 */

export type AuctionGame = 'mtg' | 'lorcana' | 'pokemon' | 'op' | 'ygo' | 'other';

export type AuctionLifecycleStatus = 'live' | 'ended';

export type AuctionMock = {
  id: string;
  title: string;
  image: string;
  hoursFromNow: number;
  currentBidEur: number;
  bidCount: number;
  seller: string;
  /** Codice paese venditore (ISO2) per bandierina */
  sellerCountry: string;
  /** Affidabilità tipo Cardmarket 0–100 */
  sellerRating: number;
  sellerReviewCount: number;
  game: AuctionGame;
  /** Prezzo di partenza (per filtri) */
  startingBidEur: number;
  /** Prezzo di riserva impostato dal venditore (€) */
  reservePriceEur: number;
  /** In corso vs chiusa (mock). Se omesso, si deduce da `hoursFromNow`. */
  status?: AuctionLifecycleStatus;
  /** Solo aste chiuse con vendita: aggiudicatario (mock). */
  winnerUsername?: string | null;
};

export function isAuctionEnded(a: Pick<AuctionMock, 'status' | 'hoursFromNow'>): boolean {
  if (a.status === 'ended') return true;
  if (a.status === 'live') return false;
  return a.hoursFromNow < 0;
}

export const MOCK_AUCTIONS: AuctionMock[] = [
  {
    id: 'a1',
    title: 'Black Lotus — Unlimited',
    image: 'https://picsum.photos/seed/brxaste1/400/560',
    hoursFromNow: 3.25,
    currentBidEur: 12400,
    bidCount: 42,
    seller: 'VintageVault',
    sellerCountry: 'US',
    sellerRating: 99,
    sellerReviewCount: 1840,
    game: 'mtg',
    startingBidEur: 5000,
    reservePriceEur: 10000,
  },
  {
    id: 'a2',
    title: 'Micky Mosè — Lorcana',
    image: 'https://picsum.photos/seed/brxaste2/400/560',
    hoursFromNow: 8,
    currentBidEur: 31,
    bidCount: 18,
    seller: 'XkutentexX',
    sellerCountry: 'IT',
    sellerRating: 98,
    sellerReviewCount: 127,
    game: 'lorcana',
    startingBidEur: 15,
    reservePriceEur: 25,
  },
  {
    id: 'a3',
    title: 'Charizard VMAX — PSA 10',
    image: 'https://picsum.photos/seed/brxaste3/400/560',
    hoursFromNow: 22,
    currentBidEur: 890,
    bidCount: 56,
    seller: 'PokeLab',
    sellerCountry: 'DE',
    sellerRating: 100,
    sellerReviewCount: 432,
    game: 'pokemon',
    startingBidEur: 400,
    reservePriceEur: 750,
  },
  {
    id: 'a4',
    title: 'Lightning Storm — Foil',
    image: 'https://picsum.photos/seed/brxaste4/400/560',
    hoursFromNow: 36,
    currentBidEur: 45,
    bidCount: 9,
    seller: 'StormSeller',
    sellerCountry: 'FR',
    sellerRating: 97,
    sellerReviewCount: 89,
    game: 'mtg',
    startingBidEur: 20,
    reservePriceEur: 35,
  },
  {
    id: 'a5',
    title: 'One Piece — Manga Rarissima',
    image: 'https://picsum.photos/seed/brxaste5/400/560',
    hoursFromNow: 120,
    currentBidEur: 210,
    bidCount: 12,
    seller: 'GrandLine_Cards',
    sellerCountry: 'ES',
    sellerRating: 96,
    sellerReviewCount: 54,
    game: 'op',
    startingBidEur: 100,
    reservePriceEur: 180,
  },
  {
    id: 'a6',
    title: 'Dual Lands — Revised',
    image: 'https://picsum.photos/seed/brxaste6/400/560',
    hoursFromNow: 168,
    currentBidEur: 320,
    bidCount: 27,
    seller: 'DualDealer',
    sellerCountry: 'IT',
    sellerRating: 99,
    sellerReviewCount: 210,
    game: 'mtg',
    startingBidEur: 150,
    reservePriceEur: 280,
  },
  {
    id: 'a7',
    title: 'Pikachu Illustrator',
    image: 'https://picsum.photos/seed/brxaste7/400/560',
    hoursFromNow: 200,
    currentBidEur: 45000,
    bidCount: 3,
    seller: 'RareGrail',
    sellerCountry: 'JP',
    sellerRating: 100,
    sellerReviewCount: 12,
    game: 'pokemon',
    startingBidEur: 30000,
    reservePriceEur: 40000,
  },
  {
    id: 'a8',
    title: 'Force of Will — Alliances',
    image: 'https://picsum.photos/seed/brxaste8/400/560',
    hoursFromNow: 240,
    currentBidEur: 88,
    bidCount: 14,
    seller: 'LegacyMTG',
    sellerCountry: 'GB',
    sellerRating: 98,
    sellerReviewCount: 301,
    game: 'mtg',
    startingBidEur: 40,
    reservePriceEur: 70,
  },
  {
    id: 'a9',
    title: 'Yu-Gi-Oh! — Blue-Eyes White Dragon',
    image: 'https://picsum.photos/seed/brxaste9/400/560',
    hoursFromNow: 400,
    currentBidEur: 120,
    bidCount: 33,
    seller: 'DuelShop',
    sellerCountry: 'IT',
    sellerRating: 95,
    sellerReviewCount: 67,
    game: 'ygo',
    startingBidEur: 50,
    reservePriceEur: 95,
  },
  {
    id: 'a10',
    title: 'Lorcana — Elsa Enchanted',
    image: 'https://picsum.photos/seed/brxaste10/400/560',
    hoursFromNow: 12,
    currentBidEur: 19,
    bidCount: 7,
    seller: 'InkCollector',
    sellerCountry: 'PT',
    sellerRating: 99,
    sellerReviewCount: 412,
    game: 'lorcana',
    startingBidEur: 5,
    reservePriceEur: 12,
  },
  /** Asta chiusa con vendita (mock) — utente mock è venditore su c1. */
  {
    id: 'c1',
    title: 'Ugin, the Spirit Dragon — foil',
    image: 'https://picsum.photos/seed/brxastec1/400/560',
    hoursFromNow: -48,
    currentBidEur: 180,
    bidCount: 24,
    seller: 'XkutentexX',
    sellerCountry: 'IT',
    sellerRating: 98,
    sellerReviewCount: 127,
    game: 'mtg',
    startingBidEur: 40,
    reservePriceEur: 150,
    status: 'ended',
    winnerUsername: 'CardBuyer_IT',
  },
  /** Asta chiusa senza vendita (riserva non raggiunta) — mock. */
  {
    id: 'c2',
    title: 'Lightning Bolt — Alpha LP',
    image: 'https://picsum.photos/seed/brxastec2/400/560',
    hoursFromNow: -120,
    currentBidEur: 45,
    bidCount: 5,
    seller: 'StormSeller',
    sellerCountry: 'FR',
    sellerRating: 97,
    sellerReviewCount: 89,
    game: 'mtg',
    startingBidEur: 15,
    reservePriceEur: 80,
    status: 'ended',
    winnerUsername: null,
  },
];

const ENDING_SOON_H = 48;

export function isEndingSoon(hoursFromNow: number): boolean {
  return hoursFromNow > 0 && hoursFromNow <= ENDING_SOON_H;
}
