/**
 * Valori mock deterministici per le carte usate nel tavolo di scambio.
 *
 * La feature scambi è interamente mockata (vedi mock-trade-inventories.ts):
 * non esiste un prezzo "tradeable" per le carte in inventario, quindi
 * assegniamo un valore stabile a partire da un seed (id o nome carta).
 * Stesso seed ⇒ stesso valore, così la regola di equità resta coerente
 * tra render e navigazioni.
 */

/** Hash stabile stile ModernSellerTable.hashSellerId. */
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const MIN_VALUE = 5;
const MAX_VALUE = 300;

/** Valore mock in euro, deterministico nel range [MIN_VALUE, MAX_VALUE]. */
export function getMockCardValueEur(seed: string): number {
  const span = MAX_VALUE - MIN_VALUE;
  const value = MIN_VALUE + (hashSeed(seed) % (span + 1));
  return value;
}

export interface TradeBalanceInput {
  offeredValue: number;
  requestedValue: number;
  /** Venditore professionale (account business) ⇒ soglia più ampia. */
  isPro: boolean;
}

export interface TradeBalanceResult {
  balanced: boolean;
  /** Scarto relativo (0–1) tra i due lati. */
  diffPct: number;
  /** Soglia massima ammessa (0.15 pro, 0.10 privati). */
  threshold: number;
}

/**
 * Regola di equità: il valore offerto e quello richiesto non devono
 * differire più del 15% (venditori professionali) o del 10% (privati).
 */
export function tradeBalance({ offeredValue, requestedValue, isPro }: TradeBalanceInput): TradeBalanceResult {
  const threshold = isPro ? 0.15 : 0.1;
  if (offeredValue <= 0 || requestedValue <= 0) {
    return { balanced: false, diffPct: 1, threshold };
  }
  const diffPct = Math.abs(offeredValue - requestedValue) / Math.max(offeredValue, requestedValue);
  return { balanced: diffPct <= threshold, diffPct, threshold };
}
