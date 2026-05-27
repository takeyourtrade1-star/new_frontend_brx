import type { ListingItem } from '@/lib/api/sync-client';
import { listingRowKey } from '@/lib/marketplace/listing-map';
import type { AuctionUI } from '@/lib/auction/auction-adapter';
import type { ConditionCode } from '@/components/ui/ConditionBadge';
import { getCardLanguageFlagCode } from '@/lib/card-languages';

export type MarketplaceRow =
  | { kind: 'listing'; id: string; listing: ListingItem }
  | { kind: 'auction'; id: string; auction: AuctionUI };

export type MarketplaceSort = 'price_asc' | 'price_desc' | 'seller' | 'condition';

export type TriStateFilter = 'SÌ' | 'NO' | 'ENTRAMBI';

export type SellerTypeFilter = 'PRIVATO' | 'PROFESSIONALE' | 'POWERSELLER';

export interface MarketplaceFilterState {
  hideAuctions: boolean;
  condizioneMinima: ConditionCode | null;
  linguaCarta: string | null;
  soloFoil: boolean;
  firmata: TriStateFilter;
  alterata: TriStateFilter;
  quantitaMin: number;
  posizioneVenditore: string;
  tipoVenditore: SellerTypeFilter | null;
}

export const CONDITION_RANK: Record<ConditionCode, number> = {
  NM: 0,
  SP: 1,
  MP: 2,
  PL: 3,
  PO: 4,
};

const CONDITION_TEXT_TO_CODE: Record<string, ConditionCode> = {
  'Near Mint': 'NM',
  near_mint: 'NM',
  'Lightly Played': 'SP',
  lightly_played: 'SP',
  'Slightly Played': 'SP',
  'Moderately Played': 'MP',
  moderately_played: 'MP',
  'Heavily Played': 'PL',
  heavily_played: 'PL',
  Played: 'PL',
  Damaged: 'PO',
  damaged: 'PO',
  Poor: 'PO',
};

export function listingConditionCode(condition?: string | null): ConditionCode {
  if (!condition) return 'NM';
  return CONDITION_TEXT_TO_CODE[condition] ?? 'NM';
}

export function buildMarketplaceRows(
  auctions: AuctionUI[],
  listings: ListingItem[]
): MarketplaceRow[] {
  const auctionRows: MarketplaceRow[] = auctions.map((a) => ({
    kind: 'auction' as const,
    id: `auction-${a.numericId}`,
    auction: a,
  }));
  const listingRows: MarketplaceRow[] = listings.map((l) => ({
    kind: 'listing' as const,
    id: `listing-${listingRowKey(l)}`,
    listing: l,
  }));
  return [...auctionRows, ...listingRows];
}

function matchesTriState(value: boolean | undefined, filter: TriStateFilter): boolean {
  if (filter === 'ENTRAMBI') return true;
  const v = Boolean(value);
  return filter === 'SÌ' ? v : !v;
}

function matchesSellerType(
  listing: ListingItem,
  filter: SellerTypeFilter | null
): boolean {
  if (!filter) return true;
  const accountType = listing.seller_account_type;
  if (filter === 'PRIVATO') return accountType === 'personal' || !accountType;
  if (filter === 'PROFESSIONALE') return accountType === 'business';
  if (filter === 'POWERSELLER') {
    const sales = listing.seller_sales_count ?? 0;
    return sales >= 1000;
  }
  return true;
}

export function filterMarketplaceRows(
  rows: MarketplaceRow[],
  filters: MarketplaceFilterState
): MarketplaceRow[] {
  return rows.filter((row) => {
    if (filters.hideAuctions && row.kind === 'auction') return false;

    if (row.kind === 'auction') return true;

    const l = row.listing;

    if (filters.soloFoil && !l.mtg_foil) return false;
    if (!matchesTriState(l.signed, filters.firmata)) return false;
    if (!matchesTriState(l.altered, filters.alterata)) return false;
    if (l.quantity < filters.quantitaMin) return false;

    if (filters.posizioneVenditore) {
      if (!l.country || l.country.toUpperCase() !== filters.posizioneVenditore.toUpperCase()) {
        return false;
      }
    }

    if (!matchesSellerType(l, filters.tipoVenditore)) return false;

    if (filters.linguaCarta) {
      const flag = getCardLanguageFlagCode(l.mtg_language);
      if (flag.toUpperCase() !== filters.linguaCarta.toUpperCase()) return false;
    }

    if (filters.condizioneMinima) {
      const code = listingConditionCode(l.condition);
      const minRank = CONDITION_RANK[filters.condizioneMinima];
      if (CONDITION_RANK[code] > minRank) return false;
    }

    return true;
  });
}

