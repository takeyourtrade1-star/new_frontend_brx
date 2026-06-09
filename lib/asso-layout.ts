/** Layout condiviso mascotte Asso e bubble messaggi (angolo basso-destra) */

export const ASSO_LAYOUT = {
  mascotWidth: 96,
  mascotHeight: 128,
  mascotRight: 48,
  mascotBottom: 20,
  mascotBottomSticky: 80,
  bubbleGap: 8,
  /** Allineato al bordo destro — bubble stretta, non invade il centro pagina */
  bubbleRight: 12,
} as const;

export const ASSO_MOBILE_MAX_WIDTH = 639;

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
