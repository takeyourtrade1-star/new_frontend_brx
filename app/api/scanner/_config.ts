import { isIP } from 'node:net';

export type ScannerBudgetMode = 'edge_primary' | 'server_fallback_limited' | 'edge_only';

const DEVELOPMENT_BRX_MATCH_URL = 'http://127.0.0.1:8005';
/** Hard browser/BFF allocation ceiling; the manifest size must match exactly. */
export const MAX_EDGE_MODEL_BYTES = 128 * 1024 * 1024;

/**
 * Il client interrompe ogni richiesta di riconoscimento dopo 3,2 secondi.
 * Il BFF deve terminare prima per avere il tempo di restituire un 504 utile
 * invece di continuare a consumare compute dopo che il browser ha rinunciato.
 */
export const SCANNER_TIMEOUTS = {
  clientRequestMs: 3_200,
  recognitionUpstreamMs: 2_800,
  modelUpstreamMs: 60_000,
} as const;

function isPrivateIpv4(hostname: string): boolean {
  if (isIP(hostname) !== 4) return false;
  const octets = hostname.split('.').map(Number);
  return (
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  );
}

function configuredPrivateHost(): string {
  const host = (process.env.BRX_MATCH_PRIVATE_HOST || '').trim().toLowerCase();
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*$/.test(host)
    ? host
    : '';
}

function trustedProductionOrigins(): ReadonlySet<string> {
  const origins = new Set<string>();
  for (const raw of (process.env.BRX_MATCH_TRUSTED_ORIGINS || '').split(',')) {
    const value = raw.trim();
    if (!value) continue;
    try {
      const url = new URL(value);
      if (
        (url.protocol === 'https:' || url.protocol === 'http:') &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash &&
        url.pathname === '/' &&
        url.origin === value.replace(/\/$/, '')
      ) {
        origins.add(url.origin);
      }
    } catch {
      // Invalid entries are ignored fail-closed.
    }
  }
  return origins;
}

function isExplicitPrivateHttpTarget(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return isPrivateIpv4(host) || host === configuredPrivateHost();
}

export function getBrxMatchBaseUrl(): string {
  const configured = process.env.BRX_MATCH_API_URL || '';
  const value = configured || (process.env.NODE_ENV === 'development' ? DEVELOPMENT_BRX_MATCH_URL : '');
  if (!value) return '';
  try {
    const url = new URL(value);
    if (
      (url.protocol !== 'https:' && url.protocol !== 'http:') ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      (url.pathname !== '/' && url.pathname !== '')
    ) {
      return '';
    }
    if (
      process.env.NODE_ENV === 'production' &&
      !trustedProductionOrigins().has(url.origin)
    ) {
      return '';
    }
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
      if (
        process.env.BRX_MATCH_ALLOW_PRIVATE_HTTP !== 'true' ||
        !isExplicitPrivateHttpTarget(url.hostname)
      ) {
        return '';
      }
    }
    return url.origin;
  } catch {
    return '';
  }
}

/** Dedicated service-to-service credential; never expose it as NEXT_PUBLIC_*. */
export function getBrxMatchServiceToken(): string {
  return (process.env.BRX_MATCH_SERVICE_TOKEN || '').trim();
}

export function getScannerBudgetMode(): ScannerBudgetMode {
  const value = process.env.SCANNER_BUDGET_MODE;
  if (value === 'edge_primary' || value === 'edge_only') return value;
  return 'server_fallback_limited';
}

export function isScannerEdgeEnabled(): boolean {
  const bytes = getScannerEdgeModelBytes();
  const productionDigestReady =
    process.env.NODE_ENV !== 'production' || Boolean(getScannerEdgeModelSha256());
  return (
    process.env.SCANNER_EDGE_ENABLED === 'true' &&
    bytes > 0 &&
    bytes <= MAX_EDGE_MODEL_BYTES &&
    productionDigestReady
  );
}

export function getScannerEdgeModelBytes(): number {
  const bytes = Number(process.env.SCANNER_EDGE_MODEL_BYTES);
  return Number.isFinite(bytes) && bytes > 0 ? Math.floor(bytes) : 0;
}

/** Immutable build/deploy pin for the exact browser-executed ONNX artifact. */
export function getScannerEdgeModelSha256(): string {
  const digest = (process.env.SCANNER_EDGE_MODEL_SHA256 || '').trim();
  return /^[0-9a-f]{64}$/.test(digest) ? digest : '';
}

export const SCANNER_LIMITS = {
  requestsPerMinute: 45,
  maxVectorBytes: 32 * 1024,
  maxVerifyBytes: 512 * 1024,
  maxScanBytes: 1024 * 1024,
} as const;
