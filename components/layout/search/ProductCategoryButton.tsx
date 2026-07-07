'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import {
  type CategoryKey,
  type GameSlug as MappingGameSlug,
  getCategoryKeys,
  getCategoryLabel,
  CATEGORY_KEY_ORDER,
} from '@/lib/search/category-mapping';
import type { CategoryDropdownRect } from '@/lib/search/global-search-types';
import { getCategoryDropdownPosition } from '@/lib/search/global-search-panel-layout';

export function ProductCategoryButton({
  selectedCategory,
  onSelect,
  gameSlug,
  isBarOpen = false,
  categoryColumnRef,
  jointRef,
  searchContainerRef,
  open: controlledOpen,
  onOpenChange,
  suppressAttachedPortal = false,
}: {
  selectedCategory: CategoryKey | null;
  onSelect: (cat: CategoryKey | null) => void;
  gameSlug: MappingGameSlug | null;
  isBarOpen?: boolean;
  categoryColumnRef: React.RefObject<HTMLDivElement | null>;
  jointRef: React.RefObject<HTMLDivElement | null>;
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  suppressAttachedPortal?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpenState = useCallback(
    (next: boolean) => {
      if (onOpenChange) onOpenChange(next);
      else setInternalOpen(next);
    },
    [onOpenChange]
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<CategoryDropdownRect | null>(null);

  const availableKeys = useMemo(() => {
    if (!gameSlug) return CATEGORY_KEY_ORDER;
    return getCategoryKeys(gameSlug);
  }, [gameSlug]);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const buttonEl = buttonRef.current;
    const categoryEl = categoryColumnRef.current;
    const jointEl = jointRef.current;
    const containerEl = searchContainerRef.current;

    const update = () => {
      setPos(getCategoryDropdownPosition(isBarOpen, buttonEl, categoryEl, jointEl, containerEl));
    };

    update();
    const rafId = window.requestAnimationFrame(update);
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(buttonEl);
    if (categoryEl) resizeObserver.observe(categoryEl);
    if (jointEl) resizeObserver.observe(jointEl);
    if (containerEl) resizeObserver.observe(containerEl);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, isBarOpen, categoryColumnRef, jointRef, searchContainerRef]);

  useEffect(() => {
    if (!open || suppressAttachedPortal) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t)) return;
      if (dropdownRef.current?.contains(t)) return;
      setOpenState(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, suppressAttachedPortal, setOpenState]);

  const currentLabel = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') return 'Tutte';
    if (gameSlug) return getCategoryLabel(gameSlug, selectedCategory as CategoryKey, 'it') || selectedCategory;
    const labelMap: Record<string, string> = {
      singles: 'Carte singole',
      boosters: 'Booster',
      booster_box: 'Booster box',
      starter_precon: 'Mazzi precostruiti',
      bundle_set: 'Bundle e set',
      tins: 'Tin box',
      accessori: 'Accessori',
      collezionabili: 'Collezionabili',
      sets: 'Set & Edizioni',
    };
    return labelMap[selectedCategory] || selectedCategory;
  }, [selectedCategory, gameSlug]);

  const mobileLabel = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') return 'Tutte';
    const shortMap: Record<string, string> = {
      singles: 'Carte',
      boosters: 'Booster',
      booster_box: 'Box',
      starter_precon: 'Mazzi',
      bundle_set: 'Bundle',
      tins: 'Tin box',
      accessori: 'Accessori',
      collezionabili: 'Collezionabili',
      sets: 'Set',
    };
    return shortMap[selectedCategory] || currentLabel.slice(0, 6);
  }, [selectedCategory, currentLabel]);

  const dropdownMenu =
    open && pos && typeof document !== 'undefined' && !(isBarOpen && suppressAttachedPortal)
      ? createPortal(
          <div
            ref={dropdownRef}
            className={
              isBarOpen
                ? 'search-category-dropdown-panel search-category-dropdown-panel--attached fixed z-[1100] overflow-hidden bg-white py-1 !rounded-t-none !rounded-br-none !rounded-bl-[20px] md:!rounded-bl-[24px]'
                : 'search-category-dropdown-panel fixed z-[1100] min-w-[180px] max-w-[220px] overflow-hidden rounded-lg border border-gray-100 bg-white py-1 shadow-xl'
            }
            style={{
              top: pos.top,
              left: pos.left,
              width: isBarOpen ? pos.width : undefined,
              minWidth: isBarOpen ? pos.width : 180,
            }}
          >
            {availableKeys.map((key) => {
              const label = gameSlug ? getCategoryLabel(gameSlug, key, 'it') : key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(key === 'all' ? null : key);
                    setOpenState(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium font-sans hover:bg-[#FF7300]/10 transition-colors ${
                    selectedCategory === key || (!selectedCategory && key === 'all')
                      ? 'text-[#FF7300] bg-orange-50/50'
                      : 'text-gray-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpenState(!open);
        }}
        className={`flex h-8 items-center gap-1 border-0 bg-transparent px-2.5 text-xs font-medium font-sans leading-none transition-colors duration-200 whitespace-nowrap md:h-9 md:gap-1.5 md:px-3.5 md:text-sm ${
          isBarOpen ? 'text-gray-800 hover:text-gray-900' : 'text-white/90 hover:text-white'
        }`}
      >
        <span className="relative hidden md:inline leading-none text-left" style={{ top: '-0.5px' }}>
          {currentLabel}
        </span>
        <span className="relative md:hidden leading-none text-center" style={{ top: '-0.5px' }}>
          {mobileLabel}
        </span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 md:h-4 md:w-4 transition-transform ${open ? 'rotate-180' : 'rotate-0'}`}
        />
      </button>
      {dropdownMenu}
    </>
  );
}
