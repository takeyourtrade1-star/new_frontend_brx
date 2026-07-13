import type { RegistrationPendingResponse } from '@/types';

const STORAGE_PREFIX = 'ebartex-registration-verification:';

function storageKey(flowId: string): string {
  return `${STORAGE_PREFIX}${flowId}`;
}

export function savePendingRegistration(
  response: RegistrationPendingResponse
): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(storageKey(response.flow_id), JSON.stringify(response));
}

export function readPendingRegistration(
  flowId: string
): RegistrationPendingResponse | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(storageKey(flowId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RegistrationPendingResponse>;
    if (
      parsed.status !== 'verification_pending' ||
      parsed.flow_id !== flowId ||
      typeof parsed.destination !== 'string' ||
      typeof parsed.expires_at !== 'string' ||
      typeof parsed.resend_available_at !== 'string'
    ) {
      return null;
    }
    return parsed as RegistrationPendingResponse;
  } catch {
    return null;
  }
}

export function clearPendingRegistration(flowId: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(storageKey(flowId));
}

export function buildVerificationPath(
  flowId: string,
  returnTo?: string
): string {
  const params = new URLSearchParams({ flow_id: flowId });
  if (returnTo?.startsWith('/') && !returnTo.startsWith('//')) {
    params.set('returnTo', returnTo);
  }
  return `/registrati/verifica?${params.toString()}`;
}
