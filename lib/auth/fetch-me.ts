import { authApi } from '@/lib/api/auth-client';
import { config } from '@/lib/config';
import type { AuthMeResponse, AuthMeUser, User } from '@/types';
import { normalizeUser } from './normalize-user';

function extractUserFromMeResponse(response: AuthMeResponse): unknown {
  if (response && typeof response === 'object') {
    if ('user' in response) {
      return response.user;
    }
    if ('data' in response) {
      const data = response.data;
      if (data && typeof data === 'object' && 'user' in data) {
        return data.user;
      }
      return data;
    }
  }
  return response;
}

/** Fetch the current user from /api/auth/me, normalize it and cache to localStorage. */
export async function fetchMe(): Promise<User | null> {
  const response = await authApi.get<AuthMeResponse>('/api/auth/me');
  const raw = extractUserFromMeResponse(response);
  const normalized = normalizeUser(raw as AuthMeUser | null);
  if (normalized && typeof window !== 'undefined') {
    localStorage.setItem(config.auth.userKey, JSON.stringify(normalized));
  }
  return normalized;
}
