import type { DisputeMessageAPI } from '@/types/dispute';

export const MAX_DISPUTE_WS_FRAME_BYTES = 65_536;
const MAX_DISPUTE_MESSAGE_CHARS = 4_000;
const DISPUTE_TICKET_RE = /^[A-Za-z0-9_-]{32,128}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isValidDisputeWsTicket(value: unknown): value is string {
  return typeof value === 'string' && DISPUTE_TICKET_RE.test(value);
}

/** Validate and minimize an untrusted dispute WebSocket message envelope. */
export function parseDisputeWsFrame(
  frame: unknown,
  expectedDisputeId: number,
): DisputeMessageAPI | null {
  if (
    typeof frame !== 'string' ||
    !Number.isSafeInteger(expectedDisputeId) ||
    expectedDisputeId <= 0 ||
    new TextEncoder().encode(frame).byteLength > MAX_DISPUTE_WS_FRAME_BYTES
  ) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(frame);
  } catch {
    return null;
  }
  if (!isRecord(parsed) || parsed.type !== 'message' || !isRecord(parsed.data)) {
    return null;
  }

  const data = parsed.data;
  if (!Number.isSafeInteger(data.id) || (data.id as number) <= 0) return null;
  if (data.dispute_id !== expectedDisputeId) return null;
  if (typeof data.sender_user_id !== 'string' || !UUID_RE.test(data.sender_user_id)) {
    return null;
  }
  if (
    typeof data.body !== 'string' ||
    data.body.trim().length === 0 ||
    data.body.length > MAX_DISPUTE_MESSAGE_CHARS
  ) {
    return null;
  }
  if (
    typeof data.created_at !== 'string' ||
    !ISO_TIMESTAMP_RE.test(data.created_at) ||
    !Number.isFinite(Date.parse(data.created_at))
  ) {
    return null;
  }

  return {
    id: data.id as number,
    dispute_id: expectedDisputeId,
    sender_user_id: data.sender_user_id,
    body: data.body,
    created_at: data.created_at,
  };
}
