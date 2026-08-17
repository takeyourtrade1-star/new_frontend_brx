/**
 * Distributed fixed-window rate limiter for sensitive BFF routes.
 *
 * A Redis-compatible REST endpoint is preferred in production. The counter and
 * its TTL are updated by one Lua script, so concurrent requests across
 * instances cannot exceed the configured quota through lost updates.
 *
 * Amplify currently has an explicit compatibility mode when *all* Redis
 * settings are absent: a bounded, per-instance in-memory limiter keeps
 * non-sensitive routes available until runtime secret injection is
 * provisioned. Callers can require the distributed store; partial/invalid
 * Redis configuration, untrusted IP, or Redis failure still fails closed.
 */

import { createHash, createHmac } from 'node:crypto';
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
let productionMemoryWarningEmitted = false;

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
  let value = raw.trim();
  const startsQuoted = value.startsWith('"');
  const endsQuoted = value.endsWith('"');
  if (startsQuoted !== endsQuoted) return null;
  if (startsQuoted) value = value.slice(1, -1);

  const validPort = (rawPort: string): boolean => {
    if (!/^\d{1,5}$/.test(rawPort)) return false;
    const port = Number(rawPort);
    return port >= 1 && port <= 65_535;
  };

  if (value.startsWith('[')) {
    const end = value.indexOf(']');
    if (end <= 1) return null;
    const suffix = value.slice(end + 1);
    if (suffix && (!suffix.startsWith(':') || !validPort(suffix.slice(1)))) return null;
    value = value.slice(1, end);
  } else {
    const ipv4WithPort = value.match(/^(\d{1,3}(?:\.\d{1,3}){3}):(\d{1,5})$/);
    if (ipv4WithPort) {
      if (!validPort(ipv4WithPort[2])) return null;
      value = ipv4WithPort[1];
    }
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
  // CloudFront appends the viewer address to X-Forwarded-For. At the Amplify
  // boundary the rightmost value is therefore the non-client-controlled one.
  if (!raw) return 1;
  if (!/^[1-9]\d?$/.test(raw)) return null;
  const parsed = Number(raw);
  return parsed <= 10 ? parsed : null;
}

/**
 * Returns an address only from infrastructure headers explicitly trusted by
 * configuration. Amplify/CloudFront defaults to the validated rightmost
 * X-Forwarded-For address; an explicitly configured single-value header or
 * proxy-hop count overrides that platform default.
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
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  const hasDedicatedConfig = Boolean(dedicatedUrl || dedicatedToken);
  const hasUpstashConfig = Boolean(upstashUrl || upstashToken);

  if (hasDedicatedConfig && (!dedicatedUrl || !dedicatedToken)) {
    throw new Error('Incomplete dedicated Redis REST configuration');
  }
  if (hasUpstashConfig && (!upstashUrl || !upstashToken)) {
    throw new Error('Incomplete Upstash Redis REST configuration');
  }
  if (!hasDedicatedConfig && !hasUpstashConfig) return null;

  // Dedicated settings win only after both pairs have been checked for
  // completeness; a stray partial fallback pair is still a deployment error.
  const url = dedicatedUrl || upstashUrl;
  const token = dedicatedToken || upstashToken;
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
  const configuredHosts = new Set<string>();
  for (const configuredHost of (process.env.RATE_LIMIT_REDIS_ALLOWED_HOSTS || '').split(',')) {
    const host = configuredHost.trim().toLowerCase();
    if (!host) continue;
    if (
      !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*$/.test(host)
    ) {
      throw new Error('Invalid Redis REST allowed hostname');
    }
    configuredHosts.add(host);
  }
  const redisHost = parsedUrl.hostname.toLowerCase();
  const isUpstashHost = redisHost !== 'upstash.io' && redisHost.endsWith('.upstash.io');
  if (!localFallbackAllowed() && !isUpstashHost && !configuredHosts.has(redisHost)) {
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
  // The compatibility store never exports keys outside this process. A
  // one-way digest avoids retaining raw IPs without requiring a deploy secret.
  const digest = createHash('sha256').update(`ip\0${ip}`).digest('base64url');
  return `memory:${scope}:${digest}`;
}

function warnProductionMemoryFallbackOnce(): void {
  if (productionMemoryWarningEmitted) return;
  productionMemoryWarningEmitted = true;
  // Deliberately static: never include IPs, URLs, tokens, keys, or request data.
  console.warn(
    '[rate-limit] Redis non configurato: fallback temporaneo per-instance attivo.',
  );
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
  /**
   * Le mutazioni di autenticazione sensibili non possono usare il fallback
   * per-process in produzione. Dev/test conservano invece il limiter locale.
   */
  requireDistributedStore?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
  unavailable?: boolean;
}

/**
 * Atomically consumes one request from the distributed bucket. When all Redis
 * variables are absent, production uses the documented bounded compatibility
 * store. Sensitive callers, partial/invalid configuration, untrusted IPs,
 * timeouts, and malformed backend responses all fail closed.
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
      if (!localFallbackAllowed()) warnProductionMemoryFallbackOnce();
      return checkMemoryRateLimit(ip, options);
    }

    return await checkRedisRateLimit(config, ip, options);
  } catch {
    return unavailableResult(options);
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
