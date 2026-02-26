'use client';

/**
 * Pagina risultati ricerca – layout come screenshot BRX:
 * Breadcrumb, filtri (Categoria, Edizione, Rarità, Nome), vista Lista/Griglia, paginazione.
 * Dati da API /api/search (Meilisearch).
 * Nome: in lingua selezionata (principale) e sotto in inglese se lingua !== en.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, LayoutList, LayoutGrid } from 'lucide-react';
import { getCardImageUrl } from '@/lib/assets';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import type { SearchHit } from '@/app/api/search/route';

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

const GAME_BREADCRUMB: Record<string, string> = {
  mtg: 'MAGIC: THE GATHERING',
  op: 'ONE PIECE',
  pokemon: 'POKÉMON',
};

/** Slug usati nell’URL/frontend → slug in Meilisearch/DB (per filtro API). */
const GAME_TO_MEILISEARCH: Record<string, string> = {
  mtg: 'mtg',
  pokemon: 'pokemon',
  op: 'one-piece',
};

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Nome A-Z' },
  { value: 'name_desc', label: 'Nome Z-A' },
  { value: 'price_asc', label: 'Prezzo Sù' },
  { value: 'price_desc', label: 'Prezzo Giù' },
  { value: 'set_asc', label: 'Edizione A-Z' },
  { value: 'set_desc', label: 'Edizione Z-A' },
] as const;

type ViewMode = 'list' | 'grid';

