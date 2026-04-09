'use client';

/**
 * Pagina risultati ricerca – layout come screenshot BRX:
 * Breadcrumb, filtri (Categoria, Edizione, Rarità, Nome), vista Lista/Griglia, paginazione.
 * Dati da API /api/search (Meilisearch).
 * Nome: in lingua selezionata (principale) e sotto in inglese se lingua !== en.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Rows3,
  Grid2x2,
  SlidersHorizontal,
  X,
  Camera,
} from 'lucide-react';
import { getCardImageUrl } from '@/lib/assets';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { getMessage } from '@/lib/i18n/getMessage';
import { DEFAULT_LOCALE } from '@/lib/i18n/locales';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { SearchHit } from '@/app/api/search/route';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import {
  type GameSlug,
  type CategoryKey,
  normalizeGameSlug,
  normalizeCategoryKey,
  getCategoryIds,
  getCategoryIdsAcrossGames,
  getCategoryKeys,
  getCategoryLabel,
  mapCategoryIdToKey,
  isValidCategoryKey,
  GAME_TO_MEILISEARCH,
  CATEGORY_KEY_ORDER,
  FRONTEND_TO_GAME_SLUG,
} from '@/lib/search/category-mapping';

const BACKEND_LANG_ORDER = ['en', 'de', 'es', 'fr', 'it', 'pt'] as const;
type SupportedLang = (typeof BACKEND_LANG_ORDER)[number];

function normalizeLang(lang: string): SupportedLang {
  return BACKEND_LANG_ORDER.includes(lang as SupportedLang) ? (lang as SupportedLang) : 'en';
}

/** Restituisce il nome nella lingua richiesta da keywords_localized (ordine: en, de, es, fr, it, pt). */
function getLocalizedName(keywords: string[] | undefined, lang: string): string | null {
  if (!keywords?.length) return null;
  const l = normalizeLang(lang);
  const idx = BACKEND_LANG_ORDER.indexOf(l);
  if (idx < 0 || !keywords[idx]) return null;
  const raw = keywords[idx];
  return (typeof raw === 'string' ? raw : '').trim() || null;
}

/** Nome principale (lingua corrente) e secondario (inglese, solo se lingua !== en). */
function getDisplayNames(hit: SearchHit, currentLang: string): { primary: string; secondary: string | null } {
  const primary = getLocalizedName(hit.keywords_localized, currentLang) ?? hit.name;
  const secondary = currentLang !== 'en' ? hit.name : null;
  return { primary, secondary };
}

/* GAME_TO_MEILISEARCH_LOCAL rimosso: usa FRONTEND_TO_GAME_SLUG da category-mapping.ts */

const GAME_TO_HEADER_KEY: Record<string, MessageKey> = {
  mtg: 'games.header.mtg',
  pokemon: 'games.header.pokemon',
  pk: 'games.header.pokemon',
  op: 'games.header.op',
  'one-piece': 'games.header.op',
};

type ViewMode = 'list' | 'grid';

