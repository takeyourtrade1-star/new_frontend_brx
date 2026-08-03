/**
 * Distributed fixed-window rate limiter for sensitive BFF routes.
 *
 * Production is fail-closed and requires a Redis-compatible REST endpoint. The
 * counter and its TTL are updated by one Lua script, so concurrent requests
 * across instances cannot exceed the configured quota through lost updates.
 * Development and tests intentionally keep a bounded in-memory fallback.
 */

import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { NextRequest, NextResponse } from 'next/server';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';

interface Bucket {
  count: number;
  resetAt: number;
}

interface RedisRestConfig {
  keyPrefix: string;
  keySecret: string;
  timeoutMs: number;
  token: string;
  url: string;
}

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 5000;
const DEFAULT_REDIS_TIMEOUT_MS = 1_500;
const BACKEND_RETRY_AFTER_SEC = 5;
const MAX_WINDOW_MS = 24 * 60 * 60_000;

/**
 * INCR and PEXPIRE must be one atomic operation. The PTTL repair also prevents
 * a stale/corrupt counter without expiry from becoming permanent.
 */
const INCREMENT_WITH_TTL_SCRIPT = [
  "local current = redis.call('INCR', KEYS[1])",
  "local ttl = redis.call('PTTL', KEYS[1])",
  'if current == 1 or ttl < 0 then',
  "  redis.call('PEXPIRE', KEYS[1], ARGV[1])",
  '  ttl = tonumber(ARGV[1])',
  'end',
  'return {current, ttl}',
].join('\n');

function localFallbackAllowed(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
}

function normalizeIp(raw: string | undefined): string | null {
  if (!raw) return null;
  let value = raw.trim().replace(/^"|"$/g, '');
  if (value.startsWith('[')) {
    const end = value.indexOf(']');
    if (end > 1) value = value.slice(1, end);
  } else if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(value)) {
    value = value.slice(0, value.lastIndexOf(':'));
  }
  if (value.length > 64) return null;
  const version = isIP(value);
  if (version === 4) return value;
  if (version === 6) {
    try {
      // WHATWG URL parsing applies RFC 5952-style zero compression and also
      // canonicalizes IPv4-mapped IPv6, preventing duplicate Redis/upstream
      // buckets for equivalent textual addresses.
      const hostname = new URL(`http://[${value}]/`).hostname;
      return hostname.slice(1, -1).toLowerCase();
    } catch {
      return null;
    }
  }
  return null;
}

function trustedProxyHops(): number | null {
  const raw = process.env.TRUSTED_PROXY_HOPS?.trim();
  if (!raw) return localFallbackAllowed() ? 1 : null;
  if (!/^[1-9]\d?$/.test(raw)) return null;
  const parsed = Number(raw);
  return parsed <= 10 ? parsed : null;
}

/**
 * Returns an address only from infrastructure headers explicitly trusted by
 * configuration. Production must configure TRUSTED_CLIENT_IP_HEADER or
 * TRUSTED_PROXY_HOPS; arbitrary client-provided forwarding headers are never
 * used as a fallback.
 */
export function getRateLimitClientIp(request: NextRequest): string {
  const configuredHeader = process.env.TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase();
  const trustedHeaders = new Set([
    'cloudfront-viewer-address',
    'cf-connecting-ip',
    'x-vercel-forwarded-for',
  ]);

  if (configuredHeader) {
    if (!trustedHeaders.has(configuredHeader)) return 'unknown';
    return normalizeIp(request.headers.get(configuredHeader) ?? undefined) ?? 'unknown';
  }

  const proxyHops = trustedProxyHops();
  if (proxyHops === null) return 'unknown';
  const chain = request.headers
    .get('x-forwarded-for')
    ?.split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (!chain || chain.length < proxyHops) return 'unknown';
  return normalizeIp(chain[chain.length - proxyHops]) ?? 'unknown';
}

function evictIfNeeded(): void {
  if (buckets.size < MAX_TRACKED_KEYS) return;
  const oldestKey = buckets.keys().next().value;
  if (oldestKey !== undefined) buckets.delete(oldestKey);
}