interface SearchApiResponse {
  hits: SearchHit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function SearchResults({
  query: initialQuery,
  category: initialCategory,
  categoryLabel,
}: {
  query: string;
  category: string;
  categoryLabel: string;
}) {
  const router = useRouter();
  const { selectedLang } = useLanguage();
  const searchParams = useSearchParams();
  const q = (searchParams.get('q') ?? initialQuery ?? '').trim();
  const game = searchParams.get('game') ?? '';
  const setFilter = searchParams.get('set') ?? '';
  const categoryId = searchParams.get('category_id') ?? '';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const sortParam = searchParams.get('sort') ?? 'name_asc';

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [nomeInput, setNomeInput] = useState(q);
  const [edizioneInput, setEdizioneInput] = useState(setFilter);
  const [data, setData] = useState<SearchApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNomeInput(q);
    setEdizioneInput(setFilter);
  }, [q, setFilter]);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    const apiGame = game ? (GAME_TO_MEILISEARCH[game] || game) : '';
    if (apiGame) params.set('game', apiGame);
    if (setFilter) params.set('set', setFilter);
    if (categoryId) params.set('category_id', categoryId);
    params.set('page', String(pageParam));
    params.set('limit', '20');
    params.set('sort', sortParam);
    try {
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || j?.detail || `Errore ${res.status}`);
      }
      const json: SearchApiResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [q, game, setFilter, categoryId, pageParam, sortParam]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const total = data?.total ?? 0;
  const hits = data?.hits ?? [];
  const currentPage = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;

  const gameLabel = game ? GAME_BREADCRUMB[game] ?? game.toUpperCase() : '';

  const buildSearchUrl = (updates: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) p.set(k, v);
      else p.delete(k);
    });
    return `/search?${p.toString()}`;
  };

  const handleCerca = () => {
    const newQ = nomeInput.trim();
    const newSet = edizioneInput.trim();
    const params: Record<string, string> = { page: '1' };
    if (newQ) params.q = newQ;
    if (newSet) params.set = newSet;
    window.location.href = buildSearchUrl(params);
  };

  return (
    <section className="min-h-screen pb-12" style={{ backgroundColor: '#193874' }}>
      <div className="container-content py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-white/80 text-sm mb-2">
          <Link href="/" className="hover:text-white">
            {gameLabel || 'GIOCHI'}
          </Link>
          <span>/</span>
          <span>SINGLES</span>
          {setFilter && (
            <>
              <span>/</span>
              <span className="text-white">{setFilter}</span>
            </>
          )}
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-wide mb-1">
          SINGLES
        </h1>
        <p className="text-white/90 text-sm md:text-base mb-6">
          ESPLORA LA COLLEZIONE COMPLETA DI CARTE SINGOLE {gameLabel || ''}
        </p>

        {/* Pannello filtri – sfondo chiaro arrotondato */}
        <div className="rounded-2xl bg-white/95 shadow-lg p-4 md:p-6 mb-4">
          <div className="flex flex-wrap items-end gap-3 md:gap-4">
            <div className="flex flex-wrap gap-2 md:gap-4 items-end">
              <label className="flex flex-col gap-1 text-gray-700 text-xs font-medium uppercase">
                Categoria
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[140px] bg-white"
                  value={categoryId ? (categoryId === '1' ? 'carte-singole' : '') : ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    window.location.href = buildSearchUrl({
                      category_id: v === 'carte-singole' ? '1' : '',
                      page: '1',
                    });
                  }}
                >
                  <option value="">Tutte</option>
                  <option value="carte-singole">Carte singole</option>
                  <option value="mazzi">Mazzi</option>
                  <option value="boosters">Boosters</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-gray-700 text-xs font-medium uppercase">
                Edizione
                <input
                  type="text"
                  placeholder="Set/Edizione"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[140px]"
                  value={edizioneInput}
                  onChange={(e) => setEdizioneInput(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-gray-700 text-xs font-medium uppercase">
                Rarità
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[120px] bg-white"
                  disabled
                  title="Presto disponibile"
                >
                  <option value="">Tutte</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-gray-700 text-xs font-medium uppercase">
                Nome
                <input
                  type="text"
                  placeholder="CERCA PER NOME"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[180px]"
                  value={nomeInput}
                  onChange={(e) => setNomeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCerca()}
                />
              </label>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="radio" name="nomeMode" defaultChecked /> Nome esatto
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="radio" name="nomeMode" /> Solo disponibile
              </label>
            </div>
            <button
              type="button"
              onClick={handleCerca}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              CERCA
            </button>
          </div>
        </div>

        {/* Barra risultati + ordinamento + vista */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 rounded-xl bg-gray-100/90 mb-4">
          <p className="text-gray-700 text-sm">
            <strong>{total}</strong> RISULTATI
            {total > 0 && (
              <span className="ml-2 text-gray-500">
                – Vuoi usare la ricerca avanzata singole?
              </span>
            )}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">ORDINA PER</span>
              <select
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                value={sortParam}
                onChange={(e) => {
                  window.location.href = buildSearchUrl({ sort: e.target.value, page: '1' });
                }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex rounded-lg overflow-hidden border border-gray-300">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium flex items-center gap-1 ${
                  viewMode === 'list'
                    ? 'bg-[#193874] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                VISTA LISTA
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm font-medium flex items-center gap-1 ${
                  viewMode === 'grid'
                    ? 'bg-[#193874] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                VISTA GRIGLIA
              </button>
            </div>
          </div>
        </div>

        {/* Contenuto: lista o griglia */}
        <div className="rounded-2xl bg-white shadow-lg overflow-hidden">
          {error && (
            <div className="p-6 text-center text-red-600 bg-red-50">
              {error}
            </div>
          )}
          {loading && (
            <div className="p-12 text-center text-gray-500">Caricamento...</div>
          )}
          {!loading && !error && hits.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              Nessun risultato. Prova a cambiare filtri o termine di ricerca.
            </div>
          )}
          {!loading && !error && hits.length > 0 && viewMode === 'list' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-left text-gray-600 uppercase text-xs font-semibold">
                    <th className="p-3">NOME</th>
                    <th className="p-3">NUMERO</th>
                    <th className="p-3">RARITÀ</th>
                    <th className="p-3">DISPONIBILE</th>
                    <th className="p-3">DA</th>
                    <th className="p-3">ASTA</th>
                    <th className="p-3">SCAMBI</th>
                  </tr>
                </thead>
                <tbody>
                  {hits.map((hit) => {
                    const productHref = `/products/${hit.id}`;
                    const imgUrl = getCardImageUrl(hit.image ?? null);
                    const { primary, secondary } = getDisplayNames(hit, selectedLang);
                    return (
                      <tr
                        key={hit.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(productHref)}
                        onKeyDown={(e) => e.key === 'Enter' && router.push(productHref)}
                        className="border-b border-gray-100 hover:bg-orange-50/80 cursor-pointer transition-colors"
                      >
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={productHref}
                            className="flex items-center gap-3 hover:text-orange-600"
                            aria-label={`Dettaglio: ${primary}`}
                          >
                            {imgUrl ? (
                              <div className="relative w-10 h-14 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                <Image
                                  src={imgUrl}
                                  alt={primary}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-14 rounded bg-gray-200 flex-shrink-0" />
                            )}
                            <div>
                              <span className="font-medium text-gray-900">{primary}</span>
                              {secondary && (
                                <p className="text-xs text-gray-500">{secondary}</p>
                              )}
                              {hit.set_name && (
                                <p className="text-xs text-gray-500">{hit.set_name}</p>
                              )}
                            </div>
                          </Link>
                        </td>
                        <td className="p-3 text-gray-500">–</td>
                        <td className="p-3 text-gray-500">–</td>
                        <td className="p-3 text-gray-500">–</td>
                        <td className="p-3 text-orange-600 font-semibold">–</td>
                        <td className="p-3 text-gray-500">NO</td>
                        <td className="p-3 text-gray-500">NO</td>
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
                    className="group rounded-xl border border-gray-200 bg-white p-3 hover:border-orange-300 hover:shadow-md transition-all"
                  >
                    <div className="relative aspect-[63/88] rounded-lg overflow-hidden bg-gray-100 mb-2">
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
                          No img
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
                    <p className="text-orange-600 font-semibold text-sm mt-1">DA – €</p>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Paginazione */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4 px-4 bg-orange-500 text-white">
              <Link
                href={buildSearchUrl({ page: String(Math.max(1, currentPage - 1)) })}
                className={`p-2 rounded ${currentPage <= 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-orange-600'}`}
                aria-label="Pagina precedente"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <span className="px-4 font-medium">
                PAGINA {currentPage} DI {totalPages}
              </span>
              <Link
                href={buildSearchUrl({ page: String(Math.min(totalPages, currentPage + 1)) })}
                className={`p-2 rounded ${currentPage >= totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-orange-600'}`}
                aria-label="Pagina successiva"
              >
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