interface SearchApiResponse {
  hits: SearchHit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const SORT_DEFS: { value: string; labelKey: MessageKey }[] = [
  { value: 'name_asc', labelKey: 'search.sort.nameAsc' },
  { value: 'name_desc', labelKey: 'search.sort.nameDesc' },
  { value: 'price_asc', labelKey: 'search.sort.priceAsc' },
  { value: 'price_desc', labelKey: 'search.sort.priceDesc' },
  { value: 'set_asc', labelKey: 'search.sort.setAsc' },
  { value: 'set_desc', labelKey: 'search.sort.setDesc' },
];

const fieldClassSheet =
  'min-h-[44px] w-full rounded-[12px] border border-gray-200 bg-[#f2f2f7] px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 [color-scheme:light] focus:outline-none focus:ring-2 focus:ring-[#5AC8FA]/30 focus:ring-offset-0 transition-colors';
const fieldClassDesktop =
  'min-h-[40px] rounded-[12px] border border-gray-200 bg-[#f2f2f7] px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 [color-scheme:light] focus:outline-none focus:ring-2 focus:ring-[#5AC8FA]/30 focus:ring-offset-0 transition-colors';

type SearchFiltersFieldsProps = {
  t: (k: MessageKey, vars?: Record<string, string | number>) => string;
  gameSlug: GameSlug | null;
  categoryKey: CategoryKey;
  edizioneInput: string;
  setEdizioneInput: (v: string) => void;
  nomeInput: string;
  setNomeInput: (v: string) => void;
  buildSearchUrl: (updates: Record<string, string>) => string;
  variant: 'desktop' | 'sheet';
  onSubmitSearch: () => void;
  onNavigate: (url: string) => void;
  onLiveChange?: (nextNomeInput: string, nextEdizioneInput: string) => void;
};

function SearchFiltersFields({
  t,
  gameSlug,
  categoryKey,
  edizioneInput,
  setEdizioneInput,
  nomeInput,
  setNomeInput,
  buildSearchUrl,
  variant,
  onSubmitSearch,
  onNavigate,
  onLiveChange,
}: SearchFiltersFieldsProps) {
  const isSheet = variant === 'sheet';
  const fc = isSheet ? fieldClassSheet : fieldClassDesktop;

  // Ottieni le categorie disponibili per il gioco corrente
  const availableKeys = useMemo(() => getCategoryKeys(gameSlug), [gameSlug]);

  const categorySelect = (
    <select
      className={`${fc} ${isSheet ? 'w-full' : 'min-w-[140px] flex-shrink-0'}`}
      value={categoryKey}
      aria-label={t('search.filterCategory')}
      disabled={!gameSlug}
      onChange={(e) => {
        const newKey = e.target.value as CategoryKey;
        onNavigate(
          buildSearchUrl({
            category_key: newKey,
            category_id: '', // Clear legacy param
            page: '1',
          })
        );
      }}
    >
      {!gameSlug && (
        <option value="">{t('search.catAll')}</option>
      )}
      {gameSlug && availableKeys.map((key) => (
        <option key={key} value={key}>
          {getCategoryLabel(gameSlug, key, 'it')}
        </option>
      ))}
    </select>
  );

  const editionInput = (
    <input
      type="text"
      placeholder={t('search.editionPlaceholder')}
      className={`${fc} ${isSheet ? 'w-full' : 'min-w-[140px] flex-shrink-0'}`}
      value={edizioneInput}
      aria-label={t('search.filterEdition')}
      onChange={(e) => {
        const v = e.target.value;
        setEdizioneInput(v);
        onLiveChange?.(nomeInput, v);
      }}
    />
  );

  const raritySelect = (
    <select
      className={`${fc} ${isSheet ? 'w-full' : 'min-w-[115px] flex-shrink-0 opacity-70 cursor-not-allowed'}`}
      disabled
      title={t('search.raritySoon')}
      aria-label={t('search.filterRarity')}
    >
      <option value="">{t('search.catAll')}</option>
    </select>
  );

  const nameInput = (
    <input
      type="text"
      placeholder={t('search.namePlaceholder')}
      className={`${fc} ${isSheet ? 'w-full' : 'flex-1 min-w-[170px]'}`}
      value={nomeInput}
      aria-label={t('search.filterName')}
      onChange={(e) => {
        const v = e.target.value;
        setNomeInput(v);
        onLiveChange?.(v, edizioneInput);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onSubmitSearch();
        }
      }}
    />
  );

  const desktopSearchButton = (
    <button
      type="button"
      onClick={onSubmitSearch}
      className="flex h-[40px] items-center justify-center gap-2 rounded-[12px] bg-[#FF7300] px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 flex-shrink-0"
    >
      <Search className="h-4 w-4" aria-hidden />
      {t('search.searchBtn')}
    </button>
  );

  if (isSheet) {
    return (
      <div className="flex flex-col gap-3">
        {categorySelect}
        {editionInput}
        {raritySelect}
        {nameInput}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      {categorySelect}
      {editionInput}
      {raritySelect}
      {nameInput}
      {desktopSearchButton}
    </div>
  );
}

type ListHoverPreviewState = { url: string; name: string; left: number; top: number };

export function SearchResults({
  query: initialQuery,
  game: initialGame,
}: {
  query: string;
  game?: string;
}) {
  const router = useRouter();
  const { selectedLang } = useLanguage();
  const { t } = useTranslation();
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);
  const tHydrationSafe = (key: MessageKey, vars?: Record<string, string | number>) =>
    hasMounted ? t(key, vars) : getMessage(DEFAULT_LOCALE, key, vars);
  const searchParams = useSearchParams();
  const q = (searchParams.get('q') ?? initialQuery ?? '').trim();
  const game = searchParams.get('game') ?? initialGame ?? '';
  const setFilter = searchParams.get('set') ?? '';
  const categoryIdLegacy = searchParams.get('category_id') ?? '';
  const categoryKeyParam = searchParams.get('category_key') ?? '';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const sortParam = searchParams.get('sort') ?? 'name_asc';

