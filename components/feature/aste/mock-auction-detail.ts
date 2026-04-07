import {
  MOCK_AUCTIONS,
  isAuctionEnded,
  type AuctionMock,
} from '@/components/feature/aste/mock-auctions';

export type BidRow = {
  username: string;
  amountEur: number;
  countryCode?: string;
  /** Etichetta tempo relativo (solo vista venditore, mock). */
  atLabel?: string;
};

export type SellerOutcome = 'live' | 'sold' | 'unsold';

export type AuctionDetailMock = AuctionMock & {
  subtitle: string;
  /** Gallery: [main, ...alternates] */
  images: string[];
  reserveMet: boolean;
  conditionLabel: string;
  description: string;
  /** Spedizione stimata (mock, €). */
  estimatedShippingEur: number;
  /** Mock: visualizzazioni totali. */
  viewCount: number;
  /** Mock: utenti che stanno guardando ora. */
  watchingNow: number;
  bids: BidRow[];
  /** Esito per il venditore. */
  outcome: SellerOutcome;
  /** Vincitore se venduta. */
  winnerUsername: string | null;
  /** Ordine spedizione collegato (mock), solo vendita conclusa. */
  shippingOrderId: string | null;
  /** Offerenti unici (mock). */
  uniqueBidders: number;
  /** Nuove offerte nelle ultime 24 h (mock, solo live). */
  recentBids24h: number;
};

function outcomeFromBase(base: AuctionMock): SellerOutcome {
  if (!isAuctionEnded(base)) return 'live';
  const met = base.currentBidEur >= base.reservePriceEur;
  if (met && base.bidCount > 0) return 'sold';
  return 'unsold';
}

function winnerFromBase(base: AuctionMock, outcome: SellerOutcome): string | null {
  if (outcome !== 'sold') return null;
  if (base.winnerUsername != null && base.winnerUsername !== '') return base.winnerUsername;
  return 'HighBidder';
}

function shippingOrderIdFromBase(base: AuctionMock, outcome: SellerOutcome): string | null {
  if (outcome !== 'sold') return null;
  if (base.id === 'c1') return 'ship-c1';
  return null;
}

function buildBids(base: AuctionMock, ended: boolean): BidRow[] {
  const cur = base.currentBidEur;
  const start = base.startingBidEur;
  const rows: BidRow[] = [
    { username: 'GiacomoAlberto', amountEur: Math.max(22, Math.round(cur * 0.92)), countryCode: 'IT', atLabel: '2 h fa' },
    { username: 'CardHunter_92', amountEur: Math.max(20, Math.round(cur * 0.85)), countryCode: 'ES', atLabel: '5 h fa' },
    { username: 'MartaK', amountEur: Math.max(18, Math.round(cur * 0.78)), countryCode: 'FR', atLabel: 'ieri' },
    { username: 'Leo', amountEur: Math.max(16, Math.round(cur * 0.7)), countryCode: 'DE', atLabel: '2 g fa' },
    { username: 'InkFan', amountEur: Math.max(15, Math.round(start)), countryCode: 'IT', atLabel: '3 g fa' },
  ];
  if (ended) {
    return rows.map((r, i) => ({ ...r, atLabel: r.atLabel ?? `${i + 1}° giorno` }));
  }
  return rows;
}

function buildDetail(base: AuctionMock): AuctionDetailMock {
  const img = base.image;
  const ended = isAuctionEnded(base);
  const reserveMet = base.currentBidEur >= base.reservePriceEur;
  const outcome = outcomeFromBase(base);
  const winnerUsername = winnerFromBase(base, outcome);

  const n = parseInt(base.id.replace(/\D/g, '') || '0', 10);
  const uniqueBidders = Math.min(base.bidCount, 5 + (n % 12));
  const recentBids24h = ended ? 0 : Math.min(5, 1 + (n % 4));

  return {
    ...base,
    subtitle:
      base.game === 'lorcana'
        ? 'La casa di Mickey Mouse.'
        : base.game === 'pokemon'
          ? 'Set classico — condizioni da collezione.'
          : 'Carta singola verificata dal venditore.',
    images: [
      img,
      `https://picsum.photos/seed/detail-${base.id}-2/400/560`,
      `https://picsum.photos/seed/detail-${base.id}-3/400/560`,
      `https://picsum.photos/seed/detail-${base.id}-4/400/560`,
    ],
    reserveMet,
    conditionLabel: 'Senza usura visibile',
    description:
      'Carta conservata in busta rigida, mai giocata. Spedizione tracciata e imballaggio protettivo inclusi.',
    estimatedShippingEur: 10,
    viewCount: 800 + (n % 400) * 3,
    watchingNow: ended ? 0 : 2 + (n % 9),
    outcome,
    winnerUsername,
    shippingOrderId: shippingOrderIdFromBase(base, outcome),
    uniqueBidders,
    recentBids24h,
    bids: buildBids(base, ended),
  };
}

const cache = new Map<string, AuctionDetailMock>();

export function getAuctionDetailMock(id: string): AuctionDetailMock {
  const hit = cache.get(id);
  if (hit && typeof hit.outcome === 'string' && typeof hit.reservePriceEur === 'number') return hit;
  const found = MOCK_AUCTIONS.find((a) => a.id === id);
  const base = found ?? { ...MOCK_AUCTIONS[1], id };
  const detail = buildDetail(base);
  cache.set(id, detail);
  return detail;
}

export const SIMILAR_MOCK_IDS = ['a3', 'a6', 'a10'];

/** Layout Figma: gradient header, titolo colorato, banner “inizia / termina”. */
export type SimilarCardBanner = {
  gradient: string;
  titleAccent: 'red' | 'orange' | 'sky';
  bannerMode: 'starts' | 'ends';
  /** Solo se `starts`: minuti al via (mock). */
  startsInMinutes?: number;
};

export const SIMILAR_CARD_LAYOUTS: SimilarCardBanner[] = [
  {
    gradient: 'linear-gradient(127deg, #db2777 0%, #c026d3 42%, #fb923c 100%)',
    titleAccent: 'red',
    bannerMode: 'ends',
  },
  {
    gradient: 'linear-gradient(127deg, #4c1d95 0%, #7c3aed 48%, #f472b6 100%)',
    titleAccent: 'orange',
    bannerMode: 'starts',
    startsInMinutes: 29,
  },
  {
    gradient: 'linear-gradient(127deg, #1d4ed8 0%, #0284c7 45%, #22d3ee 100%)',
    titleAccent: 'sky',
    bannerMode: 'ends',
  },
];

/** Stato prezzo di riserva per card “Oggetti simili” (mock, allineato a SIMILAR_MOCK_IDS). */
export type SimilarReserveStatus = 'none' | 'not_met' | 'met';

export const SIMILAR_RESERVE_STATUS: SimilarReserveStatus[] = ['not_met', 'met', 'none'];
