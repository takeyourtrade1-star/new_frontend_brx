/**
 * User names cache - resolves user IDs to display names.
 * Used to show user names instead of truncated user codes.
 */

import { authApi } from './auth-client';

interface UserNameCache {
  [userId: string]: string | null;
}

const cache: UserNameCache = {};

export interface UserInfo {
  id: string;
  name: string | null;
  email?: string;
}

export async function fetchUserNames(userIds: string[]): Promise<UserNameCache> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const result: UserNameCache = {};

  for (const id of uniqueIds) {
    if (cache[id] !== undefined) {
      result[id] = cache[id];
    }
  }

  const uncachedIds = uniqueIds.filter((id) => cache[id] === undefined);
  if (uncachedIds.length === 0) {
    return result;
  }

  try {
    const response = await authApi.get(`/api/auth/users?ids=${uncachedIds.join(',')}`) as any;
    const users: UserInfo[] = response?.users ?? response?.data ?? [];

    for (const user of users) {
      if (user?.id) {
        cache[user.id] = user.name ?? user.email?.split('@')[0] ?? null;
        result[user.id] = cache[user.id];
      }
    }

    for (const id of uncachedIds) {
      if (result[id] === undefined) {
        cache[id] = null;
        result[id] = null;
      }
    }
  } catch (err) {
    console.error('[user-names-cache] Failed to fetch user names:', err);
    for (const id of uncachedIds) {
      cache[id] = null;
      result[id] = null;
    }
  }

  return result;
}

export function getUserName(userId: string | null | undefined): string {
  if (!userId) return '---';
  const cached = cache[userId];
  if (cached !== undefined) {
    return cached ?? '---';
  }
  return '---';
}

export function setUserName(userId: string, name: string | null): void {
  cache[userId] = name;
}

export function getCachedUserName(userId: string | null | undefined): string | null {
  if (!userId) return null;
  return cache[userId] ?? null;
}
