import type { AuctionUI, BidRowUI } from '@/lib/auction/auction-adapter';
import {
  fetchPublicUserProfiles,
  type PublicAccountType,
} from '@/lib/api/user-names-cache';

export interface AuctionPublicIdentity {
  sellerUsername: string;
  sellerCountry: string;
  sellerAccountType: PublicAccountType;
}

function fallbackSellerName(id: string | null | undefined): string {
  if (!id) return '---';
  return id;
}

export async function enrichAuctionsWithPublicUsers(
  auctions: AuctionUI[]
): Promise<AuctionUI[]> {
  if (auctions.length === 0) return auctions;
  const ids = auctions
    .map((auction) => auction.createdByUserId)
    .filter((id): id is string => Boolean(id));
  if (ids.length === 0) return auctions;

  const profilesById = await fetchPublicUserProfiles(ids);
  return auctions.map((auction) => {
    const sellerId = auction.createdByUserId;
    const profile = sellerId ? profilesById[sellerId] : null;
    return {
      ...auction,
      seller: profile?.username ?? fallbackSellerName(sellerId),
      sellerDisplayName: profile?.username ?? '---',
      sellerCountry: profile?.country_code ?? auction.sellerCountry ?? 'IT',
      sellerAccountType: profile?.account_type ?? 'personal',
    };
  });
}

export async function enrichBidRowsWithPublicUsers(
  rows: BidRowUI[]
): Promise<BidRowUI[]> {
  if (rows.length === 0) return rows;
  const ids = rows
    .map((row) => row.userId)
    .filter((id): id is string => Boolean(id));
  if (ids.length === 0) return rows;

  const profilesById = await fetchPublicUserProfiles(ids);
  return rows.map((row) => {
    const profile = profilesById[row.userId];
    return {
      ...row,
      username: profile?.username ?? row.username,
      displayName: profile?.username ?? row.displayName,
      countryCode: profile?.country_code ?? row.countryCode,
    };
  });
}

