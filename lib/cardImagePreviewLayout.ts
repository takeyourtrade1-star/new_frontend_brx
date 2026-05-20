/** Layout anteprima carta al hover — default a sinistra del trigger. */
export const CARD_PREVIEW_GAP = 10;
export const CARD_PREVIEW_MARGIN = 8;
export const CARD_PREVIEW_WIDTH_DESKTOP = 208;
export const CARD_PREVIEW_WIDTH_MOBILE = 176;
export const CARD_PREVIEW_MIN_WIDTH = 140;
export const CARD_PREVIEW_ASPECT_RATIO = 88 / 63;

export function getCardImagePreviewLayout(
  anchorRect: DOMRect,
  preferredWidth: number,
  preferSide: 'left' | 'right' = 'left'
): { left: number; top: number; width: number } {
  const compute = (side: 'left' | 'right') => {
    if (typeof window === 'undefined') {
      const width = preferredWidth;
      const previewHeight = width * CARD_PREVIEW_ASPECT_RATIO;
      const left =
        side === 'left'
          ? anchorRect.left - CARD_PREVIEW_GAP - width
          : anchorRect.right + CARD_PREVIEW_GAP;
      return { left, top: anchorRect.top, width };
    }

    const available =
      side === 'left'
        ? anchorRect.left - CARD_PREVIEW_MARGIN - CARD_PREVIEW_GAP
        : window.innerWidth - CARD_PREVIEW_MARGIN - (anchorRect.right + CARD_PREVIEW_GAP);

    const width = Math.max(
      CARD_PREVIEW_MIN_WIDTH,
      Math.min(preferredWidth, available)
    );
    const previewHeight = width * CARD_PREVIEW_ASPECT_RATIO;

    const left =
      side === 'left'
        ? anchorRect.left - CARD_PREVIEW_GAP - width
        : anchorRect.right + CARD_PREVIEW_GAP;

    let top = anchorRect.top + (anchorRect.height - previewHeight) / 2;
    top = Math.max(
      CARD_PREVIEW_MARGIN,
      Math.min(top, window.innerHeight - previewHeight - CARD_PREVIEW_MARGIN)
    );

    if (side === 'left' && left < CARD_PREVIEW_MARGIN) return null;
    if (
      side === 'right' &&
      left + width > window.innerWidth - CARD_PREVIEW_MARGIN
    ) {
      return null;
    }

    return { left, top, width };
  };

  const primary = compute(preferSide);
  if (primary) return primary;
  const fallback = compute(preferSide === 'left' ? 'right' : 'left');
  return (
    fallback ?? {
      left: CARD_PREVIEW_MARGIN,
      top: anchorRect.top,
      width: Math.min(preferredWidth, CARD_PREVIEW_MIN_WIDTH),
    }
  );
}
