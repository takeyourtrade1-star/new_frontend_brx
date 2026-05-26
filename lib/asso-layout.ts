/** Layout condiviso mascotte Asso e bubble messaggi (angolo basso-destra) */

export const ASSO_LAYOUT = {
  mascotWidth: 96,
  mascotHeight: 128,
  mascotRight: 48,
  mascotBottom: 20,
  mascotBottomSticky: 80,
  bubbleGap: 8,
  bubbleMaxWidth: 220,
  /** Allineato al bordo destro — bubble stretta, non invade il centro pagina */
  bubbleRight: 12,
  collapsedTabWidth: 32,
} as const;

export const ASSO_COLLAPSED_STORAGE_KEY = 'brx_asso_collapsed';

/** Stesso breakpoint usato da CardMascotte per `isMobileView`. */
export const ASSO_MOBILE_MAX_WIDTH = 639;

export function isAssoMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= ASSO_MOBILE_MAX_WIDTH;
}

/**
 * Preferenza collapse: localStorage se presente, altrimenti chiuso su mobile e aperto su desktop.
 */
export function getInitialAssoCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(ASSO_COLLAPSED_STORAGE_KEY);
    if (stored === '1') return true;
    if (stored === '0') return false;
  } catch {
    /* ignore */
  }
  return isAssoMobileViewport();
}

export function getAssoMascotBottom(isStickyBarVisible: boolean): number {
  return isStickyBarVisible ? ASSO_LAYOUT.mascotBottomSticky : ASSO_LAYOUT.mascotBottom;
}

/** Bottom CSS per bubble: subito sopra la carta mascotte */
export function getAssoBubbleBottom(isStickyBarVisible: boolean): number {
  return getAssoMascotBottom(isStickyBarVisible) + ASSO_LAYOUT.mascotHeight + ASSO_LAYOUT.bubbleGap;
}

/** Bottom CSS per pulsante collapse (centrato sulla card) */
export function getAssoCollapseButtonBottom(isStickyBarVisible: boolean): number {
  return getAssoMascotBottom(isStickyBarVisible) + ASSO_LAYOUT.mascotHeight / 2 - 16;
}
