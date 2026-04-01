'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { LayoutGrid, LayoutList, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { SearchHit } from '@/app/api/search/route';
import { getCardImageUrl } from '@/lib/assets';
import { getCardDisplayNames } from '@/lib/card-display-name';

type SetPageClientProps = {
  game: string;
  setName: string;
};

type SetHit = SearchHit & {
  market_price?: number;
  foil_price?: number;
};

const BACKEND_GAME_MAP: Record<string, string> = {
  mtg: 'mtg',
  pokemon: 'pokemon',
  pk: 'pokemon',
  op: 'one-piece',
  'one-piece': 'one-piece',
};

type CategoryKey =
  | 'singles'
  | 'boosters'
  | 'booster-boxes'
  | 'set-lotti-collezioni'
  | 'sigillati'
  | 'accessori'
  | 'other';

function normalizeText(s: string | undefined | null): string {
  return (s ?? '').toString().toLowerCase();
}

function classifyHit(hit: SetHit): CategoryKey {
  const cid = hit.category_id;
  const cname = normalizeText(hit.category_name);
  if (cid === 1 || cname.includes('singles') || cname.includes('single') || cname.includes('singole') || cname.includes('carte-singole')) {
    return 'singles';
  }
  if (cname.includes('booster box') || (cname.includes('booster') && cname.includes('box')) || cname.includes('booster-box')) {
    return 'booster-boxes';
  }
  if (cname.includes('booster') || cname.includes('boosters')) {
    return 'boosters';
  }
  if (cname.includes('lotti') || cname.includes('collection') || cname.includes('set') || cname.includes('collections')) {
    return 'set-lotti-collezioni';
  }
  if (cname.includes('accessor') || cname.includes('accessori') || cname.includes('accessory')) {
    return 'accessori';
  }
  if (cname.includes('sealed') || cname.includes('sigillati')) {
    return 'sigillati';
  }
  return 'other';
}

function formatEuro(n: number | undefined) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '–';
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n);
}

