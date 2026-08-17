'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth-client';
import type { PublicUserCollectionResponse } from '@/types';

export function usePublicUserCollection(
  username: string,
  params?: { limit?: number; offset?: number },
  enabled = true,
) {
  const limit = params?.limit ?? 48;
  const offset = params?.offset ?? 0;

  return useQuery({
    queryKey: ['public-user-collection', username, limit, offset],
    queryFn: async () => {
      const sp = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      const response = await authApi.get<PublicUserCollectionResponse>(
        `/api/auth/users/${encodeURIComponent(username)}/collection?${sp}`,
      );
      return response?.data ?? { items: [], total: 0, limit, offset };
    },
    enabled: enabled && username.length > 0,
    staleTime: 60_000,
  });
}

const TRADE_COLLECTION_PAGE_SIZE = 60;

/**
 * Collezione pubblica paginata per i picker degli scambi.
 *
 * Carica una pagina alla volta: gli inventari grandi non vengono materializzati
 * tutti insieme nel DOM e le pagine successive partono solo su richiesta.
 */
export function useInfinitePublicUserCollection(
  username: string,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: ['public-user-collection', 'infinite', username, TRADE_COLLECTION_PAGE_SIZE],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = Number(pageParam);
      const sp = new URLSearchParams({
        limit: String(TRADE_COLLECTION_PAGE_SIZE),
        offset: String(offset),
      });
      const response = await authApi.get<PublicUserCollectionResponse>(
        `/api/auth/users/${encodeURIComponent(username)}/collection?${sp}`,
      );
      return response?.data ?? {
        items: [],
        total: 0,
        limit: TRADE_COLLECTION_PAGE_SIZE,
        offset,
      };
    },
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.offset + lastPage.items.length;
      return nextOffset < lastPage.total && lastPage.items.length > 0
        ? nextOffset
        : undefined;
    },
    enabled: enabled && username.length > 0,
    staleTime: 60_000,
  });
}
