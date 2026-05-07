/** Arrotonda sempre per eccesso allo step 0.5 (es: 14.2 -> 14.5, 14.7 -> 15). */
export function roundUpToHalfStep(value: number): number {
  if (!Number.isFinite(value)) return NaN;
  const normalized = Math.ceil((value - 1e-9) * 2) / 2;
  return Number(normalized.toFixed(2));
}

/** Parser importi utente che accetta notazione italiana con virgola. */
export function parseLocaleMoneyInput(rawInput: string): number {
  const raw = rawInput.trim();
  if (!raw) return NaN;
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
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
