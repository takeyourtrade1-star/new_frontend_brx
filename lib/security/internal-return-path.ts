const SENTINEL_ORIGIN = 'https://internal-navigation.invalid';
const MAX_RETURN_PATH_LENGTH = 2_048;

function hasUnsafePathShape(value: string): boolean {
  return (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    /[\u0000-\u001f\u007f]/u.test(value)
  );
}

/** Canonicalize an untrusted navigation target to same-origin pathname+search. */
export function sanitizeInternalReturnPath(value: unknown): string | null {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_RETURN_PATH_LENGTH ||
    value !== value.trim()
  ) {
    return null;
  }

  let decoded = value;
  for (let pass = 0; pass < 3; pass += 1) {
    if (hasUnsafePathShape(decoded)) return null;
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      return null;
    }
  }
  if (hasUnsafePathShape(decoded) || /%[0-9a-f]{2}/iu.test(decoded)) return null;

  try {
    const url = new URL(value, SENTINEL_ORIGIN);
    if (url.origin !== SENTINEL_ORIGIN || url.username || url.password) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}
