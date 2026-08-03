/** Strict normalization for public catalogue identifiers and image URLs. */

const PRODUCT_ID_PATTERN = /^(?:mtg|op|pk|sealed)_[1-9]\d{0,15}$/;
const MAX_IMAGE_URL_BYTES = 2_048;
const encoder = new TextEncoder();

const CARD_IMAGE_ORIGINS = new Set([
  'https://cdn.ebartex.com',
  'https://di0y87a9s8da9.cloudfront.net',
  'https://cards.scryfall.io',
  'https://c1.scryfall.com',
  'https://c2.scryfall.com',
]);

const SET_ICON_ORIGINS = new Set([
  'https://cdn.ebartex.com',
  'https://di0y87a9s8da9.cloudfront.net',
  'https://svgs.scryfall.io',
  'https://c1.scryfall.com',
  'https://c2.scryfall.com',
]);

type PublicImageKind = 'card' | 'set-icon';

function hasUnsafeUrlText(value: string): boolean {
  return (
    encoder.encode(value).byteLength > MAX_IMAGE_URL_BYTES ||
    /[\u0000-\u001f\u007f\\]/.test(value) ||
    /%(?:0[0-9a-f]|1[0-9a-f]|7f|5c)/i.test(value)
  );
}

function allowedOrigins(kind: PublicImageKind): Set<string> {
  return kind === 'set-icon' ? SET_ICON_ORIGINS : CARD_IMAGE_ORIGINS;
}

function configuredCdnOrigin(): string | null {
  const raw = (
    process.env.NEXT_PUBLIC_CDN_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'https://di0y87a9s8da9.cloudfront.net'
      : '')
  ).trim();
  if (!raw || hasUnsafeUrlText(raw)) return null;
  try {
    const url = new URL(raw);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      !CARD_IMAGE_ORIGINS.has(url.origin)
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function safeRelativeImageUrl(raw: string, kind: PublicImageKind): string | null {
  const cdnOrigin = configuredCdnOrigin();
  if (!cdnOrigin || raw.startsWith('//') || raw.includes('?') || raw.includes('#')) return null;
  const path = raw.replace(/^\/?img\//, '').replace(/^\/+/, '');
  if (!path || path.length > 1_900) return null;
  const segments = path.split('/');
  if (
    segments.some((segment) => {
      if (!segment) return true;
      try {
        const decoded = decodeURIComponent(segment);
        return decoded === '.' || decoded === '..' || /[\u0000-\u001f\u007f\\/]/.test(decoded);
      } catch {
        return true;
      }
    })
  ) {
    return null;
  }
  const resolved = new URL(`/${path}`, cdnOrigin);
  return allowedOrigins(kind).has(resolved.origin) ? resolved.toString() : null;
}

export function safePublicImageUrl(
  raw: unknown,
  kind: PublicImageKind = 'card',
): string | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (!value || hasUnsafeUrlText(value)) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    return safeRelativeImageUrl(value, kind);
  }
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      url.hash ||
      !url.pathname.startsWith('/') ||
      !allowedOrigins(kind).has(url.origin)
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeCatalogProductId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  return PRODUCT_ID_PATTERN.test(value) ? value : null;
}

export function buildCatalogIdFilter(raw: unknown): string | null {
  const id = normalizeCatalogProductId(raw);
  return id ? `id = "${id}"` : null;
}

/** Remove tracker/script-controlled image fields before catalogue data reaches the browser. */
export function sanitizeCatalogImageFields<T extends object>(hit: T): T {
  const result: Record<string, unknown> = {
    ...(hit as Record<string, unknown>),
  };
  for (const key of ['image', 'image_path', 'image_uri_small', 'image_uri_normal']) {
    if (key in result) result[key] = safePublicImageUrl(result[key], 'card');
  }
  for (const key of ['set_icon_uri', 'icon_svg_uri']) {
    if (key in result) result[key] = safePublicImageUrl(result[key], 'set-icon');
  }
  return result as T;
}