function parseBoundedInteger(raw: string | undefined, fallback: number, min: number, max: number): number {
  if (!raw) return fallback;
  if (!/^\d+$/.test(raw.trim())) throw new Error('Invalid integer configuration');
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new Error('Integer configuration outside allowed range');
  }
  return parsed;
}

function redisRestConfig(): RedisRestConfig | null {
  const dedicatedUrl = process.env.RATE_LIMIT_REDIS_REST_URL?.trim();
  const dedicatedToken = process.env.RATE_LIMIT_REDIS_REST_TOKEN?.trim();
  const usesDedicatedConfig = Boolean(dedicatedUrl || dedicatedToken);
  const url = usesDedicatedConfig
    ? dedicatedUrl
    : process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = usesDedicatedConfig
    ? dedicatedToken
    : process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url && !token) return null;
  if (!url || !token) throw new Error('Incomplete Redis REST configuration');

  const parsedUrl = new URL(url);
  if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
    throw new Error('Redis REST endpoint must use HTTP(S)');
  }
  if (!localFallbackAllowed() && parsedUrl.protocol !== 'https:') {
    throw new Error('Redis REST endpoint must use TLS in production');
  }
  if (parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash) {
    throw new Error('Redis REST URL must not contain credentials, query, or fragment');
  }
  if (parsedUrl.pathname !== '/' || (!localFallbackAllowed() && parsedUrl.port)) {
    throw new Error('Redis REST URL must be a bare standard-port origin');
  }
  const configuredHosts = new Set(
    (process.env.RATE_LIMIT_REDIS_ALLOWED_HOSTS || '')
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter((host) =>
        /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*$/.test(host),
      ),
  );
  const redisHost = parsedUrl.hostname.toLowerCase();
  if (!localFallbackAllowed() && !configuredHosts.has(redisHost)) {
    throw new Error('Redis REST hostname is not trusted');
  }
  if (!localFallbackAllowed() && (Buffer.byteLength(token, 'utf8') < 32 || token.length > 4096)) {
    throw new Error('Redis REST token must contain 32..4096 bytes');
  }

  const keySecret = process.env.RATE_LIMIT_KEY_SECRET?.trim();
  if (!localFallbackAllowed() && (!keySecret || Buffer.byteLength(keySecret, 'utf8') < 32)) {
    throw new Error('RATE_LIMIT_KEY_SECRET must contain at least 32 bytes');
  }

  const keyPrefix = process.env.RATE_LIMIT_REDIS_PREFIX?.trim() || 'brx:bff:rl:v1';
  if (!/^[a-z0-9][a-z0-9:_-]{0,63}$/i.test(keyPrefix)) {
    throw new Error('Invalid Redis key prefix');
  }

  return {
    keyPrefix,
    keySecret: keySecret || 'development-only-rate-limit-key-secret',
    timeoutMs: parseBoundedInteger(
      process.env.RATE_LIMIT_REDIS_TIMEOUT_MS,
      DEFAULT_REDIS_TIMEOUT_MS,
      100,
      5_000,
    ),
    token,
    url: parsedUrl.origin,
  };
}

function validateOptions(options: RateLimitOptions): void {
  if (!/^[a-z0-9][a-z0-9:/_-]{0,63}$/i.test(options.scope)) {
    throw new Error('Invalid rate-limit scope');
  }
  if (!Number.isSafeInteger(options.limit) || options.limit < 1 || options.limit > 1_000_000) {
    throw new Error('Invalid rate-limit quota');
  }
  if (
    !Number.isSafeInteger(options.windowMs)
    || options.windowMs < 1_000
    || options.windowMs > MAX_WINDOW_MS
  ) {
    throw new Error('Invalid rate-limit window');
  }
}

function privateRateKey(config: RedisRestConfig, scope: string, ip: string): string {
  const digest = createHmac('sha256', config.keySecret)
    .update(`ip\0${ip}`)
    .digest('base64url');
  return `${config.keyPrefix}:${scope}:${digest}`;
}

