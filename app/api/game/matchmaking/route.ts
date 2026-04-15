import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WAITING_TTL_MS = 2 * 60_000;
const MATCH_TTL_MS = 10 * 60_000;

type MatchStatus = 'waiting' | 'matched' | 'not_found';

interface PlayerEntry {
  ticketId: string;
  userId: string;
  username: string;
}

interface WaitingEntry extends PlayerEntry {
  enqueuedAt: number;
}

interface MatchEntry {
  matchId: string;
  players: [PlayerEntry, PlayerEntry];
  createdAt: number;
  expiresAt: number;
}

interface MatchmakingStore {
  waiting: WaitingEntry[];
  matches: Record<string, MatchEntry>;
  ticketToMatch: Record<string, string>;
}

interface MatchmakingResponse {
  status: MatchStatus;
  ticketId: string;
  queueSize?: number;
  matchId?: string;
  opponent?: {
    userId: string;
    username: string;
  };
}

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 12)}-${Date.now()}`;
}

function normalizeText(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeUserId(value: unknown): string {
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : makeId('guest');
}

function normalizeUsername(value: unknown, userId: string): string {
  const normalized = normalizeText(value);
  if (normalized.length > 0) return normalized.slice(0, 40);
  return `Player-${userId.slice(0, 6)}`;
}

function getStore(): MatchmakingStore {
  const key = '__brx_game_matchmaking_store__';
  const globalAny = globalThis as unknown as Record<string, unknown>;

  if (!globalAny[key]) {
    globalAny[key] = {
      waiting: [],
      matches: {},
      ticketToMatch: {},
    } as MatchmakingStore;
  }

  return globalAny[key] as MatchmakingStore;
}

function cleanupStore(store: MatchmakingStore, now: number): void {
  store.waiting = store.waiting.filter((entry) => now - entry.enqueuedAt <= WAITING_TTL_MS);

  for (const [matchId, match] of Object.entries(store.matches)) {
    if (match.expiresAt > now) continue;

    delete store.matches[matchId];
    for (const p of match.players) {
      delete store.ticketToMatch[p.ticketId];
    }
  }
}

function getMatchForTicket(store: MatchmakingStore, ticketId: string): MatchEntry | null {
  const matchId = store.ticketToMatch[ticketId];
  if (!matchId) return null;

  const match = store.matches[matchId];
  if (!match) {
    delete store.ticketToMatch[ticketId];
    return null;
  }

  return match;
}

function waitingResponse(ticketId: string, queueSize: number): MatchmakingResponse {
  return {
    status: 'waiting',
    ticketId,
    queueSize,
  };
}

function matchedResponse(ticketId: string, match: MatchEntry): MatchmakingResponse {
  const me = match.players.find((p) => p.ticketId === ticketId);
  const opponent = match.players.find((p) => p.ticketId !== ticketId);

  if (!me || !opponent) {
    return {
      status: 'not_found',
      ticketId,
    };
  }

  return {
    status: 'matched',
    ticketId,
    matchId: match.matchId,
    opponent: {
      userId: opponent.userId,
      username: opponent.username,
    },
  };
}

export async function POST(request: NextRequest) {
  const now = Date.now();
  const store = getStore();
  cleanupStore(store, now);

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const userId = normalizeUserId(payload.userId);
  const username = normalizeUsername(payload.username, userId);
  const providedTicketId = normalizeText(payload.ticketId);
  const ticketId = providedTicketId.length > 0 ? providedTicketId : makeId('ticket');

  const alreadyMatched = getMatchForTicket(store, ticketId);
  if (alreadyMatched) {
    return NextResponse.json(matchedResponse(ticketId, alreadyMatched), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const waitingIndex = store.waiting.findIndex((entry) => entry.ticketId === ticketId);
  if (waitingIndex >= 0) {
    store.waiting[waitingIndex] = {
      ...store.waiting[waitingIndex],
      userId,
      username,
      enqueuedAt: now,
    };
  } else {
    store.waiting.push({
      ticketId,
      userId,
      username,
      enqueuedAt: now,
    });
  }

  const opponentIndex = store.waiting.findIndex(
    (entry) => entry.ticketId !== ticketId && entry.userId !== userId
  );

  if (opponentIndex === -1) {
    return NextResponse.json(waitingResponse(ticketId, store.waiting.length), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const opponent = store.waiting[opponentIndex];
  store.waiting = store.waiting.filter(
    (entry) => entry.ticketId !== ticketId && entry.ticketId !== opponent.ticketId
  );

  const matchId = makeId('match');
  const match: MatchEntry = {
    matchId,
    players: [
      { ticketId: opponent.ticketId, userId: opponent.userId, username: opponent.username },
      { ticketId, userId, username },
    ],
    createdAt: now,
    expiresAt: now + MATCH_TTL_MS,
  };

  store.matches[matchId] = match;
  store.ticketToMatch[ticketId] = matchId;
  store.ticketToMatch[opponent.ticketId] = matchId;

  return NextResponse.json(matchedResponse(ticketId, match), {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(request: NextRequest) {
  const now = Date.now();
  const store = getStore();
  cleanupStore(store, now);

  const ticketId = normalizeText(request.nextUrl.searchParams.get('ticketId'));
  if (!ticketId) {
    return NextResponse.json(
      { status: 'not_found', ticketId: '' } satisfies MatchmakingResponse,
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const match = getMatchForTicket(store, ticketId);
  if (match) {
    return NextResponse.json(matchedResponse(ticketId, match), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const waiting = store.waiting.find((entry) => entry.ticketId === ticketId);
  if (waiting) {
    return NextResponse.json(waitingResponse(ticketId, store.waiting.length), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  return NextResponse.json(
    {
      status: 'not_found',
      ticketId,
    } satisfies MatchmakingResponse,
    {
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}

export async function DELETE(request: NextRequest) {
  const ticketId = normalizeText(request.nextUrl.searchParams.get('ticketId'));
  if (!ticketId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const store = getStore();
  store.waiting = store.waiting.filter((entry) => entry.ticketId !== ticketId);

  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WAITING_TTL_MS = 2 * 60_000;
const MATCH_TTL_MS = 10 * 60_000;

type MatchStatus = 'waiting' | 'matched' | 'not_found';

interface PlayerEntry {
  ticketId: string;
  userId: string;
  username: string;
}

interface WaitingEntry extends PlayerEntry {
  enqueuedAt: number;
}

interface MatchEntry {
  matchId: string;
  players: [PlayerEntry, PlayerEntry];
  createdAt: number;
  expiresAt: number;
}

interface MatchmakingStore {
  waiting: WaitingEntry[];
  matches: Record<string, MatchEntry>;
  ticketToMatch: Record<string, string>;
}

interface MatchmakingResponse {
  status: MatchStatus;
  ticketId: string;
  queueSize?: number;
  matchId?: string;
  opponent?: {
    userId: string;
    username: string;
  };
}

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 12)}-${Date.now()}`;
}

