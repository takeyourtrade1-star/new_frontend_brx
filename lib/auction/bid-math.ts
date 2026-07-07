/** Arrotonda sempre per eccesso allo step 0.5 (es: 14.2 -> 14.5, 14.7 -> 15). */
export function roundUpToHalfStep(value: number): number {
  if (!Number.isFinite(value)) return NaN;
  const normalized = Math.ceil((value - 1e-9) * 2) / 2;
  return Number(normalized.toFixed(2));
}

/**
 * Parser importi utente che accetta notazione italiana con virgola.
 *
 * Con la virgola non c'è ambiguità: punto = migliaia, virgola = decimali
 * ("1.234,50" → 1234.5). Senza virgola il punto è ambiguo: "10.000" scritto
 * da un utente italiano significa diecimila, non 10 (bug: offerta massima
 * "10.000" piazzata come 10 €). Disambiguazione: se i punti formano gruppi
 * di 3 cifre in stile migliaia IT ("1.000", "12.345.678") vengono rimossi;
 * altrimenti il punto resta decimale ("10.5", "10.50", "0.500" → 0.5).
 */
export function parseLocaleMoneyInput(rawInput: string): number {
  const raw = rawInput.trim();
  if (!raw) return NaN;
  let normalized: string;
  if (raw.includes(',')) {
    normalized = raw.replace(/\./g, '').replace(',', '.');
  } else if (/^[1-9]\d{0,2}(\.\d{3})+$/.test(raw)) {
    // Solo punti in gruppi di 3 (prima cifra ≠ 0): separatore migliaia italiano.
    normalized = raw.replace(/\./g, '');
  } else {
    normalized = raw;
  }
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

/** Arrotondamento UX prezzi aste: sempre per eccesso allo step 0.5. */
export function roundMoney(n: number): number {
  return roundUpToHalfStep(n);
}

/**
 * Offerta minima consentita sopra l’ultima offerta corrente:
 * - fino a 100 € inclusi: almeno +1 €;
 * - oltre 100 €: almeno +2,5 % sull’ultima offerta.
 */
export function minNextBidEur(lastBidEur: number): number {
  const last = roundUpToHalfStep(lastBidEur);
  if (last <= 100) return roundUpToHalfStep(last + 1);
  return roundUpToHalfStep(last * 1.025);
}

/** Incremento minimo offerta successiva (mock, card “Oggetti simili” / hub). */
export function nextBidStepEur(currentBidEur: number): number {
  if (currentBidEur < 30) return 2.5;
  if (currentBidEur < 100) return 5;
  if (currentBidEur < 500) return 10;
  return Math.max(25, roundUpToHalfStep(currentBidEur * 0.02));
}
