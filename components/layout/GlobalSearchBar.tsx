'use client';

/**
 * GlobalSearchBar - Game-First UX con Meilisearch (stesso stile e funzionalità di frontend-vecchio)
 * Ricerca 100% server-side su Meilisearch (react-instantsearch + instant-meilisearch).
 * Input disabilitato finché non è selezionato un gioco; filtro rigoroso game_slug.
 */

import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, Loader2, X, ChevronDown, Camera } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { InstantSearch, Configure, Highlight, useSearchBox, useHits } from 'react-instantsearch';
import { searchClient } from '@/lib/meilisearchClient';
import { useLanguage, LANGUAGE_NAMES } from '@/lib/contexts/LanguageContext';
import { useGame, GAME_OPTIONS, type GameSlug } from '@/lib/contexts/GameContext';
import { MEILISEARCH } from '@/lib/config';
import { getCardImageUrl } from '@/lib/assets';
import { generateSlug } from '@/lib/mock-cards';
import { CATEGORY_SLUGS } from '@/lib/product-categories';
import {
  FRONTEND_TO_GAME_SLUG,
  type CategoryKey,
  type GameSlug as MappingGameSlug,
  normalizeGameSlug,
  normalizeCategoryKey,
  getCategoryIds,
  getCategoryIdsAcrossGames,
  getCategoryKeys,
  getCategoryLabel,
  CATEGORY_KEY_ORDER,
} from '@/lib/search/category-mapping';

type HighlightValue = { value: string; matchLevel: string };
type HighlightResult = Record<string, HighlightValue | HighlightValue[]>;

export interface CardSearchHit {
  objectID?: string;
  id?: string;
  card_print_id?: string;
  game_slug?: string;
  name: string;
  set_name?: string;
  set_code?: string;
  collector_number?: string;
  /** Path dall'indice Meilisearch (es. cards/4/158647.webp o img/cards/4/158647.webp; il prefisso img/ viene rimosso) */
  image?: string | null;
  image_path?: string | null;
  image_uri_small?: string | null;
  image_uri_normal?: string | null;
  icon_svg_uri?: string | null;
  set_icon_uri?: string | null;
  type?: string;
  keywords_localized?: string | string[] | Record<string, string>;
  _highlightResult?: HighlightResult;
  _snippetResult?: HighlightResult;
  __position?: number;
}

/** Slug frontend (GameContext) → slug tabella games / Meilisearch (DB: mtg, pokemon, one-piece). */
const FRONTEND_TO_DB_SLUG: Record<string, string> = {
  mtg: 'mtg',
  pokemon: 'pokemon',
  op: 'one-piece',
};

/* CATEGORY_TO_MEILI_TYPE rimosso: ora usiamo category_id da CATEGORY_MAPPING */

/** Costruisce URL pagina risultati; game in query = slug DB (per /api/search e Meilisearch). */
function buildSearchUrl(q: string, game?: GameSlug | null, categoryKey?: CategoryKey | null): string {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (game) {
    const dbSlug = FRONTEND_TO_GAME_SLUG[game] ?? game;
    params.set('game', dbSlug);
  }
  const normalizedCategory = normalizeCategoryKey(categoryKey);
  if (normalizedCategory && normalizedCategory !== 'all') {
    params.set('category_key', normalizedCategory);
  }
  return `/search?${params.toString()}`;
}

const SUPPORTED_LANGS = new Set(['en', 'de', 'es', 'fr', 'it', 'pt'] as const);
type SupportedLang = 'en' | 'de' | 'es' | 'fr' | 'it' | 'pt';
const BACKEND_LANG_ORDER = ['en', 'de', 'es', 'fr', 'it', 'pt'] as const;

function normalizeLang(lang: string): SupportedLang {
  return SUPPORTED_LANGS.has(lang as SupportedLang) ? (lang as SupportedLang) : 'en';
}

function backendIndexForLang(lang: SupportedLang): number {
  return BACKEND_LANG_ORDER.indexOf(lang);
}

function getMatchedHighlightValueForLang(
  hr: HighlightValue | HighlightValue[] | Record<string, HighlightValue> | undefined,
  selectedLang: string
): string | null {
  if (!hr) return null;
  const lang = normalizeLang(selectedLang);
  if (!Array.isArray(hr) && typeof hr === 'object' && hr !== null && lang in hr) {
    const byLang = hr as Record<string, HighlightValue>;
    const entry = byLang[lang];
    if (entry && entry.matchLevel && entry.matchLevel !== 'none') return entry.value;
    return null;
  }
  if (Array.isArray(hr)) {
    const idx = backendIndexForLang(lang);
    if (idx >= 0 && hr[idx] && hr[idx].matchLevel && hr[idx].matchLevel !== 'none')
      return hr[idx].value;
    return null;
  }
  return null;
}

function hasNameMatch(hr: HighlightValue | undefined): boolean {
  return Boolean(hr && hr.matchLevel && hr.matchLevel !== 'none');
}

function getLocalizedNameForLang(
  keywords: string | string[] | Record<string, string> | undefined,
  selectedLang: string
): string | null {
  if (!keywords) return null;
  const lang = normalizeLang(selectedLang);
  if (lang === 'en') return null;
  if (!Array.isArray(keywords) && typeof keywords === 'object' && keywords !== null) {
    const byLang = keywords as Record<string, string>;
    const raw = byLang[lang];
    if (!raw || typeof raw !== 'string') return null;
    return raw.replace(/<[^>]+>/g, '').trim() || null;
  }
  if (Array.isArray(keywords)) {
    const idx = backendIndexForLang(lang);
    if (idx < 0 || !keywords[idx]) return null;
    const raw = keywords[idx];
    return (typeof raw === 'string' ? raw : '').replace(/<[^>]+>/g, '').trim() || null;
  }
  return null;
}

