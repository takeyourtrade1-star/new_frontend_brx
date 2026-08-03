export interface RuntimeRequestLike {
  mode?: string;
  destination?: string;
  headers: Headers;
}

export type PrecacheEntryLike = string | { url: string };

function isBuildInfoUrl(rawUrl: string): boolean {
  try {
    return new URL(rawUrl, 'https://service-worker.invalid').pathname === '/build-info.json';
  } catch {
    return false;
  }
}

/** Build metadata must remain mutable so an open tab can observe each deploy. */
export function excludeBuildInfoFromPrecache<T extends PrecacheEntryLike>(
  entries: readonly T[] | undefined,
): T[] | undefined {
  return entries?.filter((entry) =>
    !isBuildInfoUrl(typeof entry === 'string' ? entry : entry.url),
  );
}

/** Personalized Next payloads and every API response are network-only. */
export function mustBypassServiceWorkerCache(input: {
  request: RuntimeRequestLike;
  url: URL;
  sameOrigin: boolean;
}): boolean {
  const { request, url, sameOrigin } = input;
  if (!sameOrigin) return false;
  if (url.pathname === '/build-info.json') return true;
  if (url.pathname.startsWith('/api/')) return true;
  return (
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    url.pathname.startsWith('/_next/data/') ||
    request.headers.get('rsc') === '1' ||
    request.headers.has('next-router-prefetch') ||
    request.headers.get('purpose')?.toLowerCase() === 'prefetch'
  );
}

/** Cache buckets used by earlier Serwist/next-pwa defaults for private data. */
export function isLegacyPrivateRuntimeCache(cacheName: string): boolean {
  const normalized = cacheName.toLowerCase();
  return ['pages', 'next-data', 'apis', 'others'].some(
    (bucket) =>
      normalized === bucket ||
      normalized.startsWith(`${bucket}-`) ||
      normalized.endsWith(`-${bucket}`) ||
      normalized.includes(`-${bucket}-`),
  );
}
