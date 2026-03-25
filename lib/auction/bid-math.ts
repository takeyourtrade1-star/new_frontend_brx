/** Arrotondamento importi offerta (mock). */
export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Offerta minima consentita sopra l’ultima offerta corrente:
 * - fino a 100 € inclusi: almeno +1 €;
 * - oltre 100 €: almeno +2,5 % sull’ultima offerta.
 */
export function minNextBidEur(lastBidEur: number): number {
  const last = roundMoney(lastBidEur);
  if (last <= 100) return roundMoney(last + 1);
  return roundMoney(last * 1.025);
}

/** Incremento minimo offerta successiva (mock, card “Oggetti simili” / hub). */
export function nextBidStepEur(currentBidEur: number): number {
  if (currentBidEur < 30) return 2.5;
  if (currentBidEur < 100) return 5;
  if (currentBidEur < 500) return 10;
  return Math.max(25, roundMoney(currentBidEur * 0.02));
}