  // Normalizza game slug
  const gameSlug = useMemo(() => normalizeGameSlug(game), [game]);

  // Determina categoryKey (da URL o da category_id legacy)
  const categoryKey: CategoryKey = useMemo(() => {
    const normalizedCategory = normalizeCategoryKey(categoryKeyParam);
    if (normalizedCategory && (normalizedCategory === 'all' || isValidCategoryKey(gameSlug, normalizedCategory))) {
      return normalizedCategory;
    }
    if (categoryIdLegacy && gameSlug) {
      return mapCategoryIdToKey(gameSlug, categoryIdLegacy);
    }
    return 'singles'; // Default
  }, [categoryKeyParam, categoryIdLegacy, gameSlug]);

  // Ottieni gli ID categoria per la macro-categoria selezionata
  const categoryIds = useMemo(
    () => (gameSlug ? getCategoryIds(gameSlug, categoryKey) : getCategoryIdsAcrossGames(categoryKey)),
    [gameSlug, categoryKey]
  );

  const sortOptions = useMemo(
    () => SORT_DEFS.map(({ value, labelKey }) => ({ value, label: t(labelKey) })),
    [t]
  );

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [nomeInput, setNomeInput] = useState(q);
  const [edizioneInput, setEdizioneInput] = useState(setFilter);
  const [advancedNameMode, setAdvancedNameMode] = useState<'exact' | 'available'>('exact');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [data, setData] = useState<SearchApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [listHoverPreview, setListHoverPreview] = useState<ListHoverPreviewState | null>(null);
  const [listModalPreview, setListModalPreview] = useState<{ url: string; name: string } | null>(
    null
  );
  const [listPortalsMounted, setListPortalsMounted] = useState(false);
  const hideHoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Garantiamo che non resti uno "scroll lock" sporco da route precedenti.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    setListPortalsMounted(true);
  }, []);

  // Se l'utente passa da lista a griglia mentre un preview/modale era aperto,
  // evitiamo di lasciare body "locked" e creiamo scroll interno indesiderato.
  useEffect(() => {
    if (viewMode === 'grid') {
      setListHoverPreview(null);
      setListModalPreview(null);
      // Hard reset scroll-lock (fallback): evita casi in cui resti overflow='hidden'
      // e compare uno scroll verticale interno.
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
      }
    }
  }, [viewMode]);

  useEffect(() => {
    return () => {
      if (hideHoverTimerRef.current) clearTimeout(hideHoverTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!listModalPreview) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [listModalPreview]);

  useEffect(() => {
    if (!listModalPreview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setListModalPreview(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [listModalPreview]);

  useEffect(() => {
    setNomeInput(q);
    setEdizioneInput(setFilter);
  }, [q, setFilter]);

  const cancelHideHoverPreview = useCallback(() => {
    if (hideHoverTimerRef.current) {
      clearTimeout(hideHoverTimerRef.current);
      hideHoverTimerRef.current = null;
    }
  }, []);

  const scheduleHideHoverPreview = useCallback(() => {
    hideHoverTimerRef.current = setTimeout(() => {
      setListHoverPreview(null);
    }, 140);
  }, []);

  const handleListCameraMouseEnter = useCallback(
    (e: ReactMouseEvent<HTMLButtonElement>, url: string | null, name: string) => {
      cancelHideHoverPreview();
      if (!url || typeof window === 'undefined') return;
      if (!window.matchMedia('(hover: hover)').matches) return;
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const previewW = 208;
      const margin = 4;
      let left = rect.right + margin;
      if (left + previewW > window.innerWidth - margin) {
        left = Math.max(margin, rect.left - previewW - margin);
      }
      // Centra verticalmente la preview rispetto alla card (aspect ratio 63/88)
      const previewH = previewW * (88 / 63);
      let top = rect.top + (rect.height / 2) - (previewH / 2);
      const maxH = Math.min(window.innerHeight * 0.85, 520);
      if (top + maxH > window.innerHeight - margin) {
        top = Math.max(margin, window.innerHeight - margin - maxH);
      }
      if (top < margin) top = margin;
      setListHoverPreview({ url, name, left, top });
    },
    [cancelHideHoverPreview]
  );

  const handleListCameraClick = useCallback((e: ReactMouseEvent, url: string | null, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!url || typeof window === 'undefined') return;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const noHover = !window.matchMedia('(hover: hover)').matches;
    if (coarse || noHover) {
      setListModalPreview({ url, name });
      setListHoverPreview(null);
    }
  }, []);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    // Per "Edizione" vogliamo una classica ricerca full-text Meilisearch:
    // il valore di set + il testo del campo "Nome" (q) nella stessa query.
    const meiliQuery = [q, setFilter].filter(Boolean).join(' ').trim();
    if (meiliQuery) params.set('q', meiliQuery);
    const apiGame = game ? (FRONTEND_TO_GAME_SLUG[game] || game) : '';
    if (apiGame) params.set('game', apiGame);
    // Usa category_ids (multiplo) se disponibile, altrimenti fallback a category_id singolo
    if (categoryIds.length > 0) {
      params.set('category_ids', categoryIds.join(','));
    } else if (categoryIdLegacy) {
      params.set('category_id', categoryIdLegacy);
    }
    params.set('page', String(pageParam));
    params.set('limit', '20');
    params.set('sort', sortParam);
    try {
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
        const msg =
          (typeof j?.error === 'string' && j.error) ||
          (typeof j?.detail === 'string' && j.detail) ||
          t('search.httpError', { status: res.status });
        throw new Error(msg);
      }
      const json: SearchApiResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [q, game, setFilter, categoryIds, categoryIdLegacy, pageParam, sortParam, t]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const total = data?.total ?? 0;
  const hits = data?.hits ?? [];
  const currentPage = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;

  const gameLabel = game
    ? GAME_TO_HEADER_KEY[game]
      ? t(GAME_TO_HEADER_KEY[game])
      : game.toUpperCase()
    : '';
  const categoryLabel = getCategoryLabel(gameSlug, categoryKey, selectedLang === 'en' ? 'en' : 'it');
  const breadcrumbItems: AppBreadcrumbItem[] = [
    {
      href: '/',
      label: gameLabel || tHydrationSafe('search.breadcrumbGames'),
      isCurrent: false,
    },
    {
      label: categoryLabel,
      isCurrent: !setFilter,
    },
    ...(setFilter
      ? [
          {
            label: setFilter,
            isCurrent: true,
          },
        ]
      : []),
  ];

  const buildSearchUrl = (updates: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) p.set(k, v);
      else p.delete(k);
    });
    return `/search?${p.toString()}`;
  };

  const liveSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerLiveSearch = useCallback(
    (nextNomeInput: string, nextEdizioneInput: string) => {
      if (liveSearchTimeoutRef.current) clearTimeout(liveSearchTimeoutRef.current);
      const qVal = nextNomeInput.trim();
      const setVal = nextEdizioneInput.trim();
      liveSearchTimeoutRef.current = setTimeout(() => {
        router.replace(buildSearchUrl({ q: qVal, set: setVal, page: '1' }));
      }, 350);
    },
    [router, buildSearchUrl]
  );

  useEffect(() => {
    return () => {
      if (liveSearchTimeoutRef.current) clearTimeout(liveSearchTimeoutRef.current);
    };
  }, []);

  const handleCerca = () => {
    if (typeof document !== 'undefined') {
      const el = document.activeElement;
      if (el instanceof HTMLElement) el.blur();
    }
    const newQ = nomeInput.trim();
    const newSet = edizioneInput.trim();
    const params: Record<string, string> = { page: '1' };
    if (newQ) params.q = newQ;
    if (newSet) params.set = newSet;
    router.replace(buildSearchUrl(params));
  };

  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filtersOpen]);

  // Safety: evita casi in cui rimane attivo uno "scroll lock"
  // (causa tipica dello scroll verticale interno nella tabella).
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const shouldUnlock = !filtersOpen && !listModalPreview;
    if (!shouldUnlock) return;
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
  }, [filtersOpen, listModalPreview]);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFiltersOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtersOpen]);

  return (
    <section className="pb-12" style={{ backgroundColor: '#F5F4F0' }}>
      <div className="container-content py-6">
        {/* Breadcrumb */}
        <AppBreadcrumb
          items={breadcrumbItems}
          ariaLabel="Breadcrumb"
          variant="default"
          className="mb-2 w-auto text-sm"
        />

        {/* <h1 className="text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-wide mb-1">
          {tHydrationSafe('search.singles')}
        </h1>
        <div className="mb-6" /> */}

        {/* Mobile: pulsante Filtri + sheet; Desktop: pannello filtri completo - NASCOSTO */
        /*
        <div className="mb-4 md:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex flex-1 min-w-0 min-h-[44px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-[#f2f2f7] px-4 py-2.5 text-sm font-semibold text-[#FF7300] shadow-sm transition-colors hover:bg-orange-50/60"
{{ ... }
            >
              <SlidersHorizontal className="h-5 w-5 shrink-0" aria-hidden />
              {tHydrationSafe('search.filtersButton')}
            </button>

            <div className="flex h-[44px] w-[104px] overflow-hidden rounded-full border border-gray-200 bg-[#f2f2f7]">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label={t('search.viewList')}
                title={t('search.viewList')}
                className={`relative z-10 flex h-[44px] w-[52px] items-center justify-center transition-colors ${
                  viewMode === 'list' ? 'bg-orange-50/60 text-[#FF7300]' : 'bg-[#f2f2f7] text-gray-500'
                }`}
              >
                {viewMode === 'list' && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r bg-[#FF7300]/90 shadow-sm pointer-events-none"
                  />
                )}
                <Rows3
                  className="relative h-4 w-4 pointer-events-none"
                  aria-hidden
                />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label={t('search.viewGrid')}
                title={t('search.viewGrid')}
                className={`relative z-10 flex h-[44px] w-[52px] items-center justify-center transition-colors ${
                  viewMode === 'grid' ? 'bg-orange-50/60 text-[#FF7300]' : 'bg-[#f2f2f7] text-gray-500'
                }`}
              >
                {viewMode === 'grid' && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r bg-[#FF7300]/90 shadow-sm pointer-events-none"
                  />
                )}
                <Grid2x2
                  className="relative h-4 w-4 pointer-events-none"
                  aria-hidden
                />
              </button>
            </div>
          </div>
        </div>

        <div className="hidden md:block rounded-lg border border-gray-200 bg-white shadow-sm px-3 py-2 mb-3" style={{ display: 'none' }}>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <SearchFiltersFields
              t={t}
              gameSlug={gameSlug}
              categoryKey={categoryKey}
              edizioneInput={edizioneInput}
              setEdizioneInput={setEdizioneInput}
              nomeInput={nomeInput}
              setNomeInput={setNomeInput}
              buildSearchUrl={buildSearchUrl}
              variant="desktop"
              onSubmitSearch={handleCerca}
              onNavigate={(url) => router.replace(url)}
              onLiveChange={triggerLiveSearch}
            />

            <div className="flex items-center gap-2 flex-shrink-0">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={advancedNameMode === 'exact'}
                  onChange={() => setAdvancedNameMode('exact')}
                />
                <span
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    advancedNameMode === 'exact' ? 'bg-[#FF7300]/25' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      advancedNameMode === 'exact' ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </span>
                <span className="text-xs text-gray-600 whitespace-nowrap">{t('search.exactName')}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={advancedNameMode === 'available'}
                  onChange={() => setAdvancedNameMode('available')}
                />
                <span
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    advancedNameMode === 'available' ? 'bg-[#FF7300]/25' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      advancedNameMode === 'available' ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </span>
                <span className="text-xs text-gray-600 whitespace-nowrap">{t('search.onlyAvailable')}</span>
              </label>
            </div>
          </div>
        </div>

        {filtersOpen && (
          <div
            className="fixed inset-0 z-[200] flex md:hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-filters-sheet-title"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label={t('search.filtersClose')}
              onClick={() => setFiltersOpen(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 flex max-h-[min(92vh,720px)] flex-col rounded-t-2xl bg-white shadow-2xl">
              <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
                <h2 id="search-filters-sheet-title" className="text-lg font-bold uppercase tracking-wide text-gray-900">
                  {t('search.filtersSheetTitle')}
                </h2>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  aria-label={t('search.filtersClose')}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                <SearchFiltersFields
                  t={t}
                  gameSlug={gameSlug}
                  categoryKey={categoryKey}
                  edizioneInput={edizioneInput}
                  setEdizioneInput={setEdizioneInput}
                  nomeInput={nomeInput}
                  setNomeInput={setNomeInput}
                  buildSearchUrl={buildSearchUrl}
                  variant="sheet"
                  onSubmitSearch={() => {
                    handleCerca();
                    setFiltersOpen(false);
                  }}
                  onNavigate={(url) => router.replace(url)}
                />
                <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4">
                  <span className="text-xs font-semibold text-gray-600">{t('search.sortBy')}</span>
                  <select
                    className="min-h-[44px] w-full rounded-[12px] border border-gray-200 bg-[#f2f2f7] px-3 py-2 text-sm font-medium text-gray-900 [color-scheme:light] focus:outline-none focus:ring-2 focus:ring-[#5AC8FA]/30 focus:ring-offset-0"
                    value={sortParam}
                    onChange={(e) => {
                      router.replace(buildSearchUrl({ sort: e.target.value, page: '1' }));
                    }}
                  >
                    {sortOptions.map((o) => (
                      <option key={o.value} value={o.value} className="bg-white text-gray-900">
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={advancedNameMode === 'exact'}
                      onChange={() => setAdvancedNameMode('exact')}
                    />
                    <span
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        advancedNameMode === 'exact' ? 'bg-[#FF7300]/25' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                          advancedNameMode === 'exact' ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </span>
                    <span className="text-xs text-gray-600 whitespace-nowrap">{t('search.exactName')}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={advancedNameMode === 'available'}
                      onChange={() => setAdvancedNameMode('available')}
                    />
                    <span
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        advancedNameMode === 'available' ? 'bg-[#FF7300]/25' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                          advancedNameMode === 'available' ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </span>
                    <span className="text-xs text-gray-600 whitespace-nowrap">{t('search.onlyAvailable')}</span>
                  </label>
                </div>
              </div>
              <div className="shrink-0 border-t border-gray-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => {
                    handleCerca();
                    setFiltersOpen(false);
                  }}
                  className="flex w-full min-h-[48px] items-center justify-center gap-2 bg-[#FF7300] px-4 py-3 text-sm font-semibold rounded-[14px] text-white transition-colors hover:bg-orange-600"
                >
                  <Search className="h-5 w-5 shrink-0" />
                  {t('search.searchBtn')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Barra risultati + ordinamento + vista (mobile: solo conteggio + lista/griglia; sort nel sheet Filtri) */}
        <div className="hidden md:flex flex-col gap-2 py-2 px-3 border border-gray-200 bg-white mb-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
          <p className="min-w-0 text-xs text-gray-700 sm:max-w-[min(100%,28rem)]">
            <strong>{total}</strong> {t('search.results')}
            {total > 0 && (
              <span className="mt-1 block text-[11px] text-gray-500 sm:ml-2 sm:mt-0 sm:inline">
                {t('search.advancedHint')}
              </span>
            )}
          </p>
          <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <div className="hidden min-w-0 w-full flex-col gap-1 md:flex md:w-auto md:flex-row md:items-center md:gap-2">
              <span className="shrink-0 text-[11px] font-semibold text-gray-500">{t('search.sortBy')}</span>
              <select
                className="min-h-[32px] w-full min-w-0 rounded-[10px] border border-gray-200 bg-[#f2f2f7] px-2 py-1 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5AC8FA]/30"
                value={sortParam}
                onChange={(e) => {
                  router.replace(buildSearchUrl({ sort: e.target.value, page: '1' }));
                }}
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value} className="bg-white text-gray-900">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden md:flex items-center">
              <div className="flex h-10 overflow-hidden rounded-full bg-gray-100">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-label={t('search.viewList')}
                  title={t('search.viewList')}
                  className={`flex h-10 w-12 items-center justify-center transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary text-white'
                      : 'text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <Rows3 className="h-4 w-4 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label={t('search.viewGrid')}
                  title={t('search.viewGrid')}
                  className={`flex h-10 w-12 items-center justify-center transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary text-white'
                      : 'text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <Grid2x2 className="h-4 w-4 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenuto: lista o griglia */}
        <div className="border border-gray-300 bg-white search-results-card">
          {!loading && !error && (
            <div className="px-4 py-3 border-b border-gray-200 bg-white md:hidden">
              <p className="text-xs font-semibold text-gray-700">
                <strong>{total}</strong> {t('search.results')}
              </p>
            </div>
          )}
          {error && (
            <div className="p-6 text-center text-red-600 bg-red-50">
              {error}
            </div>
          )}
          {loading && (
            <div className="p-12 text-center text-gray-500">{t('search.loading')}</div>
          )}
          {!loading && !error && hits.length === 0 && (
            <div className="p-12 text-center text-gray-500">{t('search.noResults')}</div>
          )}
          {!loading && !error && hits.length > 0 && viewMode === 'list' && (
            <div
              className="overflow-x-auto search-results-table-wrapper"
            >
              <table className="w-full min-w-[640px] border-collapse text-sm table-fixed">
                <colgroup>
                  <col className="min-w-0" style={{ width: 'min(9%, 6.5rem)' }} />
                  <col className="min-w-0" style={{ width: 'min(22%, 13rem)' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '8%' }} />
                </colgroup>
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-left text-gray-600 uppercase text-xs font-semibold">
                    <th className="pl-2 pr-0 py-2 align-bottom text-left">{t('search.filterEdition')}</th>
                    <th className="pl-2 pr-2 py-2 align-bottom text-left">{t('search.thName')}</th>
                    <th className="px-2 py-2 whitespace-nowrap align-bottom text-center">{t('search.thNumber')}</th>
                    <th className="px-2 py-2 whitespace-nowrap align-bottom text-center">{t('search.thRarity')}</th>
                    <th className="px-2 py-2 whitespace-nowrap align-bottom text-center">{t('search.thAvailable')}</th>
                    <th className="px-2 py-2 whitespace-nowrap align-bottom text-center">{t('search.thFrom')}</th>
                  </tr>
                </thead>
                <tbody>
                  {hits.map((hit) => {
                    const productHref = `/products/${hit.id}`;
                    const { primary, secondary } = getDisplayNames(hit, selectedLang);
                    const imgUrl = getCardImageUrl(hit.image ?? null);
                    const setName = hit.set_name ?? '';
                    const nameOriginal = secondary ?? primary;
                    const nameTranslation = secondary ? primary : null;
                    return (
                      <tr
                        key={hit.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(productHref)}
                        onKeyDown={(e) => e.key === 'Enter' && router.push(productHref)}
                        className="search-result-row border-b border-gray-100 cursor-pointer outline-none"
                      >
                        <td
                          className="pl-2 pr-0 py-2 align-middle min-w-0"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              className="relative flex h-14 w-9 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-gray-200 bg-[#f2f2f7] shadow-sm transition-shadow"
                              aria-label={t('search.previewCardImage')}
                              disabled={!imgUrl}
                              onClick={(e) => handleListCameraClick(e, imgUrl, nameOriginal)}
                              onMouseEnter={(e) => handleListCameraMouseEnter(e, imgUrl, nameOriginal)}
                              onMouseLeave={scheduleHideHoverPreview}
                            >
                              {imgUrl ? (
                                <>
                                  <div className="absolute inset-0">
                                    <Image
                                      src={imgUrl}
                                      alt={nameOriginal}
                                      fill
                                      sizes="40px"
                                      className="object-cover"
                                    />
                                  </div>
                                  {/* Overlay + camera al centro */}
                                  <span className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" aria-hidden />
                              <Camera
                                    className="absolute inset-0 m-auto h-4 w-4 text-white"
                                    strokeWidth={1.5}
                                    aria-hidden
                                  />
                                </>
                              ) : (
                                <>
                                  <span className="absolute inset-0 bg-gray-100" aria-hidden />
                                  <span className="absolute inset-0 bg-black/20" aria-hidden />
                                  <Camera
                                    className="absolute inset-0 m-auto h-4 w-4 text-white"
                                    strokeWidth={1.5}
                                    aria-hidden
                                  />
                                </>
                              )}
                            </button>

                            <span className="relative inline-flex min-w-0 max-w-[6.5rem] group">
                              <span className="min-w-0 flex-1 text-[10px] leading-tight text-gray-600 font-medium tracking-wide truncate">
                                {setName}
                              </span>
                              {/* Tooltip custom: niente delay nativo, stile Apple */}
                              {setName && (
                                <span className="pointer-events-none absolute left-0 top-full z-[20] mt-1 w-max max-w-[14rem] break-words rounded-md bg-gray-900 px-2 py-1 text-[11px] text-white shadow-lg opacity-0 transition-opacity duration-75 group-hover:opacity-100">
                                  {setName}
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="pl-2 pr-2 py-2 align-middle min-w-0 text-left">
                          <div className="flex flex-col justify-center gap-0.5 min-w-0">
                            <span className="text-sm font-semibold leading-tight text-gray-900 break-words">{nameOriginal}</span>
                            {nameTranslation && (
                              <p className="text-xs text-gray-500 italic font-light leading-tight break-words">{nameTranslation}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-gray-500 whitespace-nowrap text-center">
                          {hit.collector_number ?? '–'}
                        </td>
                        <td className="px-2 py-2 text-gray-500 whitespace-nowrap text-center">
                          {hit.rarity ?? '–'}
                        </td>
                        <td className="px-2 py-2 text-gray-500 whitespace-nowrap text-center">–</td>
                        <td className="px-2 py-2 text-[#FF7300] font-semibold whitespace-nowrap text-center">–</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && !error && hits.length > 0 && viewMode === 'grid' && (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {hits.map((hit) => {
                const imgUrl = getCardImageUrl(hit.image ?? null);
                const { primary, secondary } = getDisplayNames(hit, selectedLang);
                return (
                  <Link
                    key={hit.id}
                    href={`/products/${hit.id}`}
                    className="group border border-gray-200 bg-white p-3 hover:border-[#FF7300] hover:shadow-sm transition-all"
                  >
                    <div className="relative aspect-[63/88] overflow-hidden bg-gray-100 mb-2">
                      {imgUrl ? (
                        <Image
                          src={imgUrl}
                          alt={primary}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform"
                          sizes="(max-width:640px) 50vw, 20vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          {t('search.noImage')}
                        </div>
                      )}
                    </div>
                    <p className="font-medium text-gray-900 text-sm line-clamp-2">{primary}</p>
                    {secondary && (
                      <p className="text-xs text-gray-500 line-clamp-1">{secondary}</p>
                    )}
                    {hit.set_name && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{hit.set_name}</p>
                    )}
                    <p className="text-[#FF7300] font-semibold text-sm mt-1">{t('search.fromPrice')}</p>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Paginazione */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4 px-4 bg-[#FF7300] text-white">
              <Link
                href={buildSearchUrl({ page: String(Math.max(1, currentPage - 1)) })}
                className={`p-2 ${currentPage <= 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-orange-600'}`}
                aria-label={t('search.prevPage')}
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <span className="px-4 font-medium">
                {t('search.pageOf', { current: currentPage, total: totalPages })}
              </span>
              <Link
                href={buildSearchUrl({ page: String(Math.min(totalPages, currentPage + 1)) })}
                className={`p-2 ${currentPage >= totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-orange-600'}`}
                aria-label={t('search.nextPage')}
              >
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {listPortalsMounted &&
        listHoverPreview &&
        createPortal(
          <div
            role="presentation"
            className="fixed z-[250] pointer-events-auto"
            style={{ left: listHoverPreview.left, top: listHoverPreview.top }}
            onMouseEnter={cancelHideHoverPreview}
            onMouseLeave={scheduleHideHoverPreview}
          >
            <div className="relative w-[176px] sm:w-[208px] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] animate-in fade-in zoom-in-95 duration-200">
              <div className="relative aspect-[63/88] w-full bg-gray-100">
                <Image
                  src={listHoverPreview.url}
                  alt={listHoverPreview.name}
                  fill
                  className="object-contain"
                  sizes="208px"
                />
              </div>
            </div>
          </div>,
          document.body
        )}

      {listPortalsMounted &&
        listModalPreview &&
        createPortal(
          <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={t('search.previewCardImage')}
            onClick={() => setListModalPreview(null)}
          >
            <button
              type="button"
              className="absolute right-3 top-3 z-[1] rounded-full bg-white/95 p-2 shadow-md ring-1 ring-black/10 hover:bg-white"
              aria-label={t('search.closePreviewModal')}
              onClick={(e) => {
                e.stopPropagation();
                setListModalPreview(null);
              }}
            >
              <X className="h-6 w-6 text-gray-800" aria-hidden />
            </button>
            <div
              className="relative max-h-[85vh] w-full max-w-[min(92vw,320px)] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-[63/88] w-full bg-gray-100">
                <Image
                  src={listModalPreview.url}
                  alt={listModalPreview.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 92vw, 320px"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}
