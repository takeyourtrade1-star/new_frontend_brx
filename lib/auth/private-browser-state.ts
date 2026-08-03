import { clearAllPendingRegistrations } from '@/lib/auth/registration-verification';
import { clearAllScanSessions } from '@/lib/scanner/scan-session-store';
import { clearTradeProposalContext } from '@/lib/scambi/trade-proposal-context';

/** Purge account-scoped browser artifacts on logout, expiry or principal switch. */
export function purgePrivateBrowserState(): void {
  if (typeof window === 'undefined') return;
  clearTradeProposalContext();
  clearAllPendingRegistrations();
  void clearAllScanSessions();
}
