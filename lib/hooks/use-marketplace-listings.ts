import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { syncClient, type ListingItem } from '@/lib/api/sync-client';
import { getPublicListingsByBlueprint } from '@/lib/api/marketplace-client';
import { fetchPublicUserProfiles } from '@/lib/api/user-names-cache';
import {
  fetchListingCoverPhotos,
  type ListingCoverPhotoMap,
} from '@/lib/api/listing-photo-client';
import { mapPublicListingToListingItem } from '@/lib/marketplace/listing-map';
import { productDetailKeys } from '@/lib/product-detail/product-detail-keys';
import {
  MARKETPLACE_LISTINGS_TIMEOUT_MS,
  withTimeout,
} from '@/lib/product-detail/with-timeout';

const EMPTY_LISTING_COVER_PHOTOS: ListingCoverPhotoMap = {};
const LISTING_COVER_STALE_TIME_MS = 5 * 60 * 1000;

function retryTransientListingPhotoError(failureCount: number, error: Error): boolean {
  const status = 'status' in error
    ? (error as Error & { status?: number }).status
    : undefined;

  return failureCount < 1 && (status == null || status >= 500);
}

async function fetchRawListings(
  blueprintId: number,
  cardId: string | undefined
): Promise<ListingItem[]> {
  const emptyMarketplace = {
    blueprint_id: blueprintId,
    items: [] as const,
    total: 0,
  };
  const emptySync = {
    blueprint_id: blueprintId,
    listings: [] as ListingItem[],
  };

  const [syncResult, mktResult] = await Promise.allSettled([
    withTimeout(
      syncClient.getListingsByBlueprint(blueprintId).catch(() => emptySync),
      MARKETPLACE_LISTINGS_TIMEOUT_MS,
      emptySync
    ),
    withTimeout(
      getPublicListingsByBlueprint(blueprintId, cardId).catch(() => emptyMarketplace),
      MARKETPLACE_LISTINGS_TIMEOUT_MS,
      emptyMarketplace
    ),
  ]);

  const syncListings: ListingItem[] =
    syncResult.status === 'fulfilled'
      ? (syncResult.value.listings ?? []).map((l) => ({ ...l, listing_source: 'sync' as const }))
      : [];

  const marketplaceListings: ListingItem[] =
    mktResult.status === 'fulfilled'
      ? (mktResult.value.items ?? []).map(mapPublicListingToListingItem)
      : [];

  if (syncResult.status === 'rejected' && marketplaceListings.length === 0) {
    throw syncResult.reason;
  }

  return [...syncListings, ...marketplaceListings];
}

function mergeListingsWithProfiles(
  rawListings: ListingItem[],
  profiles: Record<string, { username?: string | null; country_code?: string | null; account_type?: string | null } | null>
): ListingItem[] {
  return rawListings.map((l) => {
    const profile = profiles[l.seller_id];
    if (!profile) return l;
    return {
      ...l,
      seller_display_name: profile.username ?? l.seller_display_name,
      country: profile.country_code ?? l.country ?? null,
      seller_account_type: profile.account_type ?? null,
    };
  });
}

export function useMarketplaceListings(blueprintId: number | null, cardId: string | undefined) {
  const queryClient = useQueryClient();

  const rawQuery = useQuery({
    queryKey: blueprintId != null ? productDetailKeys.listings(blueprintId) : ['product-detail', 'listings', 'none'],
    queryFn: () => fetchRawListings(blueprintId!, cardId),
    enabled: blueprintId != null,
    staleTime: 15_000,
  });

  const rawListings = useMemo(() => rawQuery.data ?? [], [rawQuery.data]);
  const sellerIds = useMemo(
    () => [...new Set(rawListings.map((l) => l.seller_id).filter(Boolean))].sort(),
    [rawListings]
  );
  const marketplaceListingIds = useMemo(
    () => [
      ...new Set(
        rawListings
          .filter((listing) => listing.listing_source === 'marketplace')
          .map((listing) => listing.marketplace_listing_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ].sort(),
    [rawListings],
  );

  const profilesQuery = useQuery({
    queryKey: productDetailKeys.sellerProfiles(sellerIds),
    queryFn: () => fetchPublicUserProfiles(sellerIds),
    enabled: sellerIds.length > 0,
    staleTime: 60_000,
  });

  const listingCoverPhotosQuery = useQuery({
    queryKey: productDetailKeys.listingCoverPhotos(marketplaceListingIds),
    queryFn: () => fetchListingCoverPhotos(marketplaceListingIds),
    enabled: marketplaceListingIds.length > 0,
    staleTime: LISTING_COVER_STALE_TIME_MS,
    retry: retryTransientListingPhotoError,
    placeholderData: (previousData) => previousData,
  });

  const listings = useMemo(() => {
    if (!profilesQuery.data) return rawListings;
    return mergeListingsWithProfiles(rawListings, profilesQuery.data);
  }, [rawListings, profilesQuery.data]);

  const refetchListings = useCallback(async () => {
    if (blueprintId == null) return;
    await queryClient.invalidateQueries({ queryKey: productDetailKeys.listings(blueprintId) });
    if (sellerIds.length > 0) {
      await queryClient.invalidateQueries({ queryKey: productDetailKeys.sellerProfiles(sellerIds) });
    }
  }, [blueprintId, queryClient, sellerIds]);

  const pollSyncTaskThenRefresh = useCallback(
    async (taskId: string, accessToken: string) => {
      const maxPolls = 60;
      const intervalMs = 2500;
      for (let i = 0; i < maxPolls; i++) {
        await new Promise((r) => setTimeout(r, intervalMs));
        try {
          const status = await syncClient.getTaskStatus(taskId, accessToken);
          if (status.ready) {
            await refetchListings();
            return;
          }
        } catch (error) {
          const status =
            error instanceof Error && 'status' in error
              ? (error as Error & { status?: number }).status
              : undefined;
          if (status === 429) {
            console.warn('[sync polling] rate limit raggiunto; polling interrotto');
            return;
          }
          if (i === maxPolls - 1) {
            console.warn('[sync polling] task non completato entro la finestra prevista');
          }
        }
      }
    },
    [refetchListings]
  );

  return {
    listings,
    listingsLoading: rawQuery.isLoading,
    listingsError: rawQuery.error instanceof Error ? rawQuery.error.message : rawQuery.error ? String(rawQuery.error) : null,
    listingCoverPhotos: listingCoverPhotosQuery.data ?? EMPTY_LISTING_COVER_PHOTOS,
    refetchListings,
    pollSyncTaskThenRefresh,
  };
}
