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
  /** Blueprint CardTrader usato per risolvere immagine e metadati della carta. */
  blueprintId: number;
  id: string;
  name: string;
  image: string;
  condition: string;
  /** Prezzo a listino del venditore, in euro (informativo). */
  priceEur: number;
  game: string | null;
}

export interface TradeProposalListing {
  /** Chiave stabile della riga reale (sync item oppure UUID marketplace). */
  id: string;
  source: 'sync' | 'marketplace';
  sellerId: string;
  quantity: number;
}

export interface TradeProposalContext {
  seller: TradeProposalSeller;
  card: TradeProposalCard;
  /** Inserzione reale scelta nella tabella venditori. */
  listing: TradeProposalListing;
  /** 'propose' = proposta normale; 'counter' = controproposta a chi mi ha scritto. */
  mode?: 'propose' | 'counter';
  parentTradeId?: number;
  requestedItems?: Array<{
    source: 'sync' | 'marketplace';
    inventoryItemId?: number;
    marketplaceListingId?: string;
    blueprintId: number;
    quantity: number;
    name?: string;
  }>;
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
    const parsed = JSON.parse(raw) as Partial<TradeProposalContext>;
    if (
      !parsed.seller || typeof parsed.seller.name !== 'string' ||
      !parsed.card || typeof parsed.card.id !== 'string' || typeof parsed.card.name !== 'string' ||
      !parsed.listing || typeof parsed.listing.id !== 'string' ||
      typeof parsed.listing.sellerId !== 'string' || typeof parsed.listing.quantity !== 'number' ||
      (parsed.listing.source !== 'sync' && parsed.listing.source !== 'marketplace')
    ) {
      return null;
    }
    const storedBlueprintId = Number(parsed.card.blueprintId);
    const legacyBlueprintId = Number(parsed.card.id);
    return {
      ...parsed,
      seller: parsed.seller,
      card: {
        ...parsed.card,
        blueprintId: Number.isFinite(storedBlueprintId) && storedBlueprintId > 0
          ? storedBlueprintId
          : Number.isFinite(legacyBlueprintId) && legacyBlueprintId > 0
            ? legacyBlueprintId
            : 0,
      },
      listing: parsed.listing,
    } as TradeProposalContext;
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
