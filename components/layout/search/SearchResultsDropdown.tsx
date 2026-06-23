'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { useSearchBox, useHits } from 'react-instantsearch';
import type { GameSlug } from '@/lib/contexts/GameContext';
import type { CategoryKey } from '@/lib/search/category-mapping';
import type { CardSearchHit, FixedPanelRect } from '@/lib/search/global-search-types';
import {
  HOVER_CLOSE_DELAY_MS,
  INLINE_PREVIEW_WIDTH,
  getLeftColumnPreviewLayout,
  getSuggestionsPanelPosition,
} from '@/lib/search/global-search-panel-layout';
import {
  getCardSlugForUrl,
  productDetailPath,
  searchResultsPath,
} from '@/lib/search/global-search-url';
import { AnimatedCounter } from '@/components/layout/search/AnimatedCounter';
import { CardHit } from '@/components/layout/search/CardHit';

export function SearchResultsDropdown({
  gameSlug,
  onSelect,
  containerRef,
  suggestionsAnchorRef,
  jointRef,
  categoryColumnRef,
  productCategory,
  position: dropdownPosition = 'bottom',
  layout = 'standalone',
  isTyping = false,
  typingKey = 0,
  rowDelay = 80,
  energyLevel = 0,
  typingVelocity = 0,
  streak = 0,
  sellFlowActive = false,
}: {
  gameSlug: GameSlug;
  onSelect: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  suggestionsAnchorRef: React.RefObject<HTMLDivElement | null>;
  jointRef: React.RefObject<HTMLDivElement | null>;
  categoryColumnRef: React.RefObject<HTMLDivElement | null>;
  productCategory: CategoryKey | null;
  position?: 'top' | 'bottom';
  layout?: 'standalone' | 'composite';
  isTyping?: boolean;
  typingKey?: number;
  rowDelay?: number;
  energyLevel?: number;
  typingVelocity?: number;
  streak?: number;
  sellFlowActive?: boolean;
}) {
  const router = useRouter();
  const { query, isSearchStalled } = useSearchBox();
  const { hits } = useHits();
  const [inlinePreview, setInlinePreview] = useState<{
    url: string;
    name: string;
    rect: DOMRect;
  } | null>(null);
  const [position, setPosition] = useState<FixedPanelRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (layout === 'composite') return;
    if (!suggestionsAnchorRef.current) return;
    const anchorEl = suggestionsAnchorRef.current;
    const jointEl = jointRef.current;
    const update = () => {
      setPosition(getSuggestionsPanelPosition(anchorEl, jointEl, dropdownPosition));
    };

    update();
    const rafId = window.requestAnimationFrame(update);
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(anchorEl);
    const categoryEl = categoryColumnRef.current;
    if (categoryEl) resizeObserver.observe(categoryEl);
    if (jointEl) resizeObserver.observe(jointEl);
    anchorEl.addEventListener('transitionend', update);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      anchorEl.removeEventListener('transitionend', update);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [layout, suggestionsAnchorRef, jointRef, categoryColumnRef, dropdownPosition]);

  const showInlinePreview = (url: string, name: string, buttonRect: DOMRect) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setInlinePreview({ url, name, rect: buttonRect });
  };

  const scheduleClose = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => setInlinePreview(null), HOVER_CLOSE_DELAY_MS);
  };

  const cancelClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const hasHits = hits.length > 0;
  const previewColumnRect = categoryColumnRef.current?.getBoundingClientRect();
  const inlinePreviewLayout =
    inlinePreview && previewColumnRect
      ? getLeftColumnPreviewLayout(previewColumnRect, inlinePreview.rect, INLINE_PREVIEW_WIDTH)
      : null;

  const suggestionsBody = (
    <div
      ref={layout === 'composite' ? undefined : (containerRef as React.Ref<HTMLDivElement>)}
      className={`search-suggestions-panel__body flex flex-col ${
        layout === 'composite'
          ? 'max-h-[min(400px,calc(100vh-8rem))] min-h-[80px]'
          : 'max-h-[400px] min-h-[80px]'
      }`}
      role="listbox"
      aria-label="Suggerimenti ricerca"
    >
      {isSearchStalled ? (
        <div className="flex items-center justify-center gap-2 px-4 py-6 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Ricerca in corso...</span>
        </div>
      ) : hasHits ? (
        <>
          <div className="overflow-y-auto overflow-x-hidden flex-1" onScroll={() => setInlinePreview(null)}>
            {hits.map((hit, index) => (
              <CardHit
                key={(hit as CardSearchHit).id ?? (hit as CardSearchHit).objectID ?? index}
                hit={hit as unknown as CardSearchHit}
                index={index}
                gameSlug={gameSlug}
                searchQuery={query ?? ''}
                isTyping={isTyping}
                typingKey={typingKey}
                rowDelay={rowDelay}
                energyLevel={energyLevel}
                typingVelocity={typingVelocity}
                streak={streak}
                onNavigate={() => {
                  const slug = getCardSlugForUrl(hit as unknown as CardSearchHit);
                  router.push(productDetailPath(slug, sellFlowActive));
                  onSelect();
                }}
                onShowInlinePreview={showInlinePreview}
                onScheduleClose={scheduleClose}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const q = (query ?? '').trim();
              if (!q) return;
              const active = document.activeElement;
              if (active instanceof HTMLElement) active.blur();
              router.push(searchResultsPath(q, gameSlug, productCategory, sellFlowActive));
              onSelect();
            }}
            className="w-full py-4 text-center text-base font-medium text-[#0f172a] bg-[#F8F8F8] hover:bg-[#EEEEEE] transition-colors"
          >
            Mostra tutti i risultati (<AnimatedCounter value={hits.length} />+)
          </button>
        </>
      ) : (
        <div className="px-4 py-4 text-sm text-gray-500">Nessun risultato trovato</div>
      )}
    </div>
  );

  const inlinePreviewPortal =
    inlinePreview && inlinePreviewLayout && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed z-[1100] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
            style={{
              left: inlinePreviewLayout.left,
              top: inlinePreviewLayout.top,
              width: inlinePreviewLayout.width,
            }}
            onMouseEnter={cancelClose}
            onMouseLeave={() => setInlinePreview(null)}
            role="img"
            aria-label={`Anteprima: ${inlinePreview.name}`}
          >
            <div className="relative w-full aspect-[63/88]">
              <Image
                src={inlinePreview.url}
                alt={inlinePreview.name}
                fill
                sizes="200px"
                className="object-contain"
                draggable={false}
              />
            </div>
          </div>,
          document.body
        )
      : null;

  if (layout === 'composite') {
    return (
      <>
        {suggestionsBody}
        {inlinePreviewPortal}
      </>
    );
  }

  if (!position) return null;

  const dropdownContent = (
    <>
      <div
        className={`search-suggestions-panel !rounded-t-none !rounded-b-[20px] md:!rounded-b-[24px] ${
          dropdownPosition === 'top' ? 'shadow-[0_-4px_12px_rgba(0,0,0,0.12)]' : ''
        }`}
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          width: position.width,
          zIndex: 1001,
        }}
      >
        {suggestionsBody}
      </div>
      {inlinePreviewPortal}
    </>
  );

  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(dropdownContent, document.body);
}
