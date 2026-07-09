/** Layout condiviso mascotte Asso e bubble messaggi (angolo basso-destra) */

export const ASSO_LAYOUT = {
  mascotWidth: 96,
  mascotHeight: 128,
  mascotRight: 48,
  mascotBottom: 20,
  /** Barra sticky hub aste (scroll) e fallback generico. */
  mascotBottomSticky: 80,
  bubbleGap: 8,
  /** Allineato al bordo destro — bubble stretta, non invade il centro pagina */
  bubbleRight: 12,
} as const;

/**
 * Bottom CSS per Aiuto sopra il dock offerta asta mobile.
 * Allineato al safe-area del dock + altezza riga (~2.25rem) + gap.
 */
export const ASSO_HELP_BOTTOM_ABOVE_BID_DOCK =
  'calc(env(safe-area-inset-bottom, 0px) + 1rem + 3.5rem)';

export const ASSO_MOBILE_MAX_WIDTH = 639;

/** Evento globale: barre fisse in basso (hub aste, dock offerta, …). */
export type StickyBottomBarDetail = {
  visible: boolean;
  /** `bidDock` = dock offerta dettaglio asta; default = hub / barra scroll. */
  kind?: 'hub' | 'bidDock';
};

export const STICKY_BOTTOM_BAR_EVENT = 'stickyBarVisibilityChange';

export function dispatchStickyBottomBar(detail: StickyBottomBarDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STICKY_BOTTOM_BAR_EVENT, { detail }));
}

/**
 * Evento globale: popup promo nell'angolo di Asso (es. "I Tornei sono arrivati").
 * Finché è visibile, Asso passa in mini e si alza sopra il popup (`height` = altezza
 * misurata del popup, per calcolare il bottom della mascotte).
 */
export type PromoPopupDetail = { visible: boolean; height?: number };

export const PROMO_POPUP_EVENT = 'promoPopupVisibilityChange';

export function dispatchPromoPopup(detail: PromoPopupDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PROMO_POPUP_EVENT, { detail }));
}

export function isAuctionDetailPath(pathname: string | null | undefined): boolean {
  return pathname != null && /^\/aste\/\d+\/?$/.test(pathname);
}

export function isMobileAuctionDockViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 1024;
}

export function isAssoMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= ASSO_MOBILE_MAX_WIDTH;
}

export function getAssoMascotBottom(isStickyBarVisible: boolean): number {
  return isStickyBarVisible ? ASSO_LAYOUT.mascotBottomSticky : ASSO_LAYOUT.mascotBottom;
}

/** Bottom CSS per bubble: subito sopra la carta mascotte */
export function getAssoBubbleBottom(isStickyBarVisible: boolean): number {
  return getAssoMascotBottom(isStickyBarVisible) + ASSO_LAYOUT.mascotHeight + ASSO_LAYOUT.bubbleGap;
}
