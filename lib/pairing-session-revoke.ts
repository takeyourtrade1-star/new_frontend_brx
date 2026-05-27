import { revokePhotoPairingSession } from '@/lib/api/auction-photo-client';

/** Best-effort close of a QR pairing session; never throws. */
export async function revokePairingSessionSafe(sessionId: string | null | undefined): Promise<void> {
  if (!sessionId) return;
  try {
    await revokePhotoPairingSession(sessionId);
  } catch {
    /* session may already be closed or expired */
  }
}
