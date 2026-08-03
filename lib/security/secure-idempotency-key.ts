import { createSecureRandomUuid } from '@/lib/security/secure-random-id';

/** Generate an opaque idempotency key using only the Web Crypto CSPRNG. */
export function createSecureIdempotencyKey(): string {
  try {
    return createSecureRandomUuid();
  } catch {
    throw new Error('Secure randomness is unavailable; request was not sent');
  }
}
