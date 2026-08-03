import { describe, expect, it } from 'vitest';
import {
  MAX_AUCTION_WS_FRAME_BYTES,
  parseAuctionWsEventFrame,
} from '@/lib/ws/auction-ws';

describe('auction WebSocket frame parser', () => {
  it('accepts a bounded bid for the expected auction and drops unknown fields', () => {
    const parsed = parseAuctionWsEventFrame(
      JSON.stringify({
        type: 'bid',
        auction_id: 42,
        auction: { id: 42 },
        bids: [{ id: 7 }],
        outbid: false,
        idempotency_replayed: false,
        attacker_controlled: 'drop-me',
      }),
      42,
    );

    expect(parsed).toEqual({
      type: 'bid',
      auction_id: 42,
      auction: { id: 42 },
      bids: [{ id: 7 }],
      outbid: false,
    });
  });

  it.each([
    ['cross-auction event', JSON.stringify({ type: 'bid', auction_id: 43 }), 42],
    ['unknown type', JSON.stringify({ type: 'admin', auction_id: 42 }), 42],
    ['invalid bids shape', JSON.stringify({ type: 'bid', auction_id: 42, bids: ['bad'] }), 42],
    ['binary frame', new Uint8Array([1, 2, 3]), 42],
  ])('rejects a %s', (_label, frame, expectedId) => {
    expect(parseAuctionWsEventFrame(frame, expectedId)).toBeNull();
  });

  it('rejects oversized UTF-8 frames before parsing', () => {
    const frame = JSON.stringify({
      type: 'bid',
      auction_id: 42,
      message: '€'.repeat(MAX_AUCTION_WS_FRAME_BYTES),
    });
    expect(parseAuctionWsEventFrame(frame, 42)).toBeNull();
  });

  it('ignores heartbeat and pong frames', () => {
    expect(parseAuctionWsEventFrame('pong', 42)).toBeNull();
    expect(parseAuctionWsEventFrame('{"type":"heartbeat"}', 42)).toBeNull();
  });
});