export function SetPageClient({ game, setName }: SetPageClientProps) {
  const { selectedLang } = useLanguage();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<SetHit[]>([]);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const categoriesWrapRef = useRef<HTMLDivElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const [stickyTop, setStickyTop] = useState(120);
  const [isCategoriesSticky, setIsCategoriesSticky] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchValue.trim()), 250);
    return () => window.clearTimeout(id);
  }, [searchValue]);

  const apiGame = game ? BACKEND_GAME_MAP[game] || game : '';
  const safeSetName = setName?.trim() ?? '';

  useEffect(() => {
    if (!apiGame || !safeSetName) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const baseParams = new URLSearchParams();
        const q = debouncedSearch ? debouncedSearch : safeSetName;
        baseParams.set('q', q);
        baseParams.set('game', apiGame);
        baseParams.set('set', safeSetName);
        baseParams.set('limit', '100');
        baseParams.set('sort', 'name_asc');

        const firstParams = new URLSearchParams(baseParams);
        firstParams.set('page', '1');

        const firstRes = await fetch(`/api/search?${firstParams.toString()}`);
        if (!firstRes.ok) {
          const j = await firstRes.json().catch(() => ({}));
          throw new Error(j?.error || j?.detail || `Errore ${firstRes.status}`);
        }

        const firstJson = (await firstRes.json()) as {
          hits?: SetHit[];
          totalPages?: number;
          total?: number;
        };

        const totalPages = Math.max(1, Number(firstJson.totalPages ?? 1) || 1);
        // Per far combaciare i conti delle categorie con CardTrader serve caricare
        // tutte le pagine (con limit=100 → pagesToLoad = totalPages).
        const pagesToLoad = debouncedSearch ? Math.min(totalPages, 1) : totalPages;

        const all: SetHit[] = Array.isArray(firstJson.hits) ? firstJson.hits : [];

        for (let page = 2; page <= pagesToLoad; page++) {
          if (cancelled) return;
          const params = new URLSearchParams(baseParams);
          params.set('page', String(page));
          const res = await fetch(`/api/search?${params.toString()}`);
          if (!res.ok) continue;
          const json = (await res.json()) as { hits?: SetHit[] };
          if (Array.isArray(json.hits)) all.push(...json.hits);
        }

        if (cancelled) return;

        setHits(all);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setHits([]);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [apiGame, safeSetName, debouncedSearch]);

  // Calcoliamo l'altezza reale dell'header (ora fixed) per impostare il top dello sticky.
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const headerEl = document.querySelector('header') as HTMLElement | null;
    if (!headerEl) return;

    const measure = () => {
      const h = headerEl.getBoundingClientRect().height || 116;
      setStickyTop(Math.round(h) + 12);
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(headerEl);
    return () => ro.disconnect();
  }, []);

  // Determina quando la griglia categorie entra in modalità sticky.
  useEffect(() => {
    const el = categoriesWrapRef.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const rect = el.getBoundingClientRect();
        // Se il top della sezione categorie supera (o raggiunge) il top dello sticky,
        // attiviamo l'effetto "glass" mantenendo comunque la posizione sticky via CSS.
        setIsCategoriesSticky(rect.top <= stickyTop + 1);
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [stickyTop]);

  const grouped = useMemo(() => {
    const entries: Record<CategoryKey, SetHit[]> = {
      singles: [],
      boosters: [],
      'booster-boxes': [],
      'set-lotti-collezioni': [],
      sigillati: [],
      accessori: [],
      other: [],
    };

    for (const h of hits) {
      entries[classifyHit(h)].push(h);
    }
    return entries;
  }, [hits]);

  const availableCategories = useMemo(() => {
    const keys: CategoryKey[] = [
      'singles',
      'boosters',
      'booster-boxes',
      'set-lotti-collezioni',
      'sigillati',
      'accessori',
      'other',
    ];
    return keys.filter((k) => grouped[k].length > 0);
  }, [grouped]);

  const [activeCategory, setActiveCategory] = useState<CategoryKey>('singles');

  useEffect(() => {
    if (!availableCategories.includes(activeCategory) && availableCategories.length > 0) {
      setActiveCategory(availableCategories[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableCategories.join('|')]);

  const activeHits = grouped[activeCategory] ?? [];

  const categoryLabel = (key: CategoryKey) => {
    switch (key) {
      case 'singles':
        return t('products.singles');
      case 'boosters':
        return t('products.boosters');
      case 'booster-boxes':
        return t('products.boosterBoxes');
      case 'set-lotti-collezioni':
        return t('products.setLots');
      case 'sigillati':
        return t('products.sealed');
      case 'accessori':
        return t('products.accessories');
      case 'other':
        return t('set.other');
      default:
        return key;
    }
  };

  return (
    <div className="container-content py-4 sm:py-6">
      {/* Nota: l'Header è già presente nella pagina /set server component */}
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tight">{safeSetName}</h1>
      </div>

      {error && <div className="p-4 rounded-md bg-red-50 text-red-700 text-sm mb-4">{error}</div>}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden />
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={t('search.namePlaceholder')}
                className="w-full rounded-[12px] border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-500 [color-scheme:light] focus:outline-none focus:ring-2 focus:ring-[#5AC8FA]/30 focus:ring-offset-0"
                aria-label={t('search.filterName')}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <div className="flex overflow-hidden rounded-md border border-gray-200 bg-white">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-bold uppercase transition-colors ${
                  viewMode === 'list' ? 'bg-[#FF7300] text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
                aria-label={t('search.viewList')}
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm font-bold uppercase transition-colors border-l border-gray-200 ${
                  viewMode === 'grid' ? 'bg-[#FF7300] text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
                aria-label={t('search.viewGrid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={categoriesWrapRef}
          style={{
            position: 'sticky',
            top: stickyTop,
            zIndex: 60,
          }}
          className={`transition-all duration-200 ease-out mb-4 ${
            isCategoriesSticky
              ? 'rounded-2xl border border-white/40 bg-white/60 backdrop-blur-md shadow-sm px-2 py-2'
              : ''
          }`}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {availableCategories.map((key) => {
            const count = grouped[key].length;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveCategory(key);
                  // Mantiene l'utente nella sezione risultati quando si cambia categoria.
                  resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`rounded-lg border transition-colors px-3 py-3 text-left ${
                  activeCategory === key ? 'border-[#FF8800] bg-orange-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-bold text-gray-900">{categoryLabel(key)}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {count} {t('set.items')}
                </div>
              </button>
            );
          })}
          </div>
        </div>

        {loading && <div className="text-center text-gray-500 py-10">{t('search.loading')}</div>}

        {!loading && activeHits.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            {t('search.noResults')}
          </div>
        )}

        {!loading && activeHits.length > 0 && (
          <>
            {viewMode === 'grid' && (
              <div ref={resultsRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {activeHits.map((hit) => {
                  const imgUrl = getCardImageUrl(hit.image ?? null);
                  const { primary, secondary } = getCardDisplayNames(hit, selectedLang);
                  return (
                    <Link
                      key={hit.id}
                      href={`/products/${hit.id}`}
                      className="group border border-gray-200 rounded-lg bg-white p-3 hover:border-[#FF8800] hover:shadow-sm transition-all"
                    >
                      <div className="relative aspect-[63/88] overflow-hidden rounded bg-gray-100 mb-2">
                        {imgUrl ? (
                          <Image
                            src={imgUrl}
                            alt={primary}
                            fill
                            className="object-contain group-hover:scale-105 transition-transform"
                            sizes="(max-width:640px) 50vw, 20vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs bg-gray-50">–</div>
                        )}
                      </div>
                      <p className="font-medium text-gray-900 text-sm line-clamp-2">{primary}</p>
                      {secondary && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{secondary}</p>}
                      {hit.set_name && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{hit.set_name}</p>}
                    </Link>
                  );
                })}
              </div>
            )}

            {viewMode === 'list' && (
              <div ref={resultsRef} className="overflow-x-auto search-results-table-wrapper">
                <table className="w-full min-w-[820px] border-collapse text-sm table-fixed">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200 text-left text-gray-600 uppercase text-xs font-semibold">
                      <th className="pl-2 pr-0 py-2 text-left">{t('search.filterEdition')}</th>
                      <th className="pl-2 pr-2 py-2 text-left">{t('search.thName')}</th>
                      <th className="px-2 py-2 whitespace-nowrap align-middle text-center">{t('search.thNumber')}</th>
                      <th className="px-2 py-2 whitespace-nowrap align-middle text-center">{t('search.thRarity')}</th>
                      <th className="px-2 py-2 whitespace-nowrap align-middle text-center">{t('search.thAvailable')}</th>
                      <th className="px-2 py-2 whitespace-nowrap align-middle text-center">{t('search.thFrom')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeHits.map((hit) => {
                      const productHref = `/products/${hit.id}`;
                      const imgUrl = getCardImageUrl(hit.image ?? null);
                      const { primary, secondary } = getCardDisplayNames(hit, selectedLang);
                      return (
                        <tr
                          key={hit.id}
                          className="border-b border-gray-100 cursor-pointer hover:bg-orange-50/50 transition-colors"
                          role="button"
                          tabIndex={0}
                          onClick={() => (window.location.href = productHref)}
                          onKeyDown={(e) => e.key === 'Enter' && (window.location.href = productHref)}
                        >
                          <td className="pl-2 pr-0 py-2 align-middle min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="relative w-9 h-14 shrink-0 rounded-md border border-gray-200 bg-[#f2f2f7] overflow-hidden">
                                {imgUrl ? (
                                  <Image src={imgUrl} alt={primary} fill className="object-cover" sizes="36px" />
                                ) : (
                                  <div className="w-full h-full bg-gray-200" />
                                )}
                              </div>
                              <span className="min-w-0 text-[11px] leading-tight text-gray-600 font-medium truncate max-w-[6.5rem]">
                                {hit.set_name ?? '–'}
                              </span>
                            </div>
                          </td>
                          <td className="pl-2 pr-2 py-2 text-left align-middle min-w-0">
                            <div className="flex flex-col justify-center gap-0.5 min-w-0">
                              <span className="text-sm font-semibold leading-tight text-gray-900 truncate break-words">
                                {primary}
                              </span>
                              {secondary && (
                                <p className="text-xs text-gray-500 truncate italic font-light leading-tight">{secondary}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-center text-gray-600 align-middle">
                            {hit.collector_number ?? '–'}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-center text-gray-600 align-middle">
                            {hit.rarity ?? '–'}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-center text-gray-600 align-middle">–</td>
                          <td className="px-2 py-2 whitespace-nowrap text-center text-gray-600 align-middle">–</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

