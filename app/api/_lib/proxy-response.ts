/**
 * Header di risposta uniformi per i proxy BFF.
 *
 * Regola del progetto: i dati privati non vanno mai in cache (browser, CDN,
 * Next data cache); le risposte pubbliche idempotenti (GET di catalogo) possono
 * usare una cache breve e revalidabile. Centralizzare qui evita che un proxy
 * dimentichi l'header e lasci trapelare dati privati in cache condivise.
 */

import { NextResponse } from 'next/server';

/** Da usare su qualunque risposta che contenga dati privati/per-utente. */
export function noStoreHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
  return headers;
}

/** Da usare solo su GET pubblici e idempotenti (es. listings/public/*). */
export function publicCacheHeaders(maxAgeSec = 30, staleWhileRevalidateSec = 60): Headers {
  const headers = new Headers();
  headers.set(
    'Cache-Control',
    `public, s-maxage=${maxAgeSec}, stale-while-revalidate=${staleWhileRevalidateSec}`,
  );
  return headers;
}

/**
 * 401 uniforme per route private senza Authorization valido. "Fail closed":
 * nessun dato del backend viene inoltrato, il body non rivela dettagli interni.
 */
export function unauthorizedResponse(message = 'Autenticazione richiesta'): NextResponse {
  return NextResponse.json(
    { detail: message },
    { status: 401, headers: noStoreHeaders() },
  );
}

/** 403 uniforme per route private con sessione valida ma priva dei permessi. */
export function forbiddenResponse(message = 'Permessi insufficienti'): NextResponse {
  return NextResponse.json(
    { detail: message },
    { status: 403, headers: noStoreHeaders() },
  );
}

/** Convert an upstream failure to a stable public error without forwarding its body. */
export function redactedUpstreamErrorResponse(
  upstreamStatus: number,
  fallbackMessage = 'Operazione non riuscita',
): NextResponse {
  const status = upstreamStatus >= 500 ? 502 : upstreamStatus;
  const detail =
    upstreamStatus === 401
      ? 'Autenticazione richiesta'
      : upstreamStatus === 403
        ? 'Permessi insufficienti'
        : upstreamStatus === 404
          ? 'Risorsa non trovata'
          : upstreamStatus === 409
            ? 'Operazione in conflitto'
            : upstreamStatus === 422
              ? 'Dati richiesta non validi'
              : upstreamStatus === 429
                ? 'Troppe richieste'
                : fallbackMessage;
  return NextResponse.json({ detail }, { status, headers: noStoreHeaders() });
}
