const DEFAULT_AVATAR_ORIGIN = 'https://cdn.ebartex.com';

function parseConfiguredOrigins(): ReadonlySet<string> {
  const candidates = [
    DEFAULT_AVATAR_ORIGIN,
    ...(process.env.NEXT_PUBLIC_AVATAR_ALLOWED_ORIGINS ?? '').split(','),
  ];
  const origins = new Set<string>();
  for (const raw of candidates) {
    const value = raw.trim();
    if (!value) continue;
    try {
      const url = new URL(value);
      if (
        url.protocol === 'https:' &&
        !url.username &&
        !url.password &&
        url.pathname === '/' &&
        !url.search &&
        !url.hash &&
        url.origin === value.replace(/\/$/, '')
      ) {
        origins.add(url.origin);
      }
    } catch {
      // Invalid public build configuration is ignored fail-closed.
    }
  }
  return origins;
}

const ALLOWED_AVATAR_ORIGINS = parseConfiguredOrigins();

/** Browser-side defense for legacy profile rows; never dereferences the URL. */
export function safePublicAvatarUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return null;
  if (value !== value.trim() || /[\u0000-\u0020\u007f]/u.test(value)) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.hash ||
      !ALLOWED_AVATAR_ORIGINS.has(url.origin)
    ) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}
