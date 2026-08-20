'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  type CategoryKey,
  type GameSlug as MappingGameSlug,
} from '@/lib/search/category-mapping';
import type { FixedPanelRect } from '@/lib/search/global-search-types';
import { getCompositePanelRect } from '@/lib/search/global-search-panel-layout';
import { CategoryMenuList } from '@/components/layout/search/CategoryMenuList';

export function SearchCompositePanel({
  searchContainerRef,
  categoryColumnRef,
  jointRef,
  suggestionsAnchorRef,
  containerRef,
  selectedCategory,
  onCategorySelect,
  onCategoryClose,
  gameSlug,
  children,
}: {
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
  categoryColumnRef: React.RefObject<HTMLDivElement | null>;
  jointRef: React.RefObject<HTMLDivElement | null>;
  suggestionsAnchorRef: React.RefObject<HTMLDivElement | null>;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  selectedCategory: CategoryKey | null;
  onCategorySelect: (cat: CategoryKey | null) => void;
  onCategoryClose: () => void;
  gameSlug: MappingGameSlug | null;
  children: React.ReactNode;
}) {
  const [position, setPosition] = useState<(FixedPanelRect & { categoryWidth: number }) | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    const containerEl = searchContainerRef.current;
    const categoryEl = categoryColumnRef.current;
    const anchorEl = suggestionsAnchorRef.current;
    if (!containerEl || !categoryEl || !anchorEl) return;

    const update = () => {
      setPosition(getCompositePanelRect(containerEl, categoryEl, jointRef.current, anchorEl));
    };

    update();
    const rafId = window.requestAnimationFrame(update);
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(containerEl);
    resizeObserver.observe(categoryEl);
    resizeObserver.observe(anchorEl);
    const jointEl = jointRef.current;
    if (jointEl) resizeObserver.observe(jointEl);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [searchContainerRef, categoryColumnRef, jointRef, suggestionsAnchorRef]);

  if (!mounted || !position || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={containerRef as React.Ref<HTMLDivElement>}
      className="search-composite-panel"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 510,
      }}
    >
      <div className="search-composite-panel__category-col" style={{ width: position.categoryWidth }}>
        <CategoryMenuList
          selectedCategory={selectedCategory}
          onSelect={onCategorySelect}
          gameSlug={gameSlug}
          onClose={onCategoryClose}
        />
      </div>
      <div className="search-composite-panel__divider" aria-hidden="true" />
      <div className="search-composite-panel__suggestions-col">{children}</div>
    </div>,
    document.body
  );
}