function auctionEndMs(a: AuctionUI): number {
  const t = new Date(a.endsAt).getTime();
  return Number.isFinite(t) ? t : Number.MAX_SAFE_INTEGER;
}

function rowPriceEur(row: MarketplaceRow): number {
  if (row.kind === 'auction') return row.auction.currentBidEur || row.auction.startingBidEur || 0;
  return row.listing.price_cents / 100;
}

function rowSellerName(row: MarketplaceRow): string {
  if (row.kind === 'auction') return row.auction.sellerDisplayName || row.auction.seller;
  return row.listing.seller_display_name;
}

function rowConditionRank(row: MarketplaceRow): number {
  if (row.kind === 'auction') return CONDITION_RANK.NM;
  return CONDITION_RANK[listingConditionCode(row.listing.condition)];
}

function sortListingRows(rows: MarketplaceRow[], sort: MarketplaceSort): MarketplaceRow[] {
  const sorted = [...rows];
  switch (sort) {
    case 'price_asc':
      sorted.sort((a, b) => rowPriceEur(a) - rowPriceEur(b));
      break;
    case 'price_desc':
      sorted.sort((a, b) => rowPriceEur(b) - rowPriceEur(a));
      break;
    case 'seller':
      sorted.sort((a, b) => rowSellerName(a).localeCompare(rowSellerName(b)));
      break;
    case 'condition':
      sorted.sort((a, b) => rowConditionRank(a) - rowConditionRank(b));
      break;
  }
  return sorted;
}

export function sortMarketplaceRows(
  rows: MarketplaceRow[],
  sort: MarketplaceSort,
  hideAuctions: boolean,
  isOwnListing?: (listing: ListingItem) => boolean
): MarketplaceRow[] {
  const auctions = rows.filter((r) => r.kind === 'auction');
  const listings = rows.filter((r) => r.kind === 'listing');

  const sortedAuctions = [...auctions].sort((a, b) => auctionEndMs(a.auction) - auctionEndMs(b.auction));

  let ownListings: MarketplaceRow[] = [];
  let otherListings: MarketplaceRow[] = listings;
  if (isOwnListing) {
    ownListings = listings.filter((r) => r.kind === 'listing' && isOwnListing(r.listing));
    otherListings = listings.filter((r) => r.kind === 'listing' && !isOwnListing(r.listing));
  }

  const sortedOwn = sortListingRows(ownListings, sort);
  const sortedOthers = sortListingRows(otherListings, sort);

  if (hideAuctions) return [...sortedOwn, ...sortedOthers];
  return [...sortedOwn, ...sortedAuctions, ...sortedOthers];
}

/** Language filter options: canonical codes with flag ISO. */
export const MARKETPLACE_LANGUAGE_FILTER_OPTIONS = [
  { code: 'IT', lang: 'it' },
  { code: 'GB', lang: 'en' },
  { code: 'DE', lang: 'de' },
  { code: 'FR', lang: 'fr' },
  { code: 'ES', lang: 'es' },
  { code: 'PT', lang: 'pt' },
  { code: 'JP', lang: 'ja' },
  { code: 'KR', lang: 'ko' },
  { code: 'CN', lang: 'zh-hans' },
  { code: 'TW', lang: 'zh-hant' },
  { code: 'RU', lang: 'ru' },
] as const;

export const CONDITION_FILTER_OPTIONS: ConditionCode[] = ['NM', 'SP', 'MP', 'PL', 'PO'];
