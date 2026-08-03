import { describe, expect, it } from 'vitest';
import {
  isValidDisputeWsTicket,
  MAX_DISPUTE_WS_FRAME_BYTES,
  parseDisputeWsFrame,
} from '@/lib/ws/dispute-ws';

const validMessage = {
  type: 'message',
  data: {
    id: 9,
    dispute_id: 12,
    sender_user_id: '123e4567-e89b-12d3-a456-426614174000',
    body: 'Messaggio sicuro',
    created_at: '2026-08-03T12:34:56.123456+00:00',
  },
};

describe('dispute WebSocket validation', () => {
  it('accepts backend-compatible tickets only', () => {
    expect(isValidDisputeWsTicket('a'.repeat(32))).toBe(true);
    expect(isValidDisputeWsTicket('short')).toBe(false);
    expect(isValidDisputeWsTicket(`${'a'.repeat(31)}.`)).toBe(false);
  });

  it('returns a minimized message for the expected dispute', () => {
    const parsed = parseDisputeWsFrame(
      JSON.stringify({ ...validMessage, ignored: { privileged: true } }),
      12,
    );
    expect(parsed).toEqual(validMessage.data);
  });

  it.each([
    ['cross-dispute message', { ...validMessage, data: { ...validMessage.data, dispute_id: 13 } }],
    ['invalid sender', { ...validMessage, data: { ...validMessage.data, sender_user_id: '<script>' } }],
    ['invalid date', { ...validMessage, data: { ...validMessage.data, created_at: 'tomorrow' } }],
    ['oversized body', { ...validMessage, data: { ...validMessage.data, body: 'x'.repeat(4_001) } }],
    ['wrong envelope', { type: 'heartbeat', data: validMessage.data }],
  ])('rejects a %s', (_label, value) => {
    expect(parseDisputeWsFrame(JSON.stringify(value), 12)).toBeNull();
  });

  it('rejects non-text and oversized UTF-8 frames', () => {
    expect(parseDisputeWsFrame(new Uint8Array([1]), 12)).toBeNull();
    const oversized = JSON.stringify({
      ...validMessage,
      padding: '€'.repeat(MAX_DISPUTE_WS_FRAME_BYTES),
    });
    expect(parseDisputeWsFrame(oversized, 12)).toBeNull();
  });
});
