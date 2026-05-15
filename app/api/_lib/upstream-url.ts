export class InvalidUpstreamPathError extends Error {
  constructor(segment: string) {
    super(`Invalid upstream path segment: ${segment}`);
    this.name = 'InvalidUpstreamPathError';
  }
}

function decodeForValidation(segment: string): string {
  let decoded = segment;
  for (let i = 0; i < 3; i += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

function assertSafeSegment(segment: string) {
  const decoded = decodeForValidation(segment).replace(/\\/g, '/');
  const parts = decoded.split('/');
  if (!segment || parts.some((part) => part === '.' || part === '..')) {
    throw new InvalidUpstreamPathError(segment);
  }
}

export function createUpstreamUrl(
  baseUrl: string,
  basePath: string,
  pathSegments: readonly string[],
  searchParams?: URLSearchParams
): URL {
  const normalizedBasePath = `/${basePath}`.replace(/^\/+/, '/').replace(/\/+$/, '');
  const encodedSegments = pathSegments.map((segment) => {
    assertSafeSegment(segment);
    return encodeURIComponent(segment);
  });
  const targetPath = [normalizedBasePath, ...encodedSegments].join('/');
  const url = new URL(targetPath, baseUrl);

  searchParams?.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  return url;
}
