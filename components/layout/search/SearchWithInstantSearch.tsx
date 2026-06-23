'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, X, Camera } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSearchBox } from 'react-instantsearch';
import type { GameSlug } from '@/lib/contexts/GameContext';
import { type CategoryKey, normalizeCategoryKey, normalizeGameSlug } from '@/lib/search/category-mapping';
import type { SetResult } from '@/lib/search/global-search-types';
import { FRONTEND_TO_DB_SLUG, searchResultsPath } from '@/lib/search/global-search-url';
import { useSetSearch } from '@/lib/hooks/use-search';
import { isSellFlow } from '@/lib/sell-flow/sell-flow';
import { AnimatedSearchPlaceholder } from '@/components/layout/search/AnimatedSearchPlaceholder';
import { ProductCategoryButton } from '@/components/layout/search/ProductCategoryButton';
import { SearchCompositePanel } from '@/components/layout/search/SearchCompositePanel';
import { SearchResultsDropdown } from '@/components/layout/search/SearchResultsDropdown';
import { SetsResultsDropdown } from '@/components/layout/search/SetsResultsDropdown';

export function SearchWithInstantSearch({
  selectedGame,
  productCategory,
  setProductCategory,
  onOpenChange,
}: {
  selectedGame: GameSlug | null;
  productCategory: CategoryKey | null;
  setProductCategory: (c: CategoryKey | null) => void;
  onOpenChange?: (isOpen: boolean) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownDismissed, setDropdownDismissed] = useState(() => pathname.startsWith('/search'));
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const categoryColumnRef = useRef<HTMLDivElement>(null);
  const jointRef = useRef<HTMLDivElement>(null);
  const suggestionsAnchorRef = useRef<HTMLDivElement>(null);
  const dropdownContainerRef = useRef<HTMLDivElement>(null);
  const { query, refine } = useSearchBox();
  const refineRef = useRef(refine);
  const searchParams = useSearchParams();
  const urlQueryParam = (searchParams.get('q') ?? '').trim();
  const sellFlowActive = isSellFlow(searchParams);
  const [localValue, setLocalValue] = useState(query ?? '');
  const hasText = (localValue ?? '').trim().length > 0;
  const mappedGame = useMemo(() => normalizeGameSlug(selectedGame), [selectedGame]);

  const [isTyping, setIsTyping] = useState(false);
  const [typingKey, setTypingKey] = useState(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKeystrokeRef = useRef<number>(0);
  const [rowDelay, setRowDelay] = useState(80);

  const [typingVelocity, setTypingVelocity] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(0);
  const [streak, setStreak] = useState(0);
  const keystrokeTimesRef = useRef<number[]>([]);
  const energyDecayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSetsMode = productCategory === 'sets';

  // Debounce dell'input prima di interrogare /api/sets (React Query gestisce fetch/cache).
  const [debouncedSetQuery, setDebouncedSetQuery] = useState('');
  useEffect(() => {
    if (!isSetsMode || !localValue.trim()) {
      setDebouncedSetQuery('');
      return;
    }
    const id = setTimeout(() => setDebouncedSetQuery(localValue.trim()), 250);
    return () => clearTimeout(id);
  }, [isSetsMode, localValue]);

  const setsDbGame = selectedGame ? (FRONTEND_TO_DB_SLUG[selectedGame] ?? selectedGame) : '';
  const setsEnabled = isSetsMode && debouncedSetQuery.length > 0;
  const { data: setsData, isFetching: setsFetching } = useSetSearch(
    { q: debouncedSetQuery, game: setsDbGame, limit: 8 },
    { enabled: setsEnabled },
  );
  const setResults: SetResult[] = setsEnabled ? (setsData ?? []) : [];
  const setResultsLoading = setsEnabled && setsFetching;

  // FE-REV-017: ref stabile per evitare ri-esecuzioni se il parent passa una callback inline.
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useEffect(() => {
    onOpenChangeRef.current?.(isOpen);
  }, [isOpen]);

  // FE-REV-002: cleanup dei timer di typing/energy allo smontaggio per evitare setState post-unmount.
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (energyDecayRef.current) clearTimeout(energyDecayRef.current);
    };
  }, []);

  useEffect(() => {
    setLocalValue(query ?? '');
  }, [query]);

  useEffect(() => {
    refineRef.current = refine;
  }, [refine]);

  useEffect(() => {
    if (!pathname.startsWith('/search')) return;
    setLocalValue((prev) => (prev === urlQueryParam ? prev : urlQueryParam));
    refineRef.current(urlQueryParam);
  }, [pathname, urlQueryParam]);

  useEffect(() => {
    if (!pathname.startsWith('/search')) return;
    setIsOpen(false);
    setDropdownDismissed(true);
  }, [pathname]);

  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    setDropdownDismissed(true);
    setCategoryMenuOpen(false);
  }, []);

  const handleEnter = () => {
    if (isSetsMode) {
      const q = (localValue ?? '').trim();
      const dbGame = selectedGame ? (FRONTEND_TO_DB_SLUG[selectedGame] ?? selectedGame) : '';
      router.push(`/search?q=${encodeURIComponent(q)}&game=${encodeURIComponent(dbGame)}&mode=sets`);
      closePanel();
      return;
    }
    const searchQuery = (localValue ?? '').trim();
    refine(searchQuery);
    inputRef.current?.blur();
    closePanel();
    router.push(searchResultsPath(searchQuery, selectedGame, productCategory, sellFlowActive));
  };

  const handleClear = () => {
    setLocalValue('');
    refine('');
    inputRef.current?.focus();
  };

  const openPanel = () => {
    setIsOpen(true);
    setDropdownDismissed(false);
  };

  const handleCategorySelect = useCallback(
    (nextCategory: CategoryKey | null) => {
      const normalizedCategory = normalizeCategoryKey(nextCategory);
      setProductCategory(normalizedCategory);
      setCategoryMenuOpen(false);

      if (normalizedCategory === 'sets') {
        inputRef.current?.focus();
        return;
      }

      const currentQuery = (localValue ?? query ?? urlQueryParam ?? '').trim();
      if (currentQuery) {
        refineRef.current(currentQuery);
      }
      inputRef.current?.focus();
    },
    [localValue, query, urlQueryParam, setProductCategory]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (dropdownContainerRef.current?.contains(target)) return;
      const el = target instanceof Element ? target : null;
      if (el?.closest('.search-category-dropdown-panel--attached, .search-composite-panel')) return;
      closePanel();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closePanel]);

  const allowAutoDropdownFromText = !pathname.startsWith('/search');
  const showDropdown = (selectedGame || isSetsMode) && hasText && !dropdownDismissed;

  const showOpenStyle = Boolean(isOpen || (!dropdownDismissed && allowAutoDropdownFromText && hasText));
  const showComposite = showOpenStyle && categoryMenuOpen && showDropdown;

  const dropdownContent = showComposite ? (
    <SearchCompositePanel
      searchContainerRef={triggerRef}
      categoryColumnRef={categoryColumnRef}
      jointRef={jointRef}
      suggestionsAnchorRef={suggestionsAnchorRef}
      containerRef={dropdownContainerRef}
      selectedCategory={productCategory}
      onCategorySelect={handleCategorySelect}
      onCategoryClose={() => setCategoryMenuOpen(false)}
      gameSlug={mappedGame}
    >
      {isSetsMode ? (
        <SetsResultsDropdown
          layout="composite"
          suggestionsAnchorRef={suggestionsAnchorRef}
          jointRef={jointRef}
          containerRef={dropdownContainerRef}
          setResults={setResults}
          setResultsLoading={setResultsLoading}
          onClose={closePanel}
        />
      ) : selectedGame ? (
        <SearchResultsDropdown
          layout="composite"
          gameSlug={selectedGame}
          onSelect={closePanel}
          containerRef={dropdownContainerRef}
          suggestionsAnchorRef={suggestionsAnchorRef}
          jointRef={jointRef}
          categoryColumnRef={categoryColumnRef}
          productCategory={productCategory}
          isTyping={isTyping}
          typingKey={typingKey}
          rowDelay={rowDelay}
          energyLevel={energyLevel}
          typingVelocity={typingVelocity}
          streak={streak}
          sellFlowActive={sellFlowActive}
        />
      ) : null}
    </SearchCompositePanel>
  ) : showDropdown ? (
    isSetsMode ? (
      <SetsResultsDropdown
        suggestionsAnchorRef={suggestionsAnchorRef}
        jointRef={jointRef}
        containerRef={dropdownContainerRef}
        setResults={setResults}
        setResultsLoading={setResultsLoading}
        onClose={closePanel}
      />
    ) : selectedGame ? (
      <SearchResultsDropdown
        gameSlug={selectedGame}
        onSelect={closePanel}
        containerRef={dropdownContainerRef}
        suggestionsAnchorRef={suggestionsAnchorRef}
        jointRef={jointRef}
        categoryColumnRef={categoryColumnRef}
        productCategory={productCategory}
        isTyping={isTyping}
        typingKey={typingKey}
        rowDelay={rowDelay}
        energyLevel={energyLevel}
        typingVelocity={typingVelocity}
        streak={streak}
        sellFlowActive={sellFlowActive}
      />
    ) : null
  ) : null;

  const triggerBar = (
    <div
      ref={triggerRef}
      className={`search-container flex w-full min-w-[200px] flex-1 items-stretch gap-0 transition-[background-color,border-color,border-radius,box-shadow] duration-200 h-11 min-h-11 max-h-11 md:h-auto md:min-h-0 md:max-h-none ${
        showOpenStyle ? 'search-container--open bg-white' : 'overflow-hidden rounded-[50px]'
      } ${
        showDropdown || showComposite
          ? `search-container--dropdown-active !rounded-tl-[20px] !rounded-tr-[20px] !rounded-br-none md:!rounded-tl-[24px] md:!rounded-tr-[24px] ${
              categoryMenuOpen ? '!rounded-bl-none md:!rounded-bl-none' : '!rounded-bl-[20px] md:!rounded-bl-[24px]'
            }`
          : showOpenStyle
            ? categoryMenuOpen
              ? '!rounded-full !rounded-bl-none md:!rounded-bl-none'
              : '!rounded-full'
            : ''
      } ${showComposite ? 'search-container--composite-active' : ''}${
        categoryMenuOpen && showOpenStyle ? ' search-container--category-menu-open' : ''
      }`}
      style={{ zIndex: 1000 }}
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={categoryColumnRef} className="search-category-slot shrink-0 pl-0.5 md:pl-1">
        <ProductCategoryButton
          selectedCategory={productCategory}
          onSelect={handleCategorySelect}
          gameSlug={mappedGame}
          isBarOpen={showOpenStyle}
          open={categoryMenuOpen}
          onOpenChange={setCategoryMenuOpen}
          suppressAttachedPortal={showComposite}
          categoryColumnRef={categoryColumnRef}
          jointRef={jointRef}
          searchContainerRef={triggerRef}
        />
      </div>

      <div className="search-input-slot">
        <div
          ref={jointRef}
          aria-hidden="true"
          className={`search-joint ${showOpenStyle ? 'search-joint--open' : ''}`}
        />

        <div ref={suggestionsAnchorRef} className="flex min-h-0 min-w-0 flex-1 items-stretch">
          <div className="relative min-h-0 min-w-0 flex-1">
            <AnimatedSearchPlaceholder visible={!hasText} isDark={showOpenStyle} />
            <input
              ref={inputRef}
              type="text"
              value={localValue}
              onChange={(e) => {
                const v = e.target.value;
                setLocalValue(v);
                refine(v);
                if (v.trim()) {
                  setDropdownDismissed(false);
                }
                const now = Date.now();
                const gap = now - lastKeystrokeRef.current;
                lastKeystrokeRef.current = now;
                const adaptive =
                  gap > 0 && gap < 600
                    ? Math.round(30 + (90 * Math.min(Math.max(gap - 60, 0), 340)) / 340)
                    : 80;
                setRowDelay(adaptive);
                setIsTyping(true);
                setTypingKey((k) => k + 1);

                keystrokeTimesRef.current = keystrokeTimesRef.current.filter((t) => now - t < 1000);
                keystrokeTimesRef.current.push(now);
                const velocity = Math.min(keystrokeTimesRef.current.length / 8, 1);
                setTypingVelocity(velocity);
                setEnergyLevel((prev) => Math.min(prev + 0.12, 1));
                setStreak((prev) => Math.min(prev + 1, 15));
                if (energyDecayRef.current) clearTimeout(energyDecayRef.current);
                energyDecayRef.current = setTimeout(() => {
                  setEnergyLevel((prev) => Math.max(prev - 0.08, 0));
                  setStreak(0);
                }, 150);

                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                  setIsTyping(false);
                  setEnergyLevel(0);
                  setStreak(0);
                  setTypingVelocity(0);
                  keystrokeTimesRef.current = [];
                }, 1300);
              }}
              onFocus={openPanel}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleEnter();
                }
              }}
              enterKeyHint="search"
              inputMode="search"
              placeholder=""
              className={`h-full w-full border-0 bg-transparent px-3 py-0 text-[16px] leading-normal outline-none font-sans transition-colors duration-200 md:px-4 md:py-2.5 md:text-sm ${
                showOpenStyle ? 'text-gray-900' : 'text-white'
              } search-input-orange-placeholder`}
              aria-label="Cerca carte"
              autoComplete="off"
            />
          </div>
          <div
            className="search-right flex h-full flex-shrink-0 items-center gap-1 pr-1.5 md:pr-2"
            onClick={(e) => e.stopPropagation()}
          >
            {localValue && (
              <button
                type="button"
                onClick={handleClear}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200 md:h-9 md:w-9 ${
                  showOpenStyle
                    ? 'text-gray-400 hover:bg-orange-50 hover:text-orange-500'
                    : 'text-white/40 hover:bg-white/10 hover:text-white'
                }`}
                aria-label="Cancella ricerca"
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            )}
            <Link
              href="/scanner"
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200 md:h-9 md:w-9 ${
                showOpenStyle
                  ? 'text-[#FF7300] hover:bg-orange-50 hover:text-orange-600'
                  : 'text-white hover:bg-white/20'
              }`}
              aria-label="Scansiona carta con fotocamera"
            >
              <Camera className="h-4 w-4 md:h-5 md:w-5" />
            </Link>
            <button
              type="button"
              onClick={handleEnter}
              className={`search-btn flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200 md:h-9 md:w-9 ${
                showOpenStyle
                  ? 'text-[#FF7300] hover:bg-orange-50 hover:text-orange-600'
                  : 'text-white hover:bg-white/20'
              }`}
              aria-label="Cerca"
            >
              <Search className="h-4 w-4 md:h-5 md:w-5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {triggerBar}
      {dropdownContent}
    </>
  );
}
