'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Archive,
  Check,
  Filter,
  Loader2,
  PackageOpen,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { ConditionBadge, type ConditionCode } from '@/components/ui/ConditionBadge';
import { usePublicUserCollection } from '@/lib/hooks/use-public-user-collection';
import { useMeilisearchCards } from '@/lib/hooks/use-meilisearch-cards';
import { getCardDisplayNames } from '@/lib/card-display-name';
import { getInventoryConditionCode } from '@/lib/inventory/inventory-filter-utils';
import { ASSETS, getCdnImageUrl } from '@/lib/config';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import type { PublicInventoryItem } from '@/types';

const PAGE_SIZE = 24;
const DEFAULT_IMAGE = getCdnImageUrl('Logo%20Principale%20EBARTEX.png');

const CONDITIONS: { code: 'ALL' | ConditionCode; label: string }[] = [
  { code: 'ALL', label: 'Tutte' },
  { code: 'NM', label: 'Near Mint (NM)' },
  { code: 'SP', label: 'Slightly Played (SP)' },
  { code: 'MP', label: 'Moderately Played (MP)' },
  { code: 'PL', label: 'Played (PL)' },
  { code: 'PO', label: 'Poor (PO)' },
];

function buildImageUrl(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_IMAGE;
  const trimmed = String(raw).trim();
  if (trimmed.startsWith('http')) return trimmed;
  const path = trimmed.replace(/^\/img\//, '').replace(/^img\//, '');
  if (!path) return DEFAULT_IMAGE;
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return ASSETS.cdnUrl ? `${ASSETS.cdnUrl}${withSlash}` : withSlash;
}

function formatPrice(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

interface UserProfileCollectionPanelProps {
  username: string;
}

export function UserProfileCollectionPanel({ username }: UserProfileCollectionPanelProps) {
  const { t } = useTranslation();
  const intlLocale = useIntlLocale();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<'ALL' | ConditionCode>('ALL');
  const [onlyFoil, setOnlyFoil] = useState(false);
  const [onlyGraded, setOnlyGraded] = useState(false);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'name_asc' | 'name_desc'>('price_asc');

  const { data, isLoading, isError, refetch } = usePublicUserCollection(username, {
    limit: 120,
    offset: 0,
  });

  const rawItems = data?.items ?? [];
  const totalRaw = data?.total ?? 0;

  const blueprintIds = useMemo(
    () => [...new Set(rawItems.map((i) => i.blueprint_id).filter((id) => id > 0))],
    [rawItems],
  );

  const { data: catalog = {}, isLoading: catalogLoading } = useMeilisearchCards(blueprintIds);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedCondition !== 'ALL' ||
    onlyFoil ||
    onlyGraded ||
    sortBy !== 'price_asc';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCondition('ALL');
    setOnlyFoil(false);
    setOnlyGraded(false);
    setSortBy('price_asc');
    setPage(1);
  };

  const filteredAndSortedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = rawItems.filter((item) => {
      const card = catalog[item.blueprint_id];
      const names = card
        ? getCardDisplayNames(
            { name: card.name ?? '', keywords_localized: card.keywords_localized },
            'it',
          )
        : null;
      const title = (names?.primary ?? card?.name ?? '').toLowerCase();
      const setName = (card?.set_name ?? '').toLowerCase();

      if (q.length > 0 && !title.includes(q) && !setName.includes(q)) {
        return false;
      }

      const itemCondition = getInventoryConditionCode(
        ((item.properties as Record<string, unknown>)?.condition ??
          (item.properties as Record<string, unknown>)?.card_condition) as string | undefined,
      );

      if (selectedCondition !== 'ALL' && itemCondition !== selectedCondition) {
        return false;
      }

      if (onlyFoil && !(item.properties as Record<string, unknown>)?.foil) {
        return false;
      }

      if (onlyGraded && !item.graded && !(item.properties as Record<string, unknown>)?.graded) {
        return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'price_asc') return a.price_cents - b.price_cents;
      if (sortBy === 'price_desc') return b.price_cents - a.price_cents;

      const cardA = catalog[a.blueprint_id];
      const cardB = catalog[b.blueprint_id];
      const nameA = cardA?.name ?? '';
      const nameB = cardB?.name ?? '';

      if (sortBy === 'name_asc') return nameA.localeCompare(nameB, 'it');
      if (sortBy === 'name_desc') return nameB.localeCompare(nameA, 'it');
      return 0;
    });
  }, [rawItems, catalog, searchQuery, selectedCondition, onlyFoil, onlyGraded, sortBy]);

  const totalFiltered = filteredAndSortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const currentPagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredAndSortedItems.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedItems, page]);

  if (isLoading) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-3xl border border-white/60 bg-white/50 px-6 py-16 backdrop-blur-xl">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff7300]" />
        <p className="text-sm font-medium text-slate-500">Caricamento collezione…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl border border-red-100/80 bg-red-50/60 px-6 py-12 text-center backdrop-blur-xl">
        <p className="mb-4 text-sm text-red-700">Impossibile caricare la collezione.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          Riprova
        </button>
      </div>
    );
  }

  if (totalRaw === 0) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200/80 bg-white/40 px-8 py-16 text-center backdrop-blur-xl">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100/80">
          <PackageOpen className="h-7 w-7 text-slate-400" />
        </div>
        <p className="text-base font-semibold text-slate-800">
          {t('userProfile.collectionEmpty') || "L'utente non ha carte in vendita"}
        </p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          {t('userProfile.collectionEmptyDesc', { username }) ||
            `@${username} non ha ancora articoli in vendita o in collezione.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra Filtri Base - Uniformata al design system */}
      <div className="rounded-2xl border border-white/70 bg-white/60 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Ricerca per nome/set */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder={t('userProfile.searchCardsPlaceholder') || 'Cerca per nome carta o espansione…'}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white/90 pl-10 pr-9 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#ff7300] focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Ordinamento */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as typeof sortBy);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white/90 px-3 text-xs font-semibold text-slate-700 focus:border-[#ff7300] focus:outline-none"
            >
              <option value="price_asc">{t('userProfile.sortPriceAsc') || 'Prezzo: crescente'}</option>
              <option value="price_desc">{t('userProfile.sortPriceDesc') || 'Prezzo: decrescente'}</option>
              <option value="name_asc">{t('userProfile.sortNameAsc') || 'Nome: A-Z'}</option>
              <option value="name_desc">{t('userProfile.sortNameDesc') || 'Nome: Z-A'}</option>
            </select>
          </div>
        </div>

        {/* Chip filtri: Condizione, Foil, Gradata, Reset */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Condizione:
            </span>
            <select
              value={selectedCondition}
              onChange={(e) => {
                setSelectedCondition(e.target.value as typeof selectedCondition);
                setPage(1);
              }}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:border-[#ff7300] focus:outline-none"
            >
              {CONDITIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setOnlyFoil((prev) => !prev);
                setPage(1);
              }}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold transition ${
                onlyFoil
                  ? 'border-[#ff7300]/40 bg-[#ff7300]/10 text-[#ff7300]'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>Foil</span>
              {onlyFoil && <Check className="h-3 w-3" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setOnlyGraded((prev) => !prev);
                setPage(1);
              }}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold transition ${
                onlyGraded
                  ? 'border-[#ff7300]/40 bg-[#ff7300]/10 text-[#ff7300]'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Gradata</span>
              {onlyGraded && <Check className="h-3 w-3" />}
            </button>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto inline-flex h-8 items-center gap-1 text-xs font-semibold text-slate-400 hover:text-[#ff7300] transition"
            >
              <RotateCcw className="h-3 w-3" />
              <span>{t('userProfile.resetFilters') || 'Azzera filtri'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Intestazione contatore risultati */}
      <div className="flex items-center justify-between px-1">
        <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <Archive className="h-4 w-4 text-[#ff7300]" />
          <span>
            <span className="font-bold text-slate-900">{totalFiltered}</span>{' '}
            {hasActiveFilters
              ? t('userProfile.itemsFound') || 'oggetti trovati'
              : t('userProfile.itemsInCollection') || 'oggetti in collezione'}
          </span>
          {catalogLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
        </p>
      </div>

      {/* Griglia Carte o Stato vuoto con filtri */}
      {totalFiltered === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200/80 bg-white/40 px-8 py-12 text-center backdrop-blur-xl">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100/80">
            <Search className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-base font-semibold text-slate-800">
            {t('userProfile.noFilteredResults') || 'Nessun risultato trovato'}
          </p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {t('userProfile.noFilteredResultsDesc') ||
              'Prova a modificare i termini di ricerca o azzerare i filtri.'}
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            {t('userProfile.resetFilters') || 'Azzera filtri'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {currentPagedItems.map((item) => {
            const card = catalog[item.blueprint_id];
            const names = card
              ? getCardDisplayNames(
                  { name: card.name ?? '', keywords_localized: card.keywords_localized },
                  'it',
                )
              : null;
            const title = names?.primary ?? card?.name ?? `Carta #${item.blueprint_id}`;
            const imageUrl = buildImageUrl(card?.image ?? null);
            const condition = getInventoryConditionCode(
              ((item.properties as Record<string, unknown>)?.condition ??
                (item.properties as Record<string, unknown>)?.card_condition) as string | undefined,
            );
            const searchHref = card?.id
              ? `/search?q=${encodeURIComponent(card.name ?? title)}`
              : '/search';

            return (
              <Link
                key={item.id}
                href={searchHref}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/60 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-[#ff7300]/25 hover:bg-white/80 hover:shadow-[0_16px_40px_rgba(255,115,0,0.12)]"
              >
                <div className="relative aspect-[63/88] overflow-hidden bg-gradient-to-b from-slate-100 to-slate-50">
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-contain p-2 transition duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width:640px) 50vw, 20vw"
                    unoptimized
                  />
                  {item.quantity > 1 && (
                    <span className="absolute right-2 top-2 rounded-full bg-slate-900/75 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                      ×{item.quantity}
                    </span>
                  )}
                  {item.graded && (
                    <span className="absolute left-2 top-2 rounded-full bg-[#ff7300]/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                      Graded
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <p className="line-clamp-2 min-h-[2.25rem] text-[13px] font-semibold leading-snug text-slate-900">
                    {title}
                  </p>
                  {card?.set_name && (
                    <p className="line-clamp-1 text-[11px] font-medium text-slate-500">{card.set_name}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100/90 pt-2">
                    <span className="text-sm font-bold text-[#ff7300]">{formatPrice(item.price_cents, intlLocale)}</span>
                    {condition && <ConditionBadge condition={condition} size="sm" />}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Paginazione Full-Width in basso, centrata ed estesa */}
      {totalPages > 1 && (
        <div className="pt-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 400, behavior: 'smooth' });
            }}
            variant="card-footer"
            className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-xl shadow-sm"
          />
        </div>
      )}
    </div>
  );
}

