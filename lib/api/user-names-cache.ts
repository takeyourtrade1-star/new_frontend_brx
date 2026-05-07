/**
 * Public user profile cache.
 *
 * Resolves auth-service public profiles by user IDs:
 *   GET /api/auth/users/public?ids=<csv>
 *
 * This is frontend-only and intentionally exposes only public-safe fields:
 * username, country_code, account_type and optional avatar_url.
 */

import { authApi } from './auth-client';

export type PublicAccountType = 'personal' | 'business';

export interface PublicUserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  country_code: string | null;
  account_type: PublicAccountType;
}

interface PublicUsersBulkResponse {
  success: boolean;
  data: PublicUserProfile[];
  count: number;
  not_found?: string[];
}

interface UserProfileCache {
  [userId: string]: PublicUserProfile | null;
}

const profileCache: UserProfileCache = {};
let resolverBackoffUntil = 0;

const UNKNOWN_PROFILE: Omit<PublicUserProfile, 'id'> = {
  username: '---',
  avatar_url: null,
  country_code: null,
  account_type: 'personal',
};

function asProfileMap(ids: string[]): Record<string, PublicUserProfile | null> {
  const out: Record<string, PublicUserProfile | null> = {};
  for (const id of ids) {
    if (!id) continue;
    out[id] = profileCache[id] ?? null;
  }
  return out;
}

function chunk<T>(values: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < values.length; i += size) {
    out.push(values.slice(i, i + size));
  }
  return out;
}

export async function fetchPublicUserProfiles(
  userIds: string[]
): Promise<Record<string, PublicUserProfile | null>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return {};

  const uncachedIds = uniqueIds.filter((id) => profileCache[id] === undefined);
  if (uncachedIds.length === 0) {
    return asProfileMap(uniqueIds);
  }
  if (Date.now() < resolverBackoffUntil) {
    for (const id of uncachedIds) {
      profileCache[id] = null;
    }
    return asProfileMap(uniqueIds);
  }

  try {
    const groups = chunk(uncachedIds, 100);
    for (const idsChunk of groups) {
      const response = await authApi.get<PublicUsersBulkResponse>(
        `/api/auth/users/public?ids=${idsChunk.join(',')}`
      );
      const users = Array.isArray(response?.data) ? response.data : [];
      const found = new Set<string>();

      for (const user of users) {
        if (!user?.id) continue;
        found.add(user.id);
        profileCache[user.id] = {
          id: user.id,
          username: user.username ?? UNKNOWN_PROFILE.username,
          avatar_url: user.avatar_url ?? null,
          country_code: user.country_code ?? null,
          account_type: user.account_type ?? 'personal',
        };
      }

      for (const id of idsChunk) {
        if (!found.has(id) && profileCache[id] === undefined) {
          profileCache[id] = null;
        }
      }
    }
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 503 || status === 403 || status === 429) {
      // Short circuit repeated noisy calls when endpoint is temporarily blocked
      // by infra policy (internal token / allowlist / rate limit).
      resolverBackoffUntil = Date.now() + 60_000;
    }
    console.error('[user-names-cache] Failed to fetch public user profiles:', err);
    for (const id of uncachedIds) {
      profileCache[id] = null;
    }
  }

  return asProfileMap(uniqueIds);
}

export async function fetchUserNames(
  userIds: string[]
): Promise<Record<string, string | null>> {
  const profiles = await fetchPublicUserProfiles(userIds);
  const names: Record<string, string | null> = {};
  for (const [id, profile] of Object.entries(profiles)) {
    names[id] = profile?.username ?? null;
  }
  return names;
}

export function getUserName(userId: string | null | undefined): string {
  if (!userId) return '---';
  const cached = profileCache[userId];
  if (cached !== undefined) {
    return cached?.username ?? '---';
  }
  return '---';
}

export function setUserName(userId: string, name: string | null): void {
  if (!name) {
    profileCache[userId] = null;
    return;
  }
  profileCache[userId] = {
    id: userId,
    ...UNKNOWN_PROFILE,
    username: name,
  };
}

export function getCachedUserName(
  userId: string | null | undefined
): string | null {
  if (!userId) return null;
  return profileCache[userId]?.username ?? null;
}

export function getCachedUserProfile(
  userId: string | null | undefined
): PublicUserProfile | null {
  if (!userId) return null;
  return profileCache[userId] ?? null;
}
