const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

/**
 * Decodifica e ricodifica ogni segmento, rifiutando dot-segment e separatori
 * anche quando sono percent-encoded più volte.
 */
export function normalizeProxyPathSegments(
  pathSegments: readonly string[],
): string | null {
  const normalized: string[] = [];

  for (const rawSegment of pathSegments) {
    let segment = rawSegment;
    let stable = false;

    try {
      for (let pass = 0; pass < 5; pass += 1) {
        const decoded = decodeURIComponent(segment);
        if (decoded === segment) {
          stable = true;
          break;
        }
        segment = decoded;
      }
    } catch {
      return null;
    }

    if (
      !stable ||
      !segment ||
      segment === '.' ||
      segment === '..' ||
      segment.includes('/') ||
      segment.includes('\\') ||
      CONTROL_CHARACTERS.test(segment)
    ) {
      return null;
    }

    normalized.push(encodeURIComponent(segment));
  }

  return normalized.join('/');
}
