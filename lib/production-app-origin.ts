/**
 * Exact public origins served by the production Amplify application.
 *
 * Keep this helper Edge-safe: it is imported by `middleware.ts`, so it must
 * not depend on Node-only modules or request-controlled headers.
 */
export const CANONICAL_PRODUCTION_APP_ORIGIN = 'https://www.ebartex.com';
export const AMPLIFY_PRODUCTION_APP_ORIGIN =
  'https://main.d8ry9s45st8bf.amplifyapp.com';

const APPROVED_PRODUCTION_APP_ORIGINS = Object.freeze([
  CANONICAL_PRODUCTION_APP_ORIGIN,
  AMPLIFY_PRODUCTION_APP_ORIGIN,
] as const);

export interface ProductionAppOrigins {
  /** Origin used to build absolute redirects. */
  canonicalOrigin: string;
  /** Exact origins accepted for browser same-origin checks. */
  sameOriginOrigins: readonly string[];
}

function exactApprovedOrigin(value: string): string | null {
  try {
    // WHATWG URL parsing accepts several non-origin spellings (for example
    // backslashes and empty query markers). Deployment config must instead be
    // an unambiguous HTTPS origin, with only an optional trailing slash.
    if (!/^https:\/\/[^/?#\\]+\/?$/.test(value)) return null;
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      (url.pathname !== '/' && url.pathname !== '') ||
      url.search ||
      url.hash ||
      !APPROVED_PRODUCTION_APP_ORIGINS.includes(
        url.origin as (typeof APPROVED_PRODUCTION_APP_ORIGINS)[number],
      )
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Resolve the production trust boundary without consulting Host, forwarded
 * headers, or the request URL.
 *
 * An absent/blank APP_ORIGIN uses the documented canonical production origin.
 * A non-empty but invalid value is a deployment error and fails closed.
 */
export function resolveProductionAppOrigins(
  configuredValue: string | undefined = process.env.APP_ORIGIN,
): ProductionAppOrigins | null {
  const configured = configuredValue?.trim();
  if (!configured) {
    return {
      canonicalOrigin: CANONICAL_PRODUCTION_APP_ORIGIN,
      sameOriginOrigins: APPROVED_PRODUCTION_APP_ORIGINS,
    };
  }

  const canonicalOrigin = exactApprovedOrigin(configured);
  if (!canonicalOrigin) return null;

  return {
    canonicalOrigin,
    sameOriginOrigins: APPROVED_PRODUCTION_APP_ORIGINS,
  };
}
