/**
 * Contesto della proposta di scambio passato dalla lista venditori
 * (pagina prodotto) alla nuova pagina /scambi/proponi.
 *
 * Usiamo sessionStorage invece di query string per evitare URL enormi
 * (le immagini carta sono URL lunghi) e per portare un oggetto strutturato.
 */

export interface TradeProposalSeller {
  name: string;
  /** Venditore professionale (account business). */
  isPro: boolean;
  country: string | null;
}

export interface TradeProposalCard {
  id: string;
  name: string;
  image: string;
  condition: string;
  /** Prezzo a listino del venditore, in euro (informativo). */
  priceEur: number;
  game: string | null;
}

export interface TradeProposalContext {
  seller: TradeProposalSeller;
  card: TradeProposalCard;
  /** 'propose' = proposta normale; 'counter' = controproposta a chi mi ha scritto. */
  mode?: 'propose' | 'counter';
}

const STORAGE_KEY = 'ebartex_trade_proposal_ctx';

export function setTradeProposalContext(ctx: TradeProposalContext): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
  } catch {
    /* sessionStorage non disponibile: ignora */
  }
}

export function getTradeProposalContext(): TradeProposalContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TradeProposalContext;
  } catch {
    return null;
  }
}

export function clearTradeProposalContext(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignora */
  }
}
