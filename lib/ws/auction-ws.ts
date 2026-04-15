/**
 * WebSocket client for live auction bid updates.
 * Connects directly to the auction backend (wss://auction.ebartex.com/auctions/{id}/ws).
 * Auto-reconnects with exponential backoff. Sends periodic pings as heartbeat.
 */

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

const WS_BASE =
  (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_AUCTION_WS_URL) || '';

const PING_INTERVAL_MS = 25_000;
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

export class AuctionWebSocket {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private closed = false;
  private readonly url: string;

  constructor(auctionId: number) {
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
      const raw = typeof ev.data === 'string' ? ev.data : '';
      if (raw === 'pong') return;
      try {
        const event: AuctionWsEvent = JSON.parse(raw);
        if (event.type === 'heartbeat') return;
        this.listeners.forEach((fn) => fn(event));
      } catch {
        // ignore non-JSON messages
      }
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
