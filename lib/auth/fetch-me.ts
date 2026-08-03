import { authApi } from '@/lib/api/auth-client';
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

/** Fetch and normalize the current user without persisting PII in browser storage. */
export async function fetchMe(): Promise<User | null> {
  const response = await authApi.get<AuthMeResponse>('/api/auth/me');
  const raw = extractUserFromMeResponse(response);
  return normalizeUser(raw as AuthMeUser | null);
}