function memoryRateKey(scope: string, ip: string): string {
  const secret = process.env.RATE_LIMIT_KEY_SECRET || 'development-only-rate-limit-key-secret';
  const digest = createHmac('sha256', secret).update(`ip\0${ip}`).digest('base64url');
  return `memory:${scope}:${digest}`;
}

function checkMemoryRateLimit(ip: string, options: RateLimitOptions): RateLimitResult {
  const key = memoryRateKey(options.scope, ip);
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + options.windowMs };
    evictIfNeeded();
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  return resultFromCounter(bucket.count, bucket.resetAt - now, options.limit);
}

function resultFromCounter(count: number, ttlMs: number, limit: number): RateLimitResult {
  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    retryAfterSec: Math.max(1, Math.ceil(ttlMs / 1_000)),
  };
}

function unavailableResult(options: RateLimitOptions): RateLimitResult {
  return {
    allowed: false,
    limit: options.limit,
    remaining: 0,
    retryAfterSec: BACKEND_RETRY_AFTER_SEC,
    unavailable: true,
  };
}

async function checkRedisRateLimit(
  config: RedisRestConfig,
  ip: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const key = privateRateKey(config, options.scope, ip);
  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Accept-Encoding': 'identity',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['EVAL', INCREMENT_WITH_TTL_SCRIPT, 1, key, options.windowMs]),
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(config.timeoutMs),
  });

  if (!response.ok) throw new Error('Redis REST request failed');
  const payload = (await readJsonResponseWithLimit(response, 64 * 1_024)) as {
    error?: unknown;
    result?: unknown;
  };
  if (payload.error || !Array.isArray(payload.result) || payload.result.length !== 2) {
    throw new Error('Invalid Redis REST response');
  }

  const count = Number(payload.result[0]);
  const ttlMs = Number(payload.result[1]);
  if (
    !Number.isSafeInteger(count)
    || count < 1
    || !Number.isSafeInteger(ttlMs)
    || ttlMs < 1
  ) {
    throw new Error('Invalid Redis counter or TTL');
  }

  return resultFromCounter(count, Math.min(ttlMs, options.windowMs), options.limit);
}

export interface RateLimitOptions {
  /** Numero massimo di richieste consentite nella finestra. */
  limit: number;
  /** Durata della finestra in millisecondi. */
  windowMs: number;
  /**
   * Kept for call-site compatibility but deliberately not used in the key:
   * current BFF callers derive it from an unverified JWT payload. Using it
   * would let a client rotate `sub` values to bypass the IP quota.
   */
  userId?: string | number | null;
  /** Prefisso non sensibile per separare i bucket delle diverse route. */
  scope: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
  unavailable?: boolean;
}

/**
 * Atomically consumes one request from the distributed bucket. Production
 * never falls back to process memory: missing/invalid config, untrusted IPs,
 * timeouts and malformed backend responses all fail closed.
 */
export async function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  try {
    validateOptions(options);
    const ip = getRateLimitClientIp(request);
    if (!localFallbackAllowed() && ip === 'unknown') return unavailableResult(options);

    const config = redisRestConfig();
    if (!config) {
      return localFallbackAllowed()
        ? checkMemoryRateLimit(ip, options)
        : unavailableResult(options);
    }

    return await checkRedisRateLimit(config, ip, options);
  } catch {
    if (!localFallbackAllowed()) return unavailableResult(options);
    try {
      validateOptions(options);
      return checkMemoryRateLimit(getRateLimitClientIp(request), options);
    } catch {
      return unavailableResult(options);
    }
  }
}

/** Uniform 429/503 response without backend details or sensitive identifiers. */
export function rateLimitExceededResponse(result: RateLimitResult): NextResponse {
  const unavailable = result.unavailable === true;
  return NextResponse.json(
    {
      detail: unavailable
        ? 'Servizio di rate limiting temporaneamente non disponibile.'
        : 'Troppe richieste. Riprova tra qualche secondo.',
    },
    {
      status: unavailable ? 503 : 429,
      headers: {
        'Retry-After': String(result.retryAfterSec),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
      },
    },
  );
}
