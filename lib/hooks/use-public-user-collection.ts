'use client';

import { useQuery } from '@tanstack/react-query';
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