const HIGHLIGHT_ORANGE = 'rgba(255, 165, 0, 0.22)';

function RenderHighlightedText({ value }: { value: string }) {
  const parts = value.split(/(<em>|<\/em>)/i).filter(Boolean);
  const segments: Array<{ type: 'plain' | 'highlight'; text: string }> = [];
  let current = '';
  let inEm = false;
  for (const part of parts) {
    if (/^<em>$/i.test(part)) {
      if (current) {
        segments.push({ type: 'plain', text: current });
        current = '';
      }
      inEm = true;
    } else if (/^<\/em>$/i.test(part)) {
      if (current) {
        segments.push({ type: inEm ? 'highlight' : 'plain', text: current });
        current = '';
      }
      inEm = false;
    } else {
      current += part;
    }
  }
  if (current) segments.push({ type: inEm ? 'highlight' : 'plain', text: current });

  return (
    <span>
      {segments.map((seg, i) =>
        seg.type === 'highlight' ? (
          <mark
            key={i}
            className="rounded px-0.5 font-medium"
            style={{ backgroundColor: HIGHLIGHT_ORANGE }}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </span>
  );
}

function HighlightQueryInText({ text, query }: { text: string; query: string }) {
  const q = (query ?? '').trim();
  if (!q) return <span>{text}</span>;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark
            key={i}
            className="rounded px-0.5 font-medium"
            style={{ backgroundColor: HIGHLIGHT_ORANGE }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

function getTitleAndSubtitle(hit: CardSearchHit, selectedLang: string) {
  const lang = normalizeLang(selectedLang);
  const hr = hit._highlightResult;
  const nameHighlight = hr?.name as HighlightValue | undefined;
  const keywordsHighlight = hr?.keywords_localized as
    | HighlightValue
    | HighlightValue[]
    | Record<string, HighlightValue>
    | undefined;
  const englishName = hit.name;

  const hasNameMatchResult = hasNameMatch(nameHighlight);
  const keywordsMatchedValue = getMatchedHighlightValueForLang(keywordsHighlight, lang);
  const preferLocalized = lang !== 'en';

  if (preferLocalized) {
    const localizedName =
      keywordsMatchedValue?.trim() || getLocalizedNameForLang(hit.keywords_localized, lang);
    if (localizedName) {
      return {
        titleType: 'localized' as const,
        title: localizedName,
        subtitle: `EN: ${englishName}`,
      };
    }
  }

  if (hasNameMatchResult) {
    return { titleType: 'english' as const, title: null, subtitle: null };
  }

  return { titleType: 'fallback' as const, title: englishName, subtitle: null };
}

function SearchInput({
  disabled,
  placeholder,
  onFocus,
  isOpen,
  hasResults,
  inputRef,
  onEnter,
  variant = 'default',
}: {
  disabled: boolean;
  placeholder: string;
  onFocus: () => void;
  isOpen: boolean;
  hasResults: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onEnter?: () => void;
  variant?: 'default' | 'pill';
}) {
  const { query, refine, isSearchStalled } = useSearchBox();
  const [localValue, setLocalValue] = useState(query ?? '');
  const [isFocused, setIsFocused] = useState(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // On initial mount, don't overwrite localValue with empty query
    // to avoid race condition where user types before InstantSearch initializes
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // Only sync from InstantSearch when not focused to avoid overwriting user input
    if (!isFocused) setLocalValue(query ?? '');
  }, [query, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setLocalValue(v);
    refine(v);
  };

  const handleClear = () => {
    setLocalValue('');
    refine('');
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  const isPill = variant === 'pill';

  return (
    <div className={`relative flex-1 min-w-0 ${isPill ? 'flex' : ''}`}>
      <input
        ref={inputRef as React.Ref<HTMLInputElement>}
        type="text"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={
          isPill
            ? 'w-full min-w-0 px-5 py-2.5 pr-12 text-base border-0 bg-transparent rounded-l-[50px] outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:ring-0 focus:ring-offset-0 search-input-orange-placeholder text-[rgba(3,3,3,0.9)]'
            : 'w-full px-4 py-2 pr-16 text-[16px] md:text-[14px] border border-gray-200 rounded-lg outline-none transition-all duration-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:ring-opacity-30 search-input-orange-placeholder bg-gray-50 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed text-gray-900'
        }
        style={
          isPill
            ? { fontSize: '16px' }
            : {
                borderRadius: isOpen && hasResults ? '10px 10px 0 0' : '10px',
                borderBottom: isOpen && hasResults ? 'none' : undefined,
              }
        }
        aria-label="Cerca carte"
        autoComplete="off"
      />
      {isSearchStalled && (
        <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none ${isPill ? 'right-12' : 'right-10'}`}>
          <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin" />
        </div>
      )}
      {localValue && !isSearchStalled && (
        <button
          type="button"
          onClick={handleClear}
          className={`absolute top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 z-10 ${isPill ? 'right-12' : 'right-10'}`}
          aria-label="Cancella ricerca"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    prevValue.current = value;
    if (from === to) { setDisplay(to); return; }

    const duration = 400;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return <>{display}</>;
}

const HOVER_CLOSE_DELAY_MS = 250;

/** Larghezza anteprima carta inline (stile CardTrader) */
const INLINE_PREVIEW_WIDTH = 220;

function CardHit({
  hit,
  index,
  gameSlug,
  onNavigate,
  onShowInlinePreview,
  onScheduleClose,
  searchQuery,
  isTyping = false,
  typingKey = 0,
  rowDelay = 80,
  energyLevel = 0,
  typingVelocity = 0,
  streak = 0,
}: {
  hit: CardSearchHit;
  index: number;
  gameSlug: GameSlug;
  onNavigate: () => void;
  onShowInlinePreview: (url: string, name: string, buttonRect: DOMRect) => void;
  onScheduleClose?: () => void;
  searchQuery: string;
  isTyping?: boolean;
  typingKey?: number;
  rowDelay?: number;
  energyLevel?: number;
  typingVelocity?: number;
  streak?: number;
}) {
  const cameraButtonRef = useRef<HTMLButtonElement>(null);
  const { selectedLang } = useLanguage();
  const fullImage = useMemo(() => {
    const raw = hit.image ?? hit.image_path ?? hit.image_uri_normal ?? hit.image_uri_small ?? null;
    return getCardImageUrl(raw);
  }, [hit.image, hit.image_path, hit.image_uri_normal, hit.image_uri_small]);
  const setIcon = hit.set_icon_uri ?? hit.icon_svg_uri ?? null;
  const setCode = hit.set_code ?? (hit.set_name ? hit.set_name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : null);
  const setName = hit.set_name ?? '';
  const { titleType, title, subtitle } = getTitleAndSubtitle(hit, selectedLang);

  const handleCameraClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fullImage && cameraButtonRef.current) {
      onShowInlinePreview(fullImage, hit.name, cameraButtonRef.current.getBoundingClientRect());
    }
  };

  const handleCameraMouseEnter = () => {
    if (fullImage && cameraButtonRef.current) {
      onShowInlinePreview(fullImage, hit.name, cameraButtonRef.current.getBoundingClientRect());
    }
  };

  const handleCameraMouseLeave = () => {
    onScheduleClose?.();
  };

  const plainTitle = title != null ? title.replace(/<[^>]+>/g, '').trim() : '';
  const hasBackendHighlight = title != null && /<em>/i.test(title);

  const rowBg = index % 2 === 0 ? 'bg-white' : 'bg-[#F8F8F8]';
  const rainbowDelay = index * rowDelay;

  // Random color based on card ID (not just index) for better distribution
  const cardIdForColor = hit.id ?? hit.objectID ?? hit.card_print_id ?? hit.name ?? String(index);
  const colorIndex = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < cardIdForColor.length; i++) {
      hash = ((hash << 5) - hash) + cardIdForColor.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 6;
  }, [cardIdForColor]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onNavigate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNavigate();
        }
      }}
      className={`group relative flex items-center gap-2 md:gap-3 px-3 py-2.5 md:px-4 md:py-3 cursor-pointer transition-colors hover:bg-[#EEEEEE] ${rowBg}`}
    >
      {/* Rainbow glow overlay (while typing) - PARTY MODE: each row gets its own color */}
      {isTyping && (
        <div
          key={`glow-${typingKey}`}
          className={`row-glow-party-${colorIndex}`}
          style={{ 
            animationDelay: `${rainbowDelay}ms`,
            '--energy': energyLevel,
            '--velocity': typingVelocity,
          } as React.CSSProperties}
          aria-hidden
        />
      )}
      {/* Streak sparkles for high velocity typing */}
      {isTyping && streak > 5 && index < 3 && (
        <div className="streak-sparkles" aria-hidden>
          {[...Array(Math.min(streak - 5, 4))].map((_, i) => (
            <span
              key={i}
              className="sparkle"
              style={{
                left: `${15 + Math.random() * 70}%`,
                top: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}
        </div>
      )}
      <button
        ref={cameraButtonRef}
        type="button"
        onClick={handleCameraClick}
        onMouseEnter={handleCameraMouseEnter}
        onMouseLeave={handleCameraMouseLeave}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-orange-50 hover:text-orange-500 group-hover:text-orange-500 transition-colors"
        aria-label="Anteprima immagine carta"
        title={fullImage ? `Anteprima: ${hit.name}` : 'Immagine non disponibile'}
      >
        <Camera className="w-4 h-4" />
      </button>

      <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded bg-[#E8E8E8]" title={setName}>
        {setIcon ? (
          <img src={setIcon} alt="" className="w-5 h-5 object-contain" loading="lazy" />
        ) : setCode ? (
          <span className="text-[10px] font-bold text-gray-600">{setCode.slice(0, 2)}</span>
        ) : (
          <span className="text-[10px] font-bold text-gray-400">—</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-medium text-[#333333] group-hover:text-orange-600 truncate transition-colors" title={hit.name}>
            {titleType === 'english' && (
              <Highlight hit={hit as Parameters<typeof Highlight>[0]['hit']} attribute="name" />
            )}
            {titleType === 'localized' && title != null && (
              hasBackendHighlight ? (
                <RenderHighlightedText value={title} />
              ) : (
                <HighlightQueryInText text={plainTitle || title} query={searchQuery} />
              )
            )}
            {titleType === 'fallback' && title != null && (
              searchQuery.trim() ? (
                <HighlightQueryInText text={title} query={searchQuery} />
              ) : (
                <span>{title}</span>
              )
            )}
          </span>
          {hit.collector_number != null && hit.collector_number !== '' && (
            <span className="flex-shrink-0 text-[#333333] font-medium text-sm">{hit.collector_number}</span>
          )}
        </div>
        {subtitle && (
          <div className="text-sm text-[#777777] truncate mt-0.5">{subtitle}</div>
        )}
      </div>

      <div
        className={`flex-shrink-0 text-xs md:text-sm text-[#777777] ${(hit.type ?? 'Singles') !== 'Singles' ? 'italic' : ''}`}
      >
        {hit.type ?? 'Singles'}
      </div>
    </div>
  );
}

/**
 * Slug/ID per la navigazione a /products/[slug].
 * Se l'id è già un id documento Meilisearch (mtg_123, op_456, pk_789, sealed_10) lo usa così com'è,
 * così la pagina dettaglio carica i dati da Meilisearch.
 */
function getCardSlugForUrl(hit: CardSearchHit): string {
  const raw = (hit.id ?? hit.card_print_id ?? hit.objectID ?? '').toString().trim();
  if (/^(mtg|pk|op|sealed)_\d+$/.test(raw)) {
    return raw;
  }
  return generateSlug(hit.name ?? '');
}

function SearchResultsDropdown({
  gameSlug,
  onSelect,
  containerRef,
  anchorRef,
  inputValue,
  productCategory,
  position: dropdownPosition = 'bottom',
  isTyping = false,
  typingKey = 0,
  rowDelay = 80,
  energyLevel = 0,
  typingVelocity = 0,
  streak = 0,
}: {
  gameSlug: GameSlug;
  onSelect: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  /** Valore attuale dell'input (per mostrare suggerimenti subito mentre digiti, prima che query InstantSearch si aggiorni) */
  inputValue?: string;
  productCategory: CategoryKey | null;
  position?: 'top' | 'bottom';
  isTyping?: boolean;
  typingKey?: number;
  rowDelay?: number;
  energyLevel?: number;
  typingVelocity?: number;
  streak?: number;
}) {
  const router = useRouter();
  const { query, isSearchStalled } = useSearchBox();
  const { hits } = useHits();
  const [inlinePreview, setInlinePreview] = useState<{
    url: string;
    name: string;
    rect: DOMRect;
  } | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    if (!anchorRef.current) return;
    const update = () => {
      if (anchorRef.current) {
        const rect = anchorRef.current.getBoundingClientRect();
        if (dropdownPosition === 'top') {
          // Dropdown sopra la barra
          setPosition({ top: rect.top, left: rect.left, width: rect.width });
        } else {
          // Dropdown sotto la barra (default)
          setPosition({ top: rect.bottom, left: rect.left, width: rect.width });
        }
      }
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [anchorRef, query, dropdownPosition]);

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

  const queryTrimmed = (query ?? '').trim();
  const inputTrimmed = (inputValue ?? '').trim();
  const hasQuery = queryTrimmed.length > 0 || inputTrimmed.length > 0;
  const hasHits = hits.length > 0;

  if (!position) return null;

  const dropdownContent = (
    <>
      <div
        ref={containerRef as React.Ref<HTMLDivElement>}
        className={`bg-white rounded-none border border-gray-200 max-h-[400px] overflow-hidden min-h-[80px] flex flex-col ${
          dropdownPosition === 'top'
            ? 'border-b-0 shadow-[0_-4px_12px_rgba(0,0,0,0.12)]'
            : 'border-t-0 shadow-[0_4px_12px_rgba(0,0,0,0.12)]'
        }`}
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          width: position.width,
          zIndex: 1001,
        }}
        role="listbox"
        aria-label="Suggerimenti ricerca"
      >
        {isSearchStalled ? (
          <div className="flex items-center justify-center gap-2 px-4 py-6 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Ricerca in corso...</span>
          </div>
        ) : !hasQuery ? (
          <div className="px-4 py-4 text-sm text-gray-500">Digita per cercare carte</div>
        ) : hasHits ? (
          <>
            <div
              className="overflow-y-auto flex-1"
              onScroll={() => setInlinePreview(null)}
            >
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
                    router.push(`/products/${slug}`);
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
                router.push(buildSearchUrl(q, gameSlug, productCategory));
                onSelect();
              }}
              className="w-full py-4 text-center text-base font-medium text-[#0f172a] bg-[#F8F8F8] rounded-none hover:bg-[#EEEEEE] transition-colors"
            >
              Mostra tutti i risultati (<AnimatedCounter value={hits.length} />+)
            </button>
          </>
        ) : (
          <div className="px-4 py-4 text-sm text-gray-500">Nessun risultato trovato</div>
        )}
      </div>

      {inlinePreview &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed z-[1100] rounded-lg shadow-xl border border-gray-200 bg-white overflow-hidden"
            style={{
              left: inlinePreview.rect.left,
              top: inlinePreview.rect.bottom + 4,
              width: INLINE_PREVIEW_WIDTH,
            }}
            onMouseEnter={cancelClose}
            onMouseLeave={() => setInlinePreview(null)}
            role="img"
            aria-label={`Anteprima: ${inlinePreview.name}`}
          >
            <img
              src={inlinePreview.url}
              alt={inlinePreview.name}
              className="w-full h-auto block"
              loading="lazy"
              draggable={false}
            />
          </div>,
          document.body
        )}
    </>
  );

  return typeof document !== 'undefined' ? createPortal(dropdownContent, document.body) : null;
}

/** Corpo del pannello: input "Digita per cercare carte" + lista risultati (stile Figma) */
function SearchPanelBody({
  inputRef,
  onEnter,
  onSelectResult,
  selectedGame,
  productCategory,
  hideInput = false,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onEnter: () => void;
  onSelectResult: () => void;
  selectedGame: GameSlug | null;
  productCategory: CategoryKey | null;
  /** Se true, non mostrare l'input nel pannello (si scrive nella barra) */
  hideInput?: boolean;
}) {
  const router = useRouter();
  const { query, refine, isSearchStalled } = useSearchBox();
  const { hits } = useHits();
  const [localValue, setLocalValue] = useState(query ?? '');
  const [inlinePreview, setInlinePreview] = useState<{ url: string; name: string; rect: DOMRect } | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(query ?? '');
  }, [query]);

  const hasQuery = (query ?? '').trim().length > 0;
  const hasHits = hits.length > 0;

  const showInlinePreview = (url: string, name: string, buttonRect: DOMRect) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = null;
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

  return (
    <>
      {!hideInput && (
        <div className="search-panel-input-wrap mx-4 mt-2 mb-1 px-4 py-2">
          <input
            ref={inputRef as React.Ref<HTMLInputElement>}
            type="text"
            value={localValue}
            onChange={(e) => {
              const v = e.target.value;
              setLocalValue(v);
              refine(v);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onEnter();
              }
            }}
            placeholder="Digita per cercare carte"
            className="w-full border-0 bg-transparent py-2 pl-1 text-base outline-none search-input-orange-placeholder"
            aria-label="Cerca carte"
            autoComplete="off"
          />
        </div>
      )}
      {hideInput && <div className="pt-1" />}
      {isSearchStalled && (
        <div className="flex items-center justify-center gap-2 px-4 py-4 text-white/70">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Ricerca in corso...</span>
        </div>
      )}
      {!isSearchStalled && !hasQuery && <div className="min-h-[24px]" />}
      {!selectedGame && (
        <div className="px-4 py-3 text-sm text-white/60">Seleziona un gioco (Categorie) per cercare</div>
      )}
      {!isSearchStalled && hasQuery && !hasHits && selectedGame && (
        <div className="px-4 py-4 text-sm text-white/60">Nessun risultato trovato</div>
      )}
      {!isSearchStalled && hasQuery && hasHits && selectedGame && (
        <>
          <div
            className="max-h-[260px] overflow-y-auto"
            onScroll={() => setInlinePreview(null)}
          >
            {hits.map((hit, index) => (
              <CardHit
                key={(hit as CardSearchHit).id ?? (hit as CardSearchHit).objectID ?? index}
                hit={hit as unknown as CardSearchHit}
                index={index}
                gameSlug={selectedGame}
                searchQuery={query ?? ''}
                onNavigate={() => {
                  const slug = getCardSlugForUrl(hit as unknown as CardSearchHit);
                  router.push(`/products/${slug}`);
                  onSelectResult();
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
              if (q) router.push(buildSearchUrl(q, selectedGame, productCategory));
              onSelectResult();
            }}
            className="w-full py-4 text-center text-base font-medium text-white bg-white/10 hover:bg-[#ff7300]/30 transition-colors rounded-none"
          >
            Mostra tutti i risultati ({hits.length}+)
          </button>
        </>
      )}
      {inlinePreview &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed z-[1100] rounded-lg border border-gray-200 bg-white shadow-xl overflow-hidden"
            style={{
              left: inlinePreview.rect.left,
              top: inlinePreview.rect.bottom + 4,
              width: INLINE_PREVIEW_WIDTH,
            }}
            onMouseEnter={cancelClose}
            onMouseLeave={() => setInlinePreview(null)}
            role="img"
            aria-label={`Anteprima: ${inlinePreview.name}`}
          >
            <img
              src={inlinePreview.url}
              alt={inlinePreview.name}
              className="block h-auto w-full"
              loading="lazy"
              draggable={false}
            />
          </div>,
          document.body
        )}
    </>
  );
}

function SearchSubmitButton({
  selectedGame,
  productCategory,
  variant = 'default',
}: {
  selectedGame: GameSlug | null;
  productCategory?: CategoryKey | null;
  variant?: 'default' | 'pill' | 'panel';
}) {
  const router = useRouter();
  const { query } = useSearchBox();

  const handleSubmit = () => {
    const searchQuery = (query ?? '').trim();
    if (!searchQuery) return;
    const active = typeof document !== 'undefined' ? document.activeElement : null;
    if (active instanceof HTMLElement) active.blur();
    
    router.push(buildSearchUrl(searchQuery, selectedGame, productCategory));
  };

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleSubmit}
        className="flex shrink-0 items-center justify-center rounded-r-[50px] w-12 h-full text-gray-700 hover:text-gray-900 hover:bg-gray-200/60 z-10 transition-colors"
        aria-label="Cerca e vai ai risultati"
      >
        <Search className="w-5 h-5" strokeWidth={2} />
      </button>
    );
  }

  if (variant === 'panel') {
    return (
      <button
        type="button"
        onClick={handleSubmit}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-200/60"
        aria-label="Cerca"
      >
        <Search className="h-5 w-5" strokeWidth={2} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSubmit}
      className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 rounded-md w-7 h-7 flex items-center justify-center z-10 transition-colors"
      aria-label="Cerca e vai ai risultati"
    >
      <Search className="w-3.5 h-3.5 text-white" />
    </button>
  );
}

/** Bottone "Categorie" in stile Figma (grigio, testo + chevron) */
function CategorieButton({
  selectedGame,
  onSelect,
  gameDisplayName,
}: {
  selectedGame: GameSlug | null;
  onSelect: (game: GameSlug | null) => void;
  gameDisplayName: (slug: GameSlug | null) => string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="flex items-center gap-1.5 rounded-[50px] border-0 bg-transparent px-3 py-0 text-sm text-white/90 font-sans"
      >
        <span className="leading-none">{selectedGame ? gameDisplayName(selectedGame) : 'Categorie'}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="categorie-dropdown absolute top-full left-0 z-[1002] mt-1 min-w-[140px] overflow-hidden shadow-lg">
          {GAME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(opt.value);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium font-sans"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  opt.value === 'mtg' ? 'bg-violet-500' : opt.value === 'pokemon' ? 'bg-amber-500' : 'bg-red-500'
                }`}
              />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Bottone "Categorie Prodotto" — usa CATEGORY_MAPPING (category_key) per filtrare correttamente */
function ProductCategoryButton({
  selectedCategory,
  onSelect,
  gameSlug,
  isBarOpen = false,
}: {
  selectedCategory: CategoryKey | null;
  onSelect: (cat: CategoryKey | null) => void;
  gameSlug: MappingGameSlug | null;
  isBarOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Categorie disponibili per il gioco selezionato
  const availableKeys = useMemo(() => {
    if (!gameSlug) return CATEGORY_KEY_ORDER;
    return getCategoryKeys(gameSlug);
  }, [gameSlug]);

  // Posiziona il dropdown sopra o sotto il bottone in base al contesto
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    if (isBarOpen) {
      // Barra sticky in basso: dropdown sopra il bottone
      setPos({ top: rect.top - 4, left: rect.left });
    } else {
      // Barra normale: dropdown sotto il bottone
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [open, isBarOpen]);

  // Chiudi cliccando fuori
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t)) return;
      if (dropdownRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Label corrente
  const currentLabel = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') return 'Tutte';
    if (gameSlug) return getCategoryLabel(gameSlug, selectedCategory as CategoryKey, 'it') || selectedCategory;
    // Fallback label lookup
    const labelMap: Record<string, string> = {
      singles: 'Carte singole', boosters: 'Booster', booster_box: 'Booster box',
      starter_precon: 'Mazzi precostruiti', bundle_set: 'Bundle e set',
      tins: 'Tin box', accessori: 'Accessori', collezionabili: 'Collezionabili',
    };
    return labelMap[selectedCategory] || selectedCategory;
  }, [selectedCategory, gameSlug]);

  // Label breve per mobile (parole singole complete, composite troncate)
  const mobileLabel = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') return 'Tutte';
    const shortMap: Record<string, string> = {
      singles: 'Carte', boosters: 'Booster', booster_box: 'Box',
      starter_precon: 'Mazzi', bundle_set: 'Bundle', tins: 'Tin box',
      accessori: 'Accessori', collezionabili: 'Collezionabili',
    };
    return shortMap[selectedCategory] || currentLabel.slice(0, 6);
  }, [selectedCategory, currentLabel]);

  const dropdownMenu = open && pos && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={dropdownRef}
          className={`fixed z-[1100] min-w-[180px] max-w-[220px] overflow-hidden shadow-xl rounded-lg bg-white border border-gray-100 py-1 ${
            isBarOpen ? 'border-b-0' : 'border-t-0'
          }`}
          style={{ top: pos.top, left: pos.left }}
        >
          {availableKeys.map((key) => {
            const label = gameSlug
              ? getCategoryLabel(gameSlug, key, 'it')
              : key;
            return (
              <button
                key={key}
                type="button"
                onClick={(e) => { e.stopPropagation(); onSelect(key === 'all' ? null : key); setOpen(false); }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium font-sans hover:bg-[#FF7300]/10 transition-colors ${
                  (selectedCategory === key || (!selectedCategory && key === 'all'))
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
          setOpen((o) => !o);
        }}
        className={`flex items-center gap-1 md:gap-1.5 h-full rounded-full border backdrop-blur-sm text-xs md:text-sm font-medium font-sans leading-none transition-all duration-200 ease-out active:scale-[0.98] whitespace-nowrap min-w-[5.5rem] md:min-w-0 ${
          isBarOpen
            ? 'border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200 hover:border-gray-400 pl-0 pr-0 md:pl-0 md:pr-0'
            : 'border-white/20 bg-white/10 text-white hover:bg-white/15 hover:border-white/30 pl-2.5 pr-2.5 md:pl-3 md:pr-4'
        }`}
      >
        <span className="hidden md:inline leading-none text-left">{currentLabel}</span>
        <span className="md:hidden leading-none">{mobileLabel}</span>
        <ChevronDown
          className={`h-3 w-3 md:h-4 md:w-4 transition-transform ${
            isBarOpen
              ? (open ? 'rotate-0' : 'rotate-180')   // Barra in basso: chiuso=su, aperto=giù (verso dropdown sopra)
              : (open ? 'rotate-180' : 'rotate-0')   // Barra in alto: chiuso=giù, aperto=su (verso dropdown sotto)
          }`}
        />
      </button>
      {dropdownMenu}
    </>
  );
}

const ROTATING_WORDS = [
  'carte singole...',
  'boosters...',
  'espansioni...',
  'mazzi precostruiti...',
  'Pokémon...',
  'Magic...',
  'One Piece...',
  'accessori...',
  'carte rare...',
  'booster box...',
];

const TYPE_SPEED = 60;
const DELETE_SPEED = 35;
const PAUSE_AFTER_TYPE = 2200;
const PAUSE_AFTER_DELETE = 400;

function AnimatedSearchPlaceholder({ visible, isDark }: { visible: boolean; isDark: boolean }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tick = useCallback(() => {
    const currentWord = ROTATING_WORDS[wordIndex];

    if (!isDeleting) {
      const nextText = currentWord.slice(0, displayText.length + 1);
      setDisplayText(nextText);

      if (nextText === currentWord) {
        timeoutRef.current = setTimeout(() => setIsDeleting(true), PAUSE_AFTER_TYPE);
        return;
      }
      timeoutRef.current = setTimeout(tick, TYPE_SPEED);
    } else {
      const nextText = currentWord.slice(0, displayText.length - 1);
      setDisplayText(nextText);

      if (nextText === '') {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
        timeoutRef.current = setTimeout(tick, PAUSE_AFTER_DELETE);
        return;
      }
      timeoutRef.current = setTimeout(tick, DELETE_SPEED);
    }
  }, [wordIndex, displayText, isDeleting]);

  useEffect(() => {
    if (!visible) return;
    timeoutRef.current = setTimeout(tick, TYPE_SPEED);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [tick, visible]);

  // Reset animation when becoming visible again
  useEffect(() => {
    if (visible) return;
    // Reset state when hidden so it starts fresh next time
    return () => {
      setDisplayText('');
      setIsDeleting(false);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-center px-3 py-0 md:px-4 md:py-2.5 text-[16px] leading-normal md:text-sm font-sans select-none transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      <span className={`mr-1.5 ${isDark ? 'text-gray-400' : 'text-white/50'}`}>
        Cerca
      </span>
      <span className="text-[#FF7300]">
        {displayText}
      </span>
      <span
        className={`inline-block w-[2px] h-[1.1em] ml-[1px] align-middle animate-blink-caret ${
          isDark ? 'bg-[#FF7300]' : 'bg-[#FF7300]/80'
        }`}
      />
    </div>
  );
}

function SearchWithInstantSearch({
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
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownDismissed, setDropdownDismissed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownContainerRef = useRef<HTMLDivElement>(null);
  const { query, refine } = useSearchBox();
  const refineRef = useRef(refine);
  const searchParams = useSearchParams();
  const urlQueryParam = (searchParams.get('q') ?? '').trim();
  const [localValue, setLocalValue] = useState(query ?? '');
  const hasText = (localValue ?? '').trim().length > 0;
  const mappedGame = useMemo(() => normalizeGameSlug(selectedGame), [selectedGame]);

  // Rainbow Road: track whether user is actively typing + adaptive speed
  const [isTyping, setIsTyping] = useState(false);
  const [typingKey, setTypingKey] = useState(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKeystrokeRef = useRef<number>(0);
  const [rowDelay, setRowDelay] = useState(80);
  
  // Gamification: typing velocity and energy system
  const [typingVelocity, setTypingVelocity] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(0);
  const [streak, setStreak] = useState(0);
  const keystrokeTimesRef = useRef<number[]>([]);
  const energyDecayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const pathname = usePathname();
  const isProductsPage = pathname.startsWith('/products') || pathname.startsWith('/search') || pathname === '/';
  
  // Notifica il cambio di stato apertura/chiusura

  // Notifica il cambio di stato apertura/chiusura
  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

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
    if (hasText) setDropdownDismissed(false);
  }, [hasText]);

  const handleEnter = () => {
    const searchQuery = (localValue ?? '').trim();
    refine(searchQuery);
    inputRef.current?.blur();
    closePanel();
    router.push(buildSearchUrl(searchQuery, selectedGame, productCategory));
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
  const closePanel = () => {
    setIsOpen(false);
    setDropdownDismissed(true);
  };

  const handleCategorySelect = useCallback(
    (nextCategory: CategoryKey | null) => {
      const normalizedCategory = normalizeCategoryKey(nextCategory);
      setProductCategory(normalizedCategory);
      const currentQuery = (localValue ?? query ?? urlQueryParam ?? '').trim();
      if (!currentQuery) return;
      refineRef.current(currentQuery);
      inputRef.current?.blur();
      closePanel();
      router.push(buildSearchUrl(currentQuery, selectedGame, normalizedCategory));
    },
    [localValue, query, router, selectedGame, setProductCategory, urlQueryParam]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || dropdownContainerRef.current?.contains(target)) return;
      closePanel();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dropdown (autocomplete): visibile quando (pannello aperto O c'è testo digitato) e non chiuso con click fuori
  const showDropdown = selectedGame && (isOpen || hasText) && !dropdownDismissed;
  const dropdownContent = showDropdown ? (
    <SearchResultsDropdown
      gameSlug={selectedGame}
      onSelect={closePanel}
      containerRef={dropdownContainerRef}
      anchorRef={triggerRef}
      inputValue={localValue}
      productCategory={productCategory}
      isTyping={isTyping}
      typingKey={typingKey}
      rowDelay={rowDelay}
      energyLevel={energyLevel}
      typingVelocity={typingVelocity}
      streak={streak}
    />
  ) : null;

  // Stile "aperto" (bianco, bordo): barra bianca quando aperta o quando c'è testo
  const showOpenStyle = Boolean(isOpen || hasText);
  const triggerBar = (
    <div
      ref={triggerRef}
      className={`search-container flex w-full min-w-[200px] flex-1 items-stretch gap-0 overflow-hidden transition-[background-color,border-color,border-radius] duration-200 h-11 min-h-11 max-h-11 md:h-auto md:min-h-0 md:max-h-none ${
        showOpenStyle
          ? 'search-container--open rounded-none bg-white'
          : 'rounded-[50px]'
      }`}
      style={{ zIndex: 1000 }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Menu a tendina Categorie Prodotto visibile sempre */}
      <div className="flex items-center justify-center pl-0 pr-0">
        <ProductCategoryButton
          selectedCategory={productCategory}
          onSelect={handleCategorySelect}
          gameSlug={mappedGame}
          isBarOpen={showOpenStyle}
        />
      </div>

      <div className="relative min-h-0 min-w-0 flex-1">
        <AnimatedSearchPlaceholder
          visible={!hasText}
          isDark={showOpenStyle}
        />
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={(e) => {
            const v = e.target.value;
            setLocalValue(v);
            refine(v);
            // Rainbow Road: trigger typing wave with adaptive speed
            const now = Date.now();
            const gap = now - lastKeystrokeRef.current;
            lastKeystrokeRef.current = now;
            // Clamp: fast typing (gap < 80ms) → 30ms delay, slow (gap > 400ms) → 120ms
            const adaptive = gap > 0 && gap < 600
              ? Math.round(30 + (90 * Math.min(Math.max(gap - 60, 0), 340)) / 340)
              : 80;
            setRowDelay(adaptive);
            setIsTyping(true);
            setTypingKey((k) => k + 1);
            
            // Gamification: typing velocity and energy
            keystrokeTimesRef.current = keystrokeTimesRef.current.filter(t => now - t < 1000);
            keystrokeTimesRef.current.push(now);
            const velocity = Math.min(keystrokeTimesRef.current.length / 8, 1);
            setTypingVelocity(velocity);
            setEnergyLevel(prev => Math.min(prev + 0.12, 1));
            setStreak(prev => Math.min(prev + 1, 15));
            if (energyDecayRef.current) clearTimeout(energyDecayRef.current);
            energyDecayRef.current = setTimeout(() => {
              setEnergyLevel(prev => Math.max(prev - 0.08, 0));
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
  );

  return (
    <>
      {triggerBar}
      {dropdownContent}
    </>
  );
}

export default function GlobalSearchBar({ onOpenChange }: { onOpenChange?: (isOpen: boolean) => void }) {
  const { selectedGame, setSelectedGame, gameDisplayName } = useGame();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Categoria di default: 'singles' (come richiesto)
  const [productCategory, setProductCategory] = useState<CategoryKey | null>(() => {
    if (typeof window === 'undefined') return 'singles';
    const params = new URLSearchParams(window.location.search);
    const catKey = normalizeCategoryKey(params.get('category_key'));
    if (catKey) return catKey;
    const pathParts = pathname.split('/');
    const pathCategory = pathParts[2] ?? '';
    if (CATEGORY_SLUGS.has(pathCategory)) {
      const normalizedPathCategory = normalizeCategoryKey(pathCategory);
      if (normalizedPathCategory) return normalizedPathCategory;
    }
    return 'singles';
  });

  useEffect(() => {
    const fromQuery = normalizeCategoryKey(searchParams.get('category_key'));
    if (fromQuery) {
      setProductCategory((prev) => (prev === fromQuery ? prev : fromQuery));
      return;
    }
    const pathParts = pathname.split('/');
    const pathCategory = pathParts[2] ?? '';
    if (!CATEGORY_SLUGS.has(pathCategory)) return;
    const fromPath = normalizeCategoryKey(pathCategory);
    if (!fromPath) return;
    setProductCategory((prev) => (prev === fromPath ? prev : fromPath));
  }, [pathname, searchParams]);

  // Normalizza game slug per CATEGORY_MAPPING
  const mappingGameSlug = useMemo(() => normalizeGameSlug(selectedGame), [selectedGame]);

  const gameFilter = useMemo(() => {
    if (!selectedGame) return undefined;
    const realSlug = FRONTEND_TO_DB_SLUG[selectedGame] ?? selectedGame;
    return [`game_slug = "${realSlug}"`];
  }, [selectedGame]);

  // Filtro category_id basato su CATEGORY_MAPPING (fix: prima non filtrava per categoria)
  const categoryFilter = useMemo(() => {
    const normalizedCategory = normalizeCategoryKey(productCategory);
    if (!normalizedCategory || normalizedCategory === 'all') return [];
    const ids = mappingGameSlug
      ? getCategoryIds(mappingGameSlug, normalizedCategory)
      : getCategoryIdsAcrossGames(normalizedCategory);
    if (ids.length === 0) return [];
    if (ids.length === 1) return [`category_id = ${ids[0]}`];
    // Meilisearch InstantSearch: usa filter string format
    return [`category_id IN [${ids.join(', ')}]`];
  }, [mappingGameSlug, productCategory]);

  const allFilters = useMemo(() => {
    const filters: string[] = [];
    if (gameFilter) filters.push(...gameFilter);
    if (categoryFilter.length > 0) filters.push(...categoryFilter);
    return filters.length > 0 ? filters : undefined;
  }, [gameFilter, categoryFilter]);

  return (
    <div
      className="flex w-full justify-center py-0 z-[99] font-sans h-full min-h-0"
      style={{
        backgroundColor: '#1D3160',
        overflow: 'visible',
      }}
    >
      <div
        className="flex min-h-0 w-full min-w-0 flex-1 flex-row items-center gap-2 md:gap-3"
        style={{ position: 'relative', overflow: 'visible' }}
      >
        <div className="flex min-h-0 w-full min-w-0 flex-1">
          <InstantSearch
            searchClient={searchClient}
            indexName={MEILISEARCH.indexName}
            future={{ preserveSharedStateOnUnmount: true }}
          >
            <Configure filters={allFilters?.join(' AND ')} hitsPerPage={8} />
            <SearchWithInstantSearch
              selectedGame={selectedGame}
              productCategory={productCategory}
              setProductCategory={setProductCategory}
              onOpenChange={onOpenChange}
            />
          </InstantSearch>
        </div>
      </div>
    </div>
  );
}
