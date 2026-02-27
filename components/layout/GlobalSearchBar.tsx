'use client';

/**
 * GlobalSearchBar - Game-First UX con Meilisearch (stesso stile e funzionalità di frontend-vecchio)
 * Ricerca 100% server-side su Meilisearch (react-instantsearch + instant-meilisearch).
 * Input disabilitato finché non è selezionato un gioco; filtro rigoroso game_slug.
 */

import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, Loader2, X, ChevronDown, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { InstantSearch, Configure, Highlight, useSearchBox, useHits } from 'react-instantsearch';
import { searchClient } from '@/lib/meilisearchClient';
import { useLanguage, LANGUAGE_NAMES } from '@/lib/contexts/LanguageContext';
import { useGame, GAME_OPTIONS, type GameSlug } from '@/lib/contexts/GameContext';
import { MEILISEARCH } from '@/lib/config';
import { getCardImageUrl } from '@/lib/assets';
import { generateSlug } from '@/lib/mock-cards';

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

/** Costruisce URL pagina risultati; game in query = slug DB (per /api/search e Meilisearch). */
function buildSearchUrl(q: string, game?: GameSlug | null): string {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (game) params.set('game', FRONTEND_TO_DB_SLUG[game] ?? game);
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

  useEffect(() => {
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
            ? 'w-full min-w-0 px-5 py-2.5 pr-12 text-base border-0 bg-transparent rounded-l-[50px] outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:ring-0 focus:ring-offset-0 placeholder:text-[rgba(3,3,3,0.7)] text-[rgba(3,3,3,0.9)]'
            : 'w-full px-4 py-2 pr-16 text-sm md:text-[14px] border border-gray-200 rounded-lg outline-none transition-all duration-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:ring-opacity-30 placeholder-gray-400 bg-gray-50 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed text-gray-900'
        }
        style={
          isPill
            ? { fontSize: '16px' }
            : {
                borderRadius: isOpen && hasResults ? '10px 10px 0 0' : '10px',
                borderBottom: isOpen && hasResults ? 'none' : undefined,
                fontSize: '16px',
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
}: {
  hit: CardSearchHit;
  index: number;
  gameSlug: GameSlug;
  onNavigate: () => void;
  onShowInlinePreview: (url: string, name: string, buttonRect: DOMRect) => void;
  onScheduleClose?: () => void;
  searchQuery: string;
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
      {/* Barra arancione a sinistra al hover (stile Cardmarket) */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-l-sm"
        aria-hidden
      />
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
}: {
  gameSlug: GameSlug;
  onSelect: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  /** Valore attuale dell'input (per mostrare suggerimenti subito mentre digiti, prima che query InstantSearch si aggiorni) */
  inputValue?: string;
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
        setPosition({ top: rect.bottom, left: rect.left, width: rect.width });
      }
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [anchorRef, query]);

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
        className="bg-white rounded-none border border-gray-200 border-t-0 max-h-[400px] overflow-hidden min-h-[80px] flex flex-col shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
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
                if (q) router.push(buildSearchUrl(q, gameSlug));
                onSelect();
              }}
              className="w-full py-4 text-center text-base font-medium text-[#0f172a] bg-[#F8F8F8] rounded-none hover:bg-[#EEEEEE] transition-colors"
            >
              Mostra tutti i risultati ({hits.length}+)
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
  hideInput = false,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onEnter: () => void;
  onSelectResult: () => void;
  selectedGame: GameSlug | null;
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
            className="w-full border-0 bg-transparent py-2 pl-1 text-base outline-none"
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
              if (q) router.push(buildSearchUrl(q, selectedGame));
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
  variant = 'default',
}: {
  selectedGame: GameSlug | null;
  variant?: 'default' | 'pill' | 'panel';
}) {
  const router = useRouter();
  const { query } = useSearchBox();

  const handleSubmit = () => {
    const searchQuery = (query ?? '').trim();
    if (searchQuery) {
      router.push(buildSearchUrl(searchQuery, selectedGame));
    }
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
        className="flex items-center gap-1.5 rounded-[50px] border-0 bg-transparent px-3 py-1.5 text-sm text-white/90 font-sans"
      >
        <span>{selectedGame ? gameDisplayName(selectedGame) : 'Categorie'}</span>
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

function SearchWithInstantSearch({
  selectedGame,
}: {
  selectedGame: GameSlug | null;
  setSelectedGame: (g: GameSlug | null) => void;
  gameDisplayName: (slug: GameSlug | null) => string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownDismissed, setDropdownDismissed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownContainerRef = useRef<HTMLDivElement>(null);
  const { query, refine } = useSearchBox();
  const [localValue, setLocalValue] = useState(query ?? '');
  const hasText = (localValue ?? '').trim().length > 0;

  useEffect(() => {
    setLocalValue(query ?? '');
  }, [query]);

  useEffect(() => {
    if (hasText) setDropdownDismissed(false);
  }, [hasText]);

  const handleEnter = () => {
    const searchQuery = (query ?? '').trim();
    if (searchQuery) {
      router.push(buildSearchUrl(searchQuery, selectedGame));
      closePanel();
    }
  };

  const openPanel = () => {
    setIsOpen(true);
    setDropdownDismissed(false);
  };
  const closePanel = () => {
    setIsOpen(false);
    setDropdownDismissed(true);
  };

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
    />
  ) : null;

  // Stile "aperto" (bianco, bordo): barra bianca quando aperta o quando c'è testo
  const showOpenStyle = selectedGame && (isOpen || hasText);
  const triggerBar = (
    <div
      ref={triggerRef}
      className={`search-container flex min-w-[200px] flex-1 items-center gap-0 overflow-hidden w-full transition-[background-color,border-color,border-radius] duration-200 ${
        showOpenStyle
          ? 'search-container--open rounded-none bg-white'
          : 'rounded-[50px]'
      }`}
      style={{ zIndex: 1000 }}
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => {
          const v = e.target.value;
          setLocalValue(v);
          refine(v);
        }}
        onFocus={openPanel}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleEnter();
          }
        }}
        placeholder="Cerca carte..."
        className={`min-w-0 flex-1 border-0 bg-transparent px-4 py-2.5 text-base outline-none font-sans transition-colors duration-200 ${
          showOpenStyle
            ? 'text-gray-900 placeholder:text-gray-500'
            : 'placeholder:text-white/30 text-white'
        }`}
        aria-label="Cerca carte"
        autoComplete="off"
      />
      <div className="search-right flex flex-shrink-0 items-center pr-2" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={handleEnter}
          className={`search-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
            showOpenStyle
              ? 'text-[#FF7300] hover:bg-orange-50 hover:text-orange-600'
              : 'text-white hover:bg-white/20'
          }`}
          aria-label="Cerca"
        >
          <Search className="h-5 w-5" strokeWidth={2} />
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

