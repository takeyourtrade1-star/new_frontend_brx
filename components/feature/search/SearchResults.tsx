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
  useState,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCardImageUrl } from '@/lib/assets';
import { SetIconBadge } from '@/components/ui/SetIconBadge';
import { buildSetPageUrl, resolveSetPageGameSlug } from '@/lib/search/set-page-url';
import { CardImageCameraPeek } from '@/components/ui/CardImageCameraPeek';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { getMessage } from '@/lib/i18n/getMessage';
import { DEFAULT_LOCALE } from '@/lib/i18n/locales';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { SearchHit } from '@/app/api/search/route';
import { useSearchCards, type SearchApiResponse } from '@/lib/hooks/use-search';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import { RarityLegendProvider } from '@/components/ui/RarityLegendProvider';
import { SearchResultsTable } from '@/components/feature/search/SearchResultsTable';
import { cn } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { isSellFlow, getProductDetailHref } from '@/lib/sell-flow/sell-flow';
import {
  SearchResultsToolbar,
  type ViewMode,
} from '@/components/feature/search/SearchResultsToolbar';
import {
  type GameSlug,
  type CategoryKey,
  normalizeGameSlug,
  normalizeCategoryKey,
  getCategoryIds,
  getCategoryIdsAcrossGames,
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


const SORT_DEFS: { value: string; labelKey: MessageKey }[] = [
  { value: 'name_asc', labelKey: 'search.sort.nameAsc' },
  { value: 'name_desc', labelKey: 'search.sort.nameDesc' },
  { value: 'price_asc', labelKey: 'search.sort.priceAsc' },
  { value: 'price_desc', labelKey: 'search.sort.priceDesc' },
  { value: 'set_asc', labelKey: 'search.sort.setAsc' },
  { value: 'set_desc', labelKey: 'search.sort.setDesc' },
];

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
  const isExactMode = searchParams.get('exact_mode') === 'true';
  const [showSimilar, setShowSimilar] = useState(false);
  const game = searchParams.get('game') ?? initialGame ?? '';
  const setFilter = searchParams.get('set') ?? '';
  const categoryIdLegacy = searchParams.get('category_id') ?? '';
  const categoryKeyParam = searchParams.get('category_key') ?? '';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const sortParam = searchParams.get('sort') ?? 'name_asc';
  const sellFlow = isSellFlow(searchParams);
  const productHrefBuilder = useCallback(
    (id: string) => (sellFlow ? getProductDetailHref(id, { sellFlow: true }) : `/products/${id}`),
    [sellFlow],
  );

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
  const [imagePreviewModalOpen, setImagePreviewModalOpen] = useState(false);

  const apiGame = game ? (FRONTEND_TO_GAME_SLUG[game] || game) : '';
  const meiliQuery = [q, setFilter].filter(Boolean).join(' ').trim() || undefined;
  const { data, isLoading: loading, error: queryError } = useSearchCards({
    q: meiliQuery,
    game: apiGame || undefined,
    category_ids: categoryIds.length > 0 ? categoryIds : undefined,
    category_id: categoryIds.length === 0 && categoryIdLegacy ? Number(categoryIdLegacy) : undefined,
    page: pageParam,
    limit: 20,
    sort: sortParam,
    exact_mode: isExactMode,
    show_similar: isExactMode && showSimilar,
  });
  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : t('search.httpError', { status: 0 })
    : null;

  useEffect(() => {
    setShowSimilar(false);
  }, [q, isExactMode]);

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

  // Se l'utente passa da lista a griglia mentre un preview/modale era aperto,
  // evitiamo di lasciare body "locked" e creiamo scroll interno indesiderato.
  useEffect(() => {
    if (viewMode === 'grid') {
      setImagePreviewModalOpen(false);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
      }
    }
  }, [viewMode]);

  const total = data?.total ?? 0;
  const hasExactResult = isExactMode && data?.hasExactMatch === true;
  const primaryHits = hasExactResult ? (data.exactHits ?? []) : (data?.hits ?? []);
  const similarHits = hasExactResult && showSimilar ? (data?.similarHits ?? []) : [];
  const visibleTotal = hasExactResult && !showSimilar ? primaryHits.length : total;
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

  const buildSearchUrl = useCallback(
    (updates: Record<string, string>) => {
      const p = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) p.set(k, v);
        else p.delete(k);
      });
      return `/search?${p.toString()}`;
    },
    [searchParams]
  );

  useEffect(() => {
    if (!imagePreviewModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [imagePreviewModalOpen]);

  // Safety: evita casi in cui rimane attivo uno "scroll lock"
  // (causa tipica dello scroll verticale interno nella tabella).
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (imagePreviewModalOpen) return;
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
  }, [imagePreviewModalOpen]);

  const renderHits = (resultHits: SearchHit[]) => {
    if (viewMode === 'list') {
      return (
        <SearchResultsTable
          hits={resultHits}
          selectedLang={selectedLang}
          gameSlug={gameSlug}
          t={t}
          editionVariant="icon"
          onImagePreviewOpenChange={setImagePreviewModalOpen}
          buildProductHref={sellFlow ? productHrefBuilder : undefined}
        />
      );
    }

    return (
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {resultHits.map((hit) => {
          const imgUrl = getCardImageUrl(hit.image ?? null);
          const { primary, secondary } = getDisplayNames(hit, selectedLang);
          const setName = hit.set_name ?? '';
          const setPageGame = resolveSetPageGameSlug(hit.game_slug, gameSlug);
          const setPageHref = setName ? buildSetPageUrl(setPageGame, setName) : null;
          return (
            <div
              key={hit.id}
              className="group relative border border-gray-200 bg-white p-3 hover:border-[#FF7300] hover:shadow-sm transition-all"
            >
              <Link href={productHrefBuilder(hit.id)} className="block">
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
                {setName && (
                  <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5" title={setName}>{setName}</p>
                )}
                <p className="text-[#FF7300] font-semibold text-sm mt-1">{t('search.fromPrice')}</p>
              </Link>
              {setPageHref && (setName || hit.set_code) && (
                <Link
                  href={setPageHref}
                  title={setName}
                  aria-label={setName ? `Set: ${setName}` : 'Set'}
                  className="absolute top-3 right-3 flex items-center justify-center hover:opacity-80 transition-opacity rounded focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <SetIconBadge
                    setIconUri={hit.set_icon_uri}
                    setCode={hit.set_code}
                    setName={setName}
                    gameSlug={hit.game_slug}
                    imageClassName="h-9 w-9 object-contain"
                  />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <RarityLegendProvider>
    <section className="pb-12" style={{ backgroundColor: '#F5F4F0' }}>
      <div className="container-content py-6">
        {/* Breadcrumb */}
        <AppBreadcrumb
          items={breadcrumbItems}
          ariaLabel="Breadcrumb"
          variant="default"
          className="mb-2 w-auto text-sm"
        />

        <h1 className="sr-only">
          {tHydrationSafe('search.singles')}
        </h1>

        {!loading && !error && primaryHits.length > 0 && (
          <SearchResultsToolbar
            className="mb-3"
            total={visibleTotal}
            sortParam={sortParam}
            sortOptions={sortOptions}
            viewMode={viewMode}
            onSortChange={(value) => router.replace(buildSearchUrl({ sort: value, page: '1' }))}
            onViewModeChange={setViewMode}
            t={t}
          />
        )}

        {/* Contenuto: lista o griglia */}
        <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm search-results-card">
          {!loading && !error && primaryHits.length === 0 && (
            <div className="px-4 py-2 border-b border-gray-100 bg-white md:hidden">
              <p className="text-xs font-semibold text-gray-700">
                <strong className="tabular-nums">{total}</strong> {t('search.results')}
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
          {!loading && !error && primaryHits.length === 0 && (
            <div className="p-12 text-center text-gray-500">{t('search.noResults')}</div>
          )}
          {!loading && !error && primaryHits.length > 0 && renderHits(primaryHits)}

          {!loading && !error && hasExactResult && !showSimilar &&
            data?.hasSimilarMatch === true && (
              <div className="flex justify-center border-t border-gray-100 px-4 py-6">
                <button
                  type="button"
                  onClick={() => setShowSimilar(true)}
                  className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {t('search.showSimilar')}
                </button>
              </div>
            )}

          {!loading && !error && hasExactResult && showSimilar && similarHits.length > 0 && (
            <>
              <h2 className="border-t border-gray-100 px-4 pb-1 pt-6 text-sm font-medium text-gray-500">
                {t('search.similarResults')}
              </h2>
              {renderHits(similarHits)}
            </>
          )}

          {/* Paginazione */}
          {!loading && !error && totalPages > 1 && (!hasExactResult || showSimilar) && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              buildPageHref={(page) => buildSearchUrl({ page: String(page) })}
            />
          )}
        </div>
      </div>

    </section>
    </RarityLegendProvider>
  );
}
