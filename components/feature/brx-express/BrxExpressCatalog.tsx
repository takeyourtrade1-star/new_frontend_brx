'use client';

/**
 * Catalogo dedicato BRX Express: vista semplice e chiara (tema chiaro, in stile
 * sito) che sfoglia il catalogo carte via /api/search (Meilisearch). Ricerca
 * debounced + selettore gioco + griglia con link al dettaglio prodotto.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Zap, X, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useSearchCards } from '@/lib/hooks/use-search';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { getCardImageUrl } from '@/lib/assets';
import { cn } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { GAME_OPTIONS, type GameSlug } from '@/lib/contexts/GameContext';
import {
  normalizeGameSlug,
  GAME_TO_MEILISEARCH,
  FRONTEND_TO_GAME_SLUG,
} from '@/lib/search/category-mapping';
import type { SearchHit } from '@/app/api/search/route';

const SEARCH_DEBOUNCE_MS = 350;
const PAGE_SIZE = 24;

const BACKEND_LANG_ORDER = ['en', 'de', 'es', 'fr', 'it', 'pt'] as const;
type SupportedLang = (typeof BACKEND_LANG_ORDER)[number];

function getLocalizedName(keywords: string[] | undefined, lang: string): string | null {
  if (!keywords?.length) return null;
  const l = (BACKEND_LANG_ORDER.includes(lang as SupportedLang) ? lang : 'en') as SupportedLang;
  const idx = BACKEND_LANG_ORDER.indexOf(l);
  if (idx < 0 || !keywords[idx]) return null;
  const raw = keywords[idx];
  return (typeof raw === 'string' ? raw : '').trim() || null;
}

function getDisplayNames(hit: SearchHit, lang: string): { primary: string; secondary: string | null } {
  const primary = getLocalizedName(hit.keywords_localized, lang) ?? hit.name;
  const secondary = lang !== 'en' && primary !== hit.name ? hit.name : null;
  return { primary, secondary };
}

export default function BrxExpressCatalog() {
  const { t } = useTranslation();
  const { selectedLang } = useLanguage();

  const [game, setGame] = useState<GameSlug>('mtg');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS);

  const apiGame = useMemo(() => {
    const mapped = normalizeGameSlug(FRONTEND_TO_GAME_SLUG[game] ?? game);
    return GAME_TO_MEILISEARCH[mapped ?? 'mtg'] ?? game;
  }, [game]);

  const { data, isLoading, error } = useSearchCards({
    q: debouncedQuery.trim() || undefined,
    game: apiGame,
    page,
    limit: PAGE_SIZE,
    sort: 'name_asc',
  });

  const hits = data?.hits ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleGameChange = (next: GameSlug) => {
    setGame(next);
    setPage(1);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  return (
    <section className="min-h-screen bg-[#F0F0F0] pb-16">
      {/* Hero band BRX Express */}
      <div className="bg-gradient-to-br from-[#1D3160] via-[#1D3160] to-[#0F172A] text-white">
        <div className="container-content px-4 sm:px-6 py-10 sm:py-12">
          <Link
            href="/brx-express"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-300/90 transition-colors hover:text-orange-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('brxExpress.catalog.back')}
          </Link>

          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 shadow-md shadow-orange-500/30">
              <Zap className="h-6 w-6 text-white" aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {t('brxExpress.catalog.title')}
              </h1>
              <p className="mt-1 text-sm text-slate-300 max-w-2xl">
                {t('brxExpress.catalog.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-content px-4 sm:px-6 pt-6">
        {/* Selettore gioco */}
        <div className="flex flex-wrap items-center gap-2">
          {GAME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleGameChange(opt.value)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-semibold transition-all',
                game === opt.value
                  ? 'bg-[#FF8800] text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Ricerca */}
        <div className="relative mt-4 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={t('brxExpress.catalog.searchPlaceholder')}
            className="min-h-[48px] w-full rounded-full border border-gray-200 bg-white pl-11 pr-10 text-base text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF8800]/30 focus:border-[#FF8800]/50"
          />
          {query && (
            <button
              type="button"
              onClick={() => handleQueryChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
              aria-label={t('search.clearName')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Conteggio */}
        {!isLoading && !error && (
          <p className="mt-4 text-sm text-gray-600">
            <strong>{total}</strong> {t('search.results')}
          </p>
        )}

        {/* Risultati */}
        <div className="mt-3">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
              {error instanceof Error ? error.message : String(error)}
            </div>
          )}

          {isLoading && (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500">
              {t('search.loading')}
            </div>
          )}

          {!isLoading && !error && hits.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500">
              {t('search.noResults')}
            </div>
          )}

          {!isLoading && !error && hits.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {hits.map((hit) => {
                const imgUrl = getCardImageUrl(hit.image ?? null);
                const { primary, secondary } = getDisplayNames(hit, selectedLang);
                return (
                  <Link
                    key={hit.id}
                    href={`/products/${hit.id}`}
                    className="group flex flex-col rounded-xl border border-gray-200 bg-white p-3 transition-all hover:border-[#FF8800] hover:shadow-md"
                  >
                    <div className="relative mb-2 aspect-[63/88] overflow-hidden rounded bg-gray-100">
                      {imgUrl ? (
                        <Image
                          src={imgUrl}
                          alt={primary}
                          fill
                          className="object-contain transition-transform group-hover:scale-105"
                          sizes="(max-width:640px) 50vw, (max-width:1024px) 25vw, 16vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                          No img
                        </div>
                      )}
                      <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        <Zap className="h-2.5 w-2.5" />
                        24h
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm font-semibold text-gray-900">{primary}</p>
                    {secondary && (
                      <p className="line-clamp-1 text-xs text-gray-500">{secondary}</p>
                    )}
                    {hit.set_name && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{hit.set_name}</p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {!isLoading && !error && totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                variant="compact"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
