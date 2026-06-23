import type { CategoryDropdownRect, FixedPanelRect } from '@/lib/search/global-search-types';

export const HOVER_CLOSE_DELAY_MS = 250;
export const SEARCH_PANEL_BORDER_OVERLAP = 1;

export const INLINE_PREVIEW_WIDTH = 200;
export const INLINE_PREVIEW_MIN_WIDTH = 140;
export const INLINE_PREVIEW_ASPECT_RATIO = 88 / 63;
export const INLINE_PREVIEW_MARGIN = 8;

export function getCategoryDropdownPosition(
  isBarOpen: boolean,
  buttonEl: HTMLButtonElement,
  categoryColumnEl: HTMLElement | null,
  jointEl: HTMLElement | null,
  searchContainerEl: HTMLElement | null
): CategoryDropdownRect {
  if (isBarOpen && categoryColumnEl && searchContainerEl) {
    const categoryRect = categoryColumnEl.getBoundingClientRect();
    const containerRect = searchContainerEl.getBoundingClientRect();
    const jointRect = jointEl?.getBoundingClientRect();
    const left = Math.round(categoryRect.left);
    const right = jointRect
      ? Math.round(jointRect.right)
      : Math.round(categoryRect.right);
    return {
      top: Math.round(containerRect.bottom) - SEARCH_PANEL_BORDER_OVERLAP,
      left,
      width: Math.max(0, right - left),
    };
  }
  const rect = buttonEl.getBoundingClientRect();
  return {
    top: Math.round(rect.bottom + 4),
    left: Math.round(rect.left),
    width: Math.max(Math.round(rect.width), 180),
  };
}

export function snapRect(rect: DOMRect, borderOverlap = 0): FixedPanelRect {
  return {
    top: Math.round(rect.top + (borderOverlap ? -borderOverlap : 0)),
    left: Math.round(rect.left),
    width: Math.round(rect.width),
  };
}

export function getSuggestionsPanelPosition(
  anchorEl: HTMLElement,
  jointEl: HTMLElement | null = null,
  position: 'top' | 'bottom' = 'bottom'
): FixedPanelRect {
  const anchorRect = anchorEl.getBoundingClientRect();
  const jointRect = jointEl?.getBoundingClientRect();
  const left = jointRect
    ? Math.round(jointRect.right)
    : Math.round(anchorRect.left);
  const width = jointRect
    ? Math.max(0, Math.round(anchorRect.right) - left)
    : Math.round(anchorRect.width);

  if (position === 'top') {
    return { top: Math.round(anchorRect.top), left, width };
  }
  return {
    top: Math.round(anchorRect.bottom) - SEARCH_PANEL_BORDER_OVERLAP,
    left,
    width,
  };
}

export function getCompositePanelRect(
  searchContainerEl: HTMLElement,
  categoryColumnEl: HTMLElement,
  jointEl: HTMLElement | null,
  suggestionsAnchorEl: HTMLElement
): FixedPanelRect & { categoryWidth: number } {
  const containerRect = searchContainerEl.getBoundingClientRect();
  const categoryRect = categoryColumnEl.getBoundingClientRect();
  const anchorRect = suggestionsAnchorEl.getBoundingClientRect();
  const jointRect = jointEl?.getBoundingClientRect();
  const left = Math.round(categoryRect.left);
  const jointRight = jointRect
    ? Math.round(jointRect.right)
    : Math.round(categoryRect.right);
  const right = Math.round(anchorRect.right);
  return {
    top: Math.round(containerRect.bottom) - SEARCH_PANEL_BORDER_OVERLAP,
    left,
    width: Math.max(0, right - left),
    categoryWidth: Math.max(0, jointRight - left),
  };
}

export function getLeftColumnPreviewLayout(
  categoryColumnRect: DOMRect,
  rowRect: DOMRect,
  preferredWidth: number
): { left: number; top: number; width: number } {
  const columnPadding = 6;
  const availableWidth = Math.max(
    categoryColumnRect.width - columnPadding * 2,
    INLINE_PREVIEW_MIN_WIDTH
  );
  const width = Math.max(
    INLINE_PREVIEW_MIN_WIDTH,
    Math.min(preferredWidth, availableWidth)
  );
  const previewHeight = width * INLINE_PREVIEW_ASPECT_RATIO;

  const left = categoryColumnRect.left + (categoryColumnRect.width - width) / 2;
  let top = rowRect.top + (rowRect.height - previewHeight) / 2;

  if (typeof window !== 'undefined') {
    top = Math.max(
      INLINE_PREVIEW_MARGIN,
      Math.min(top, window.innerHeight - previewHeight - INLINE_PREVIEW_MARGIN)
    );
  }

  return { left, top, width };
}
