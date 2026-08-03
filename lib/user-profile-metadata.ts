import 'server-only';

import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { fetchWithBodyDeadline } from '@/app/api/_lib/upstream-fetch';
import { trustedAuthServiceOrigin } from '@/app/api/_lib/upstream-url';
import { getAuthApiUrlEnv } from '@/lib/server-runtime-env';

const PUBLIC_USERNAME_RE = /^[A-Za-z0-9_.-]{1,50}$/;
const MAX_PROFILE_RESPONSE_BYTES = 32 * 1024;
const PROFILE_TIMEOUT_MS = 5_000;
const MAX_BIO_CHARACTERS = 300;

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Fetch only the bounded public field used by metadata; fail closed to null. */
export async function fetchPublicProfileBio(username: string): Promise<string | null> {
  if (!PUBLIC_USERNAME_RE.test(username)) return null;
  const authOrigin = trustedAuthServiceOrigin(getAuthApiUrlEnv());
  if (!authOrigin) return null;

  const url = new URL(
    `/api/auth/users/${encodeURIComponent(username)}`,
    authOrigin,
  );
  try {
    const response = await fetchWithBodyDeadline(
      url,
      {
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'identity',
        },
        cache: 'no-store',
        redirect: 'error',
      },
      PROFILE_TIMEOUT_MS,
    );
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      return null;
    }
    const payload = record(
      await readJsonResponseWithLimit(response, MAX_PROFILE_RESPONSE_BYTES),
    );
    const data = record(payload?.data);
    const bio = data?.bio;
    if (bio === null || bio === undefined) return null;
    if (typeof bio !== 'string' || bio.length > MAX_BIO_CHARACTERS) return null;
    return bio;
  } catch {
    return null;
  }
}
