import 'server-only';

import { isIP } from 'node:net';

type UpstreamEnvInput = Readonly<Record<string, string | undefined>>;

function isProduction(env?: UpstreamEnvInput): boolean {
  return (env ? env.NODE_ENV : process.env.NODE_ENV) === 'production';
}

function configuredHosts(env?: UpstreamEnvInput): Set<string> {
  const hosts = new Set<string>();
  const configured = env
    ? env.TRUSTED_UPSTREAM_HOSTS
    : process.env.TRUSTED_UPSTREAM_HOSTS;
  for (const raw of (configured || '').split(',')) {
    const host = raw.trim().toLowerCase();
    if (/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*$/.test(host)) {
      hosts.add(host);
    }
  }
  return hosts;
}

function exactHttpsOrigin(raw: string | undefined): string {
  const value = raw?.trim();
  if (!value || value.length > 2_048) return '';
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      url.search ||
      url.hash ||
      (url.pathname !== '/' && url.pathname !== '')
    ) {
      return '';
    }
    return url.origin;
  } catch {
    return '';
  }
}

function configuredExactCompatibilityOrigins(
  configured: readonly (string | undefined)[],
): Set<string> {
  const origins = new Set<string>();
  for (const raw of configured) {
    const origin = exactHttpsOrigin(raw);
    if (origin) origins.add(origin);
  }
  return origins;
}

function isTrustedProductionOrigin(
  url: URL,
  env: UpstreamEnvInput | undefined,
  exactCompatibilityOrigins: readonly (string | undefined)[],
): boolean {
  return (
    configuredHosts(env).has(url.hostname.toLowerCase()) ||
    configuredExactCompatibilityOrigins(exactCompatibilityOrigins).has(url.origin)
  );
}

function isLoopback(hostname: string): boolean {
  if (hostname === 'localhost') return true;
  const version = isIP(hostname);
  if (version === 4) return hostname.startsWith('127.');
  return version === 6 && (hostname === '::1' || hostname === '[::1]');
}

function parseTrustedUrl(
  raw: string,
  env?: UpstreamEnvInput,
  exactCompatibilityOrigins: readonly (string | undefined)[] = [],
): URL | null {
  const value = raw.trim();
  if (!value || value.length > 2_048) return null;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash) return null;
    if (isProduction(env)) {
      if (
        url.protocol !== 'https:' ||
        url.port ||
        !isTrustedProductionOrigin(url, env, exactCompatibilityOrigins)
      ) {
        return null;
      }
    } else if (
      url.protocol !== 'https:' &&
      !(url.protocol === 'http:' && isLoopback(url.hostname))
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

/** Strict service base URL. Paths, credentials, query strings and redirects are forbidden. */
export function trustedServiceOrigin(
  raw: string | undefined,
  env?: UpstreamEnvInput,
  exactCompatibilityOrigins: readonly (string | undefined)[] = [],
): string {
  const url = parseTrustedUrl(raw || '', env, exactCompatibilityOrigins);
  if (!url || (url.pathname !== '/' && url.pathname !== '')) return '';
  return url.origin;
}

/**
 * Service-scoped compatibility wrappers. A legacy public URL can authorize
 * only the service it configured; TRUSTED_UPSTREAM_HOSTS remains the explicit
 * cross-service production allowlist.
 */
export function trustedAuthServiceOrigin(
  raw: string | undefined,
  env?: UpstreamEnvInput,
): string {
  return trustedServiceOrigin(raw, env, [
    env ? env.NEXT_PUBLIC_AUTH_API_URL : process.env.NEXT_PUBLIC_AUTH_API_URL,
  ]);
}

export function trustedAuctionServiceOrigin(
  raw: string | undefined,
  env?: UpstreamEnvInput,
): string {
  return trustedServiceOrigin(raw, env, [
    env ? env.NEXT_PUBLIC_AUCTION_API_URL : process.env.NEXT_PUBLIC_AUCTION_API_URL,
  ]);
}

export function trustedSyncServiceOrigin(
  raw: string | undefined,
  env?: UpstreamEnvInput,
): string {
  return trustedServiceOrigin(raw, env, [
    env ? env.NEXT_PUBLIC_SYNC_API_URL : process.env.NEXT_PUBLIC_SYNC_API_URL,
  ]);
}

export function trustedMarketplaceServiceOrigin(
  raw: string | undefined,
  env?: UpstreamEnvInput,
): string {
  return trustedServiceOrigin(raw, env, [
    env
      ? env.NEXT_PUBLIC_MARKETPLACE_API_URL
      : process.env.NEXT_PUBLIC_MARKETPLACE_API_URL,
  ]);
}

export function trustedMeilisearchServiceOrigin(
  raw: string | undefined,
  env?: UpstreamEnvInput,
): string {
  return trustedServiceOrigin(raw, env, [
    env ? env.NEXT_PUBLIC_MEILISEARCH_URL : process.env.NEXT_PUBLIC_MEILISEARCH_URL,
    env ? env.NEXT_PUBLIC_MEILISEARCH_HOST : process.env.NEXT_PUBLIC_MEILISEARCH_HOST,
  ]);
}

/** Strict, fixed endpoint URL for adapters such as Support report ingestion. */
export function trustedEndpointUrl(
  raw: string | undefined,
  env?: UpstreamEnvInput,
): string {
  const url = parseTrustedUrl(raw || '', env);
  if (!url || !url.pathname.startsWith('/') || url.pathname.includes('/../')) return '';
  return url.toString();
}
