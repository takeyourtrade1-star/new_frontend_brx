/**
 * Converts an untrusted buy-now value into a clickable absolute HTTP(S) URL.
 * The backend enforces the same policy; this remains the final render-boundary
 * safeguard for legacy rows and malformed upstream responses.
 */
export function getSafeBuyNowUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
