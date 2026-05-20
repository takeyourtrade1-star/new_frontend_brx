/** Layout anteprima carta al hover — default a sinistra del trigger. */
export const CARD_PREVIEW_GAP = 10;
export const CARD_PREVIEW_MARGIN = 8;
export const CARD_PREVIEW_WIDTH_DESKTOP = 208;
export const CARD_PREVIEW_WIDTH_MOBILE = 176;
export const CARD_PREVIEW_MIN_WIDTH = 120;
export const CARD_PREVIEW_ASPECT_RATIO = 88 / 63;

export function getCardImagePreviewLayout(
  anchorRect: DOMRect,
  preferredWidth: number,
  preferSide: 'left' | 'right' = 'left'
): { left: number; top: number; width: number } {
  if (typeof window === 'undefined') {
    const width = preferredWidth;
    const left =
      preferSide === 'left'
        ? anchorRect.left - CARD_PREVIEW_GAP - width
        : anchorRect.right + CARD_PREVIEW_GAP;
    return { left, top: anchorRect.top, width };
  }

  const placeOnSide = (side: 'left' | 'right') => {
    const available =
      side === 'left'
        ? anchorRect.left - CARD_PREVIEW_MARGIN - CARD_PREVIEW_GAP
        : window.innerWidth - CARD_PREVIEW_MARGIN - (anchorRect.right + CARD_PREVIEW_GAP);

    const width = Math.min(
      preferredWidth,
      Math.max(CARD_PREVIEW_MIN_WIDTH, available)
    );

    const previewHeight = width * CARD_PREVIEW_ASPECT_RATIO;

    let left =
      side === 'left'
        ? anchorRect.left - CARD_PREVIEW_GAP - width
        : anchorRect.right + CARD_PREVIEW_GAP;

    if (side === 'left') {
      left = Math.max(CARD_PREVIEW_MARGIN, left);
    } else if (left + width > window.innerWidth - CARD_PREVIEW_MARGIN) {
      left = window.innerWidth - CARD_PREVIEW_MARGIN - width;
    }

    let top = anchorRect.top + (anchorRect.height - previewHeight) / 2;
    top = Math.max(
      CARD_PREVIEW_MARGIN,
      Math.min(top, window.innerHeight - previewHeight - CARD_PREVIEW_MARGIN)
    );

    return { left, top, width };
  };

  if (preferSide === 'left') {
    return placeOnSide('left');
  }

  const right = placeOnSide('right');
  const availableRight =
    window.innerWidth - CARD_PREVIEW_MARGIN - (anchorRect.right + CARD_PREVIEW_GAP);
  if (availableRight < CARD_PREVIEW_MIN_WIDTH) {
    return placeOnSide('left');
  }
  return right;
}
