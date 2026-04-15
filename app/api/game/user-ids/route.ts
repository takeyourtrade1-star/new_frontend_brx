import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const AUTH_API_URL = (
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  process.env.AUTH_API_URL ||
  process.env.VITE_AWS_AUTH_URL ||
  ''
).replace(/\/+$/, '');

const GAME_USERS_API_PATH = process.env.GAME_USERS_API_PATH || '/api/auth/users';
const AUTH_ME_PATH = '/api/auth/me';

function normalizeId(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function extractUserIds(payload: unknown): string[] {
  const ids = new Set<string>();
  const queue: unknown[] = [payload];
  const seen = new Set<object>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (current == null) continue;

    if (Array.isArray(current)) {
      for (const item of current) queue.push(item);
      continue;
    }

    if (typeof current !== 'object') {
      const primitiveId = normalizeId(current);
      if (primitiveId) ids.add(primitiveId);
      continue;
    }

    if (seen.has(current)) continue;
    seen.add(current);

    const record = current as Record<string, unknown>;

    const directIdCandidates = [record.id, record.user_id, record.userId];
    for (const candidate of directIdCandidates) {
      const id = normalizeId(candidate);
      if (id) ids.add(id);
    }

    const containerKeys = [
      'ids',
      'user_ids',
      'userIds',
      'data',
      'users',
      'results',
      'items',
      'participants',
      'players',
    ];

    for (const key of containerKeys) {
      if (key in record) queue.push(record[key]);
    }
  }

  return Array.from(ids);
}

function buildAuthHeaders(request: NextRequest): HeadersInit {
  const incomingAuth = request.headers.get('authorization') || request.headers.get('Authorization');
  const tokenFromCookie = request.cookies.get('ebartex_access_token')?.value;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (incomingAuth) {
    headers.Authorization = incomingAuth;
  } else if (tokenFromCookie) {
    headers.Authorization = `Bearer ${decodeURIComponent(tokenFromCookie)}`;
  }

  return headers;
}

async function fetchUserIdsFromPath(
  request: NextRequest,
  path: string,
  limit: number
): Promise<{ ids: string[]; status: number }> {
  const url = new URL(path.startsWith('/') ? path : `/${path}`, AUTH_API_URL);
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: buildAuthHeaders(request),
    cache: 'no-store',
    next: { revalidate: 0 },
  });

  const json = await res.json().catch(() => null);
  return { ids: extractUserIds(json), status: res.status };
}

export async function GET(request: NextRequest) {
  if (!AUTH_API_URL) {
    return NextResponse.json([], { status: 503 });
  }

  const rawLimit = Number.parseInt(request.nextUrl.searchParams.get('limit') ?? '20', 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20;

  try {
    const fromUsers = await fetchUserIdsFromPath(request, GAME_USERS_API_PATH, limit);

    if (fromUsers.ids.length > 0) {
      return NextResponse.json(fromUsers.ids, {
        status: fromUsers.status >= 200 && fromUsers.status < 300 ? 200 : fromUsers.status,
      });
    }

    const fromMe = await fetchUserIdsFromPath(request, AUTH_ME_PATH, 1);
    return NextResponse.json(fromMe.ids, {
      status: fromMe.status >= 200 && fromMe.status < 300 ? 200 : fromMe.status,
    });
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
