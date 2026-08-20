import {
  revokePhotoPairingSession,
  type RevokePhotoPairingSessionOptions,
} from '@/lib/api/auction-photo-client';

/** Best-effort close of a QR pairing session; never throws. */
export async function revokePairingSessionSafe(
  sessionId: string | null | undefined,
  options: RevokePhotoPairingSessionOptions = {},
): Promise<void> {
  if (!sessionId) return;
  try {
    await revokePhotoPairingSession(sessionId, options);
  } catch {
    /* session may already be closed or expired */
  }
}
