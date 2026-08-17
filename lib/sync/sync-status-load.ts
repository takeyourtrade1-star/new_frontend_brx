export type SyncStatusLoadFailure = 'not_configured' | 'unavailable';

/** Un profilo assente (404) è onboarding; ogni altro errore lascia lo stato ignoto. */
export function classifySyncStatusLoadFailure(error: unknown): SyncStatusLoadFailure {
  const status = (error as { status?: number } | null)?.status;
  return status === 404 ? 'not_configured' : 'unavailable';
}
