'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchPublicUserProfiles,
  getCachedUserProfile,
} from '@/lib/api/user-names-cache';
import type { CartSellerAccountType, MarketplaceCartLine } from '@/types';

export type SellerProfileMap = Record<
  string,
  { displayName: string; accountType: CartSellerAccountType | null }
>;

function accountTypeFromProfile(
  raw: string | null | undefined,
): CartSellerAccountType | null {
  if (raw === 'business' || raw === 'personal') return raw;
  return null;
}

export function useCartSellerProfiles(items: MarketplaceCartLine[]) {
  const sellerIds = useMemo(
    () => [
      ...new Set(
        items
          .filter((item) => !item.isBrxExpress)
          .map((item) => item.sellerId)
          .filter(Boolean),
      ),
    ],
    [items],
  );

  const [profiles, setProfiles] = useState<SellerProfileMap>({});

  useEffect(() => {
    if (sellerIds.length === 0) {
      setProfiles({});
      return;
    }

    let cancelled = false;

    const seedFromCache = (): SellerProfileMap => {
      const seeded: SellerProfileMap = {};
      for (const id of sellerIds) {
        const cached = getCachedUserProfile(id);
        if (cached?.username) {
          seeded[id] = {
            displayName: cached.username,
            accountType: accountTypeFromProfile(cached.account_type),
          };
        }
      }
      return seeded;
    };

    const needsFetch = sellerIds.some((id) => !getCachedUserProfile(id)?.username);
    const cachedSeed = seedFromCache();
    if (Object.keys(cachedSeed).length > 0) {
      setProfiles((prev) => ({ ...prev, ...cachedSeed }));
    }

    if (!needsFetch) return;

    void fetchPublicUserProfiles(sellerIds).then((map) => {
      if (cancelled) return;
      const next: SellerProfileMap = { ...cachedSeed };
      for (const id of sellerIds) {
        const profile = map[id];
        if (profile?.username) {
          next[id] = {
            displayName: profile.username,
            accountType: accountTypeFromProfile(profile.account_type),
          };
        }
      }
      setProfiles(next);
    });

    return () => {
      cancelled = true;
    };
  }, [sellerIds]);

  const resolveDisplayName = useCallback(
    (line: MarketplaceCartLine): string => {
      const trimmed = line.sellerDisplayName?.trim();
      if (trimmed) return trimmed;
      const fromProfile = profiles[line.sellerId]?.displayName;
      if (fromProfile) return fromProfile;
      const cached = getCachedUserProfile(line.sellerId)?.username;
      if (cached) return cached;
      return line.sellerId.slice(0, 8);
    },
    [profiles],
  );

  const resolveAccountType = useCallback(
    (line: MarketplaceCartLine): CartSellerAccountType | null => {
      if (line.sellerAccountType) return line.sellerAccountType;
      return profiles[line.sellerId]?.accountType ?? null;
    },
    [profiles],
  );

  return { profiles, resolveDisplayName, resolveAccountType };
}
