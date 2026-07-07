/**
 * Orologio sincronizzato col server per i countdown (aste, listing).
 *
 * I countdown confrontano timestamp del server (es. `end_time` di un'asta) con
 * l'orologio del dispositivo: se l'utente ha l'ora sbagliata di qualche minuto,
 * il countdown è sbagliato della stessa quantità. Qui stimiamo lo scarto
 * client↔server una volta per sessione leggendo l'header `Date` di una
 * richiesta HEAD same-origin leggera, e `serverNowMs()` lo applica.
 *
 * Note:
 * - L'header `Date` ha granularità 1s: sotto {@link MIN_OFFSET_MS} lo scarto
 *   viene ignorato (orologio già corretto, evitiamo jitter).
 * - In caso di errore di rete l'offset resta 0 → comportamento identico a prima.
 */

let offsetMs = 0;
let calibrationStarted = false;

/** Scarto minimo (ms) per applicare la correzione: sotto è rumore dell'header Date. */
const MIN_OFFSET_MS = 3_000;

/** Ora corrente stimata del server (Date.now() + offset calibrato). */
export function serverNowMs(): number {
  return Date.now() + offsetMs;
}

/** Solo per test. */
export function __resetServerClockForTests(): void {
  offsetMs = 0;
  calibrationStarted = false;
}

/**
 * Calibra l'offset una sola volta per sessione (idempotente, fire-and-forget).
 * Da chiamare da chi consuma `serverNowMs()`: al primo uso parte la stima e i
 * tick successivi la applicano automaticamente.
 */
export function calibrateServerClock(): void {
  if (typeof window === 'undefined' || calibrationStarted) return;
  calibrationStarted = true;

  void (async () => {
    try {
      const t0 = Date.now();
      // HEAD su asset statico: risposta minima con header Date, niente SSR.
      const res = await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' });
      const t1 = Date.now();
      const dateHeader = res.headers.get('date');
      if (!dateHeader) return;
      const serverAtResponse = Date.parse(dateHeader);
      if (!Number.isFinite(serverAtResponse)) return;
      // L'header Date è stato generato ~a metà del round-trip.
      const estimated = serverAtResponse + (t1 - t0) / 2 - t1;
      if (Math.abs(estimated) >= MIN_OFFSET_MS) {
        offsetMs = estimated;
      }
    } catch {
      // Rete assente: offset resta 0, countdown come prima.
    }
  })();
}