export default function GlobalSearchBar() {
  const { selectedGame, setSelectedGame, gameDisplayName } = useGame();

  const gameFilter = useMemo(() => {
    if (!selectedGame) return undefined;
    // Filtro Meilisearch: game_slug = slug della tabella games (mtg, pokemon, one-piece).
    const realSlug = FRONTEND_TO_DB_SLUG[selectedGame] ?? selectedGame;
    return [`game_slug:${realSlug}`];
  }, [selectedGame]);

  return (
    <div
      className="w-full flex justify-center items-stretch py-0 z-[99] font-sans"
      style={{
        backgroundColor: '#1D3160',
        overflow: 'visible',
      }}
    >
      <div
        className="w-full flex-1 min-w-0 flex items-center gap-2 md:gap-3 flex-row"
        style={{ position: 'relative', overflow: 'visible' }}
      >
        <div className="flex-1 min-w-0 flex">
          <InstantSearch
            searchClient={searchClient}
            indexName={MEILISEARCH.indexName}
            future={{ preserveSharedStateOnUnmount: true }}
          >
            <Configure facetFilters={gameFilter} hitsPerPage={8} />
            <SearchWithInstantSearch
              selectedGame={selectedGame}
              setSelectedGame={setSelectedGame}
              gameDisplayName={gameDisplayName}
            />
          </InstantSearch>
        </div>
      </div>
    </div>
  );
}
