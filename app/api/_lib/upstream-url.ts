import 'server-only';

import { isIP } from 'node:net';

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function configuredHosts(): Set<string> {
  const hosts = new Set<string>();
  for (const raw of (process.env.TRUSTED_UPSTREAM_HOSTS || '').split(',')) {
    const host = raw.trim().toLowerCase();
    if (/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*$/.test(host)) {
      hosts.add(host);
    }
  }
  return hosts;
}

function isTrustedProductionHost(hostname: string): boolean {
  return configuredHosts().has(hostname.toLowerCase());
}

function isLoopback(hostname: string): boolean {
  if (hostname === 'localhost') return true;
  const version = isIP(hostname);
  if (version === 4) return hostname.startsWith('127.');
  return version === 6 && (hostname === '::1' || hostname === '[::1]');
}

function parseTrustedUrl(raw: string): URL | null {
  const value = raw.trim();
  if (!value || value.length > 2_048) return null;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash) return null;
    if (isProduction()) {
      if (url.protocol !== 'https:' || url.port || !isTrustedProductionHost(url.hostname)) {
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
export function trustedServiceOrigin(raw: string | undefined): string {
  const url = parseTrustedUrl(raw || '');
  if (!url || (url.pathname !== '/' && url.pathname !== '')) return '';
  return url.origin;
}

/** Strict, fixed endpoint URL for adapters such as Support report ingestion. */
export function trustedEndpointUrl(raw: string | undefined): string {
  const url = parseTrustedUrl(raw || '');
  if (!url || !url.pathname.startsWith('/') || url.pathname.includes('/../')) return '';
  return url.toString();
}