function normalizeText(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeUserId(value: unknown): string {
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : makeId('guest');
}

function normalizeUsername(value: unknown, userId: string): string {
  const normalized = normalizeText(value);
  if (normalized.length > 0) return normalized.slice(0, 40);
  return `Player-${userId.slice(0, 6)}`;
}

function getStore(): MatchmakingStore {
  const key = '__brx_game_matchmaking_store__';
  const globalAny = globalThis as unknown as Record<string, unknown>;

  if (!globalAny[key]) {
    globalAny[key] = {
      waiting: [],
      matches: {},
      ticketToMatch: {},
    } as MatchmakingStore;
  }

  return globalAny[key] as MatchmakingStore;
}

function cleanupStore(store: MatchmakingStore, now: number): void {
  store.waiting = store.waiting.filter((entry) => now - entry.enqueuedAt <= WAITING_TTL_MS);

  for (const [matchId, match] of Object.entries(store.matches)) {
    if (match.expiresAt > now) continue;

    delete store.matches[matchId];
    for (const p of match.players) {
      delete store.ticketToMatch[p.ticketId];
    }
  }
}

function getMatchForTicket(store: MatchmakingStore, ticketId: string): MatchEntry | null {
  const matchId = store.ticketToMatch[ticketId];
  if (!matchId) return null;

  const match = store.matches[matchId];
  if (!match) {
    delete store.ticketToMatch[ticketId];
    return null;
  }

  return match;
}

function waitingResponse(ticketId: string, queueSize: number): MatchmakingResponse {
  return {
    status: 'waiting',
    ticketId,
    queueSize,
  };
}

function matchedResponse(ticketId: string, match: MatchEntry): MatchmakingResponse {
  const me = match.players.find((p) => p.ticketId === ticketId);
  const opponent = match.players.find((p) => p.ticketId !== ticketId);

  if (!me || !opponent) {
    return {
      status: 'not_found',
      ticketId,
    };
  }

  return {
    status: 'matched',
    ticketId,
    matchId: match.matchId,
    opponent: {
      userId: opponent.userId,
      username: opponent.username,
    },
  };
}

export async function POST(request: NextRequest) {
  const now = Date.now();
  const store = getStore();
  cleanupStore(store, now);

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const userId = normalizeUserId(payload.userId);
  const username = normalizeUsername(payload.username, userId);
  const providedTicketId = normalizeText(payload.ticketId);
  const ticketId = providedTicketId.length > 0 ? providedTicketId : makeId('ticket');

  const alreadyMatched = getMatchForTicket(store, ticketId);
  if (alreadyMatched) {
    return NextResponse.json(matchedResponse(ticketId, alreadyMatched), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const waitingIndex = store.waiting.findIndex((entry) => entry.ticketId === ticketId);
  if (waitingIndex >= 0) {
    store.waiting[waitingIndex] = {
      ...store.waiting[waitingIndex],
      userId,
      username,
      enqueuedAt: now,
    };
  } else {
    store.waiting.push({
      ticketId,
      userId,
      username,
      enqueuedAt: now,
    });
  }

  const opponentIndex = store.waiting.findIndex(
    (entry) => entry.ticketId !== ticketId && entry.userId !== userId
  );

  if (opponentIndex === -1) {
    return NextResponse.json(waitingResponse(ticketId, store.waiting.length), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const opponent = store.waiting[opponentIndex];
  store.waiting = store.waiting.filter(
    (entry) => entry.ticketId !== ticketId && entry.ticketId !== opponent.ticketId
  );

  const matchId = makeId('match');
  const match: MatchEntry = {
    matchId,
    players: [
      { ticketId: opponent.ticketId, userId: opponent.userId, username: opponent.username },
      { ticketId, userId, username },
    ],
    createdAt: now,
    expiresAt: now + MATCH_TTL_MS,
  };

  store.matches[matchId] = match;
  store.ticketToMatch[ticketId] = matchId;
  store.ticketToMatch[opponent.ticketId] = matchId;

  return NextResponse.json(matchedResponse(ticketId, match), {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(request: NextRequest) {
  const now = Date.now();
  const store = getStore();
  cleanupStore(store, now);

  const ticketId = normalizeText(request.nextUrl.searchParams.get('ticketId'));
  if (!ticketId) {
    return NextResponse.json(
      { status: 'not_found', ticketId: '' } satisfies MatchmakingResponse,
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const match = getMatchForTicket(store, ticketId);
  if (match) {
    return NextResponse.json(matchedResponse(ticketId, match), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const waiting = store.waiting.find((entry) => entry.ticketId === ticketId);
  if (waiting) {
    return NextResponse.json(waitingResponse(ticketId, store.waiting.length), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  return NextResponse.json(
    {
      status: 'not_found',
      ticketId,
    } satisfies MatchmakingResponse,
    {
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}

export async function DELETE(request: NextRequest) {
  const ticketId = normalizeText(request.nextUrl.searchParams.get('ticketId'));
  if (!ticketId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const store = getStore();
  store.waiting = store.waiting.filter((entry) => entry.ticketId !== ticketId);

  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
