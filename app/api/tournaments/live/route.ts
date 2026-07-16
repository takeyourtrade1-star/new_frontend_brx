import { NextRequest, NextResponse } from 'next/server';
import { publicCacheHeaders } from '@/app/api/_lib/proxy-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';

export const dynamic = 'force-dynamic';

const TOURNAMENTS_API_URL = (
  process.env.TOURNAMENTS_API_URL ||
  process.env.NEXT_PUBLIC_TOURNAMENTS_API_URL ||
  'https://api-tornei.ebartex.com'
).replace(/\/+$/, '');

const UPSTREAM_TIMEOUT_MS = 8_000;

type TournamentPayload = {
  id?: unknown;
  format?: unknown;
  mode?: unknown;
  best_of?: unknown;
  participants_count?: unknown;
  max_players?: unknown;
  created_at?: unknown;
};

type LiveTournament = {
  id: string;
  format: string;
  mode: string;
  bestOf: string;
  participantsCount: number;
  maxPlayers: number;
  createdAt: string;
};

function asRecords(payload: unknown): TournamentPayload[] {
  if (!payload || typeof payload !== 'object') return [];
  const data = (payload as { data?: unknown }).data;
  return Array.isArray(data) ? data.filter((item): item is TournamentPayload => Boolean(item && typeof item === 'object')) : [];
}

function toLiveTournament(raw: TournamentPayload): LiveTournament | null {
  if (typeof raw.id !== 'string' || typeof raw.format !== 'string' || typeof raw.mode !== 'string') {
    return null;
  }

  return {
    id: raw.id,
    format: raw.format,
    mode: raw.mode,
    bestOf: typeof raw.best_of === 'string' ? raw.best_of : 'BO3',
    participantsCount: typeof raw.participants_count === 'number' ? raw.participants_count : 0,
    maxPlayers: typeof raw.max_players === 'number' ? raw.max_players : 2,
    createdAt: typeof raw.created_at === 'string' ? raw.created_at : '',
  };
}

async function fetchTournaments(): Promise<TournamentPayload[]> {
  const url = new URL('/api/v1/tournaments/live', TOURNAMENTS_API_URL);

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (!response.ok) return [];
  return asRecords(await response.json().catch(() => null));
}

export async function GET(request: NextRequest) {
  const rateLimit = checkRateLimit(request, {
    scope: 'tournaments-live',
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit);

  try {
    const response = await fetchTournaments();
    const unique = new Map<string, LiveTournament>();
    for (const tournament of response.map(toLiveTournament)) {
      if (tournament) unique.set(tournament.id, tournament);
    }
    const items = [...unique.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8);

    return NextResponse.json({ data: { items } }, { headers: publicCacheHeaders(10, 30) });
  } catch {
    return NextResponse.json(
      { detail: 'Tournaments live request failed' },
      { status: 502, headers: publicCacheHeaders(0, 0) },
    );
  }
}
