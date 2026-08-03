import type { RegistrationPendingResponse } from '@/types';
import { sanitizeInternalReturnPath } from '@/lib/security/internal-return-path';

const STORAGE_PREFIX = 'ebartex-registration-verification:';
const VERIFICATION_TOKEN_PATTERN = /^[A-Za-z0-9._~-]{32,256}$/;
const FLOW_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_DESTINATION_LENGTH = 254;
const MAX_TIMESTAMP_LENGTH = 64;

function storageKey(flowId: string): string {
  return `${STORAGE_PREFIX}${flowId}`;
}

function safeTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_TIMESTAMP_LENGTH &&
    Number.isFinite(Date.parse(value))
  );
}

/**
 * Browser storage must never mirror an upstream object wholesale. This
 * allowlist deliberately excludes verification codes, link tokens,
 * idempotency keys and registration form fields even if a future backend
 * response accidentally includes them.
 */
function sanitizePendingRegistration(
  value: unknown,
  expectedFlowId?: string
): RegistrationPendingResponse | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;

  if (
    candidate.status !== 'verification_pending' ||
    typeof candidate.flow_id !== 'string' ||
    !FLOW_ID_PATTERN.test(candidate.flow_id) ||
    (expectedFlowId !== undefined && candidate.flow_id !== expectedFlowId) ||
    typeof candidate.destination !== 'string' ||
    candidate.destination.length === 0 ||
    candidate.destination.length > MAX_DESTINATION_LENGTH ||
    !safeTimestamp(candidate.expires_at) ||
    !safeTimestamp(candidate.resend_available_at) ||
    candidate.delivery_status !== 'queued'
  ) {
    return null;
  }

  return {
    status: 'verification_pending',
    flow_id: candidate.flow_id,
    destination: candidate.destination,
    expires_at: candidate.expires_at,
    resend_available_at: candidate.resend_available_at,
    delivery_status: 'queued',
  };
}

export function savePendingRegistration(
  response: RegistrationPendingResponse
): void {
  if (typeof window === 'undefined') return;
  const safe = sanitizePendingRegistration(response);
  if (!safe) return;
  try {
    sessionStorage.setItem(storageKey(safe.flow_id), JSON.stringify(safe));
  } catch {
    // Storage can be disabled or full; server-side verification remains usable.
  }
}

export function readPendingRegistration(
  flowId: string
): RegistrationPendingResponse | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(storageKey(flowId));
    if (!raw) return null;
    const safe = sanitizePendingRegistration(JSON.parse(raw), flowId);
    if (!safe) {
      sessionStorage.removeItem(storageKey(flowId));
      return null;
    }

    // Rewrites old/untrusted entries to the same strict allowlist used on save.
    sessionStorage.setItem(storageKey(flowId), JSON.stringify(safe));
    return safe;
  } catch {
    try {
      sessionStorage.removeItem(storageKey(flowId));
    } catch {
      // Ignore inaccessible storage.
    }
    return null;
  }
}

export function clearPendingRegistration(flowId: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(storageKey(flowId));
}

export function clearAllPendingRegistrations(): void {
  if (typeof window === 'undefined') return;
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(STORAGE_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // Browser storage may be unavailable; server state remains authoritative.
  }
}

/**
 * Copy a link token into ephemeral component memory and remove it from the URL
 * before React renders. Tokens are intentionally never persisted in browser
 * storage or left in history where screenshots/extensions could retain them.
 */
export function readAndScrubVerificationToken(): string | null {
  if (typeof window === 'undefined') return null;

  const hash = window.location.hash;
  if (!hash) return null;

  const candidate = new URLSearchParams(hash.slice(1)).get('token');
  window.history.replaceState(
    null,
    '',
    window.location.pathname + window.location.search
  );

  return candidate !== null && VERIFICATION_TOKEN_PATTERN.test(candidate)
    ? candidate
    : null;
}

export function buildVerificationPath(
  flowId: string,
  returnTo?: string
): string {
  const params = new URLSearchParams({ flow_id: flowId });
  const safeReturnTo = sanitizeInternalReturnPath(returnTo);
  if (safeReturnTo) {
    params.set('returnTo', safeReturnTo);
  }
  return `/registrati/verifica?${params.toString()}`;
}
