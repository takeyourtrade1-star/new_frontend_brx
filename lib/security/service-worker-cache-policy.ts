export interface RuntimeRequestLike {
  mode?: string;
  destination?: string;
  headers: Headers;
}

/** Personalized Next payloads and every API response are network-only. */
export function mustBypassServiceWorkerCache(input: {
  request: RuntimeRequestLike;
  url: URL;
  sameOrigin: boolean;
}): boolean {
  const { request, url, sameOrigin } = input;
  if (!sameOrigin) return false;
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
