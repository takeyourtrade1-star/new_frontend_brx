/**
 * WebSocket client for live auction bid updates.
 * Connects directly to the auction backend (wss://auction.ebartex.com/auctions/{id}/ws).
 * Auto-reconnects with exponential backoff. Sends periodic pings as heartbeat.
 */

import { publicAuctionWsOrigin } from '@/lib/ws/public-auction-ws-origin';

export type AuctionWsEvent = {
  type: 'bid' | 'heartbeat' | 'error';
  auction_id?: number;
  auction?: Record<string, unknown>;
  bids?: Array<Record<string, unknown>>;
  outbid?: boolean;
  outbid_message?: string | null;
  message?: string;
};

type Listener = (event: AuctionWsEvent) => void;

const WS_BASE = typeof window !== 'undefined' ? publicAuctionWsOrigin() : '';

export const MAX_AUCTION_WS_FRAME_BYTES = 65_536;
const MAX_AUCTION_BIDS_PER_FRAME = 200;
const MAX_WS_MESSAGE_CHARS = 1_000;
const PING_INTERVAL_MS = 25_000;
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isOptionalShortString(value: unknown): value is string | undefined {
  return value === undefined || (typeof value === 'string' && value.length <= MAX_WS_MESSAGE_CHARS);
}

/**
 * Validate and minimize an untrusted auction WebSocket frame before any UI
 * listener sees it. The byte cap mirrors the auction backend's outbound cap.
 */
export function parseAuctionWsEventFrame(
  data: unknown,
  expectedAuctionId?: number,
): AuctionWsEvent | null {
  if (typeof data !== 'string' || data === 'pong') return null;
  if (new TextEncoder().encode(data).byteLength > MAX_AUCTION_WS_FRAME_BYTES) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;

  if (parsed.type === 'heartbeat') return null;
  if (parsed.type === 'error') {
    if (
      typeof parsed.message !== 'string' ||
      parsed.message.length < 1 ||
      parsed.message.length > MAX_WS_MESSAGE_CHARS
    ) {
      return null;
    }
    return { type: 'error', message: parsed.message };
  }
  if (parsed.type !== 'bid') return null;

  const auctionId = parsed.auction_id;
  if (!Number.isSafeInteger(auctionId) || (auctionId as number) <= 0) return null;
  if (
    expectedAuctionId !== undefined &&
    (!Number.isSafeInteger(expectedAuctionId) || auctionId !== expectedAuctionId)
  ) {
    return null;
  }
  if (parsed.auction !== undefined && !isRecord(parsed.auction)) return null;
  if (
    parsed.bids !== undefined &&
    (!Array.isArray(parsed.bids) ||
      parsed.bids.length > MAX_AUCTION_BIDS_PER_FRAME ||
      !parsed.bids.every(isRecord))
  ) {
    return null;
  }
  if (parsed.outbid !== undefined && typeof parsed.outbid !== 'boolean') return null;
  if (
    parsed.outbid_message !== undefined &&
    parsed.outbid_message !== null &&
    (typeof parsed.outbid_message !== 'string' ||
      parsed.outbid_message.length > MAX_WS_MESSAGE_CHARS)
  ) {
    return null;
  }
  if (!isOptionalShortString(parsed.message)) return null;

  return {
    type: 'bid',
    auction_id: auctionId as number,
    ...(parsed.auction === undefined ? {} : { auction: parsed.auction }),
    ...(parsed.bids === undefined ? {} : { bids: parsed.bids as Array<Record<string, unknown>> }),
    ...(parsed.outbid === undefined ? {} : { outbid: parsed.outbid }),
    ...(parsed.outbid_message === undefined
      ? {}
      : { outbid_message: parsed.outbid_message as string | null }),
    ...(parsed.message === undefined ? {} : { message: parsed.message }),
  };
}

export class AuctionWebSocket {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private closed = false;
  private readonly url: string;
  private readonly auctionId: number;

  constructor(auctionId: number) {
    this.auctionId = auctionId;
    this.url = `${WS_BASE}/auctions/${auctionId}/ws`;
  }

  connect(): void {
    if (this.closed || !WS_BASE) return;
    this.cleanup();

    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.startPing();
    };

    this.ws.onmessage = (ev) => {
      const event = parseAuctionWsEventFrame(ev.data, this.auctionId);
      if (!event) return;
      this.listeners.forEach((fn) => fn(event));
    };

    this.ws.onclose = () => {
      this.stopPing();
      if (!this.closed) this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  close(): void {
    this.closed = true;
    this.cleanup();
    this.listeners.clear();
  }

  private cleanup(): void {
    this.stopPing();
    if (this.reconnectTimer != null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, PING_INTERVAL_MS);
  }

  private stopPing(): void {
    if (this.pingTimer != null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.closed) return;
    const delay = Math.min(RECONNECT_BASE_MS * 2 ** this.reconnectAttempt, RECONNECT_MAX_MS);
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }
}
