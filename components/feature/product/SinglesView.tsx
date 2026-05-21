'use client';

/**
 * Pagina Singles – layout marketplace compatto:
 * Breadcrumb Prodotti (game) / Singles, filtri (Categoria, Edizione, Nome, Nome esatto, Solo disponibile),
 * CERCA, Mostra opzioni filtri, Ordina per, VISTA LISTA / VISTA GRIGLIA, dati da /api/search (Meilisearch).
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ChevronDown, ChevronLeft, ChevronRight, Rows3, Grid2x2, X } from 'lucide-react';
import { getCardImageUrl } from '@/lib/assets';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { RarityLegendProvider } from '@/components/ui/RarityLegendProvider';
import { SearchResultsTable } from '@/components/feature/search/SearchResultsTable';
import type { SearchHit } from '@/app/api/search/route';
import type { GameSlug } from '@/lib/contexts/GameContext';
import { normalizeGameSlug, type GameSlug as SearchGameSlug } from '@/lib/search/category-mapping';
import { cn, formatEuroNoSpace } from '@/lib/utils';

const BACKEND_LANG_ORDER = ['en', 'de', 'es', 'fr', 'it', 'pt'] as const;
type SupportedLang = (typeof BACKEND_LANG_ORDER)[number];

function normalizeLang(lang: string): SupportedLang {
  return BACKEND_LANG_ORDER.includes(lang as SupportedLang) ? (lang as SupportedLang) : 'en';
}

function getLocalizedName(keywords: string[] | undefined, lang: string): string | null {
  if (!keywords?.length) return null;
  const l = normalizeLang(lang);
  const idx = BACKEND_LANG_ORDER.indexOf(l);
  if (idx < 0 || !keywords[idx]) return null;
  const raw = keywords[idx];
  return (typeof raw === 'string' ? raw : '').trim() || null;
}

function getDisplayNames(
  hit: SearchHit,
  currentLang: string
): { primary: string; secondary: string | null } {
  const primary = getLocalizedName(hit.keywords_localized, currentLang) ?? hit.name;
  const secondary = currentLang !== 'en' ? hit.name : null;
  return { primary, secondary };
}

const GAME_LABELS: Record<string, string> = {
  mtg: 'MAGIC: THE GATHERING',
  op: 'ONE PIECE',
  pokemon: 'POKÉMON',
};

const GAME_TO_MEILISEARCH: Record<string, string> = {
  mtg: 'mtg',
  pokemon: 'pokemon',
  op: 'one-piece',
};

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Più popolare' },
  { value: 'name_desc', label: 'Nome Z-A' },
  { value: 'set_asc', label: 'Edizione A-Z' },
  { value: 'set_desc', label: 'Edizione Z-A' },
  { value: 'price_asc', label: 'Prezzo crescente' },
  { value: 'price_desc', label: 'Prezzo decrescente' },
] as const;

type ViewMode = 'list' | 'grid';

interface SearchApiResponse {
  hits: SearchHit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Hit esteso con campi opzionali restituiti da Meilisearch (rarity, collector_number, prezzi). */
type SinglesHit = SearchHit & {
  rarity?: string;
  collector_number?: string;
  market_price?: number;
  foil_price?: number;
};

const BRAND_ORANGE = '#FF8800';

export interface ProductCategoryViewProps {
  game: GameSlug | null;
  /** Titolo pagina (es. "Singles", "Boosters") */
  title: string;
  /** Sottotitolo descrittivo */
  subtitle?: string;
  /** Slug per URL (es. "singles", "boosters") */
  categorySlug: string;
  /** Testo per il select Categoria */
  categoryLabel: string;
  /** Opzionale: category_id per filtrare su Meilisearch (sealed, boosters, ecc.) */
  categoryId?: number;
  /** Mostra colonne Numero e Rarità (solo per singles) */
  showCardDetails?: boolean;
}

export function ProductCategoryView({
  game: gameSlug,
  title,
  subtitle,
  categorySlug,
  categoryLabel,
  categoryId,
  showCardDetails = false,
}: ProductCategoryViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedLang } = useLanguage();

  const gameFromUrl = searchParams.get('game');
  const effectiveGame = ((gameFromUrl as GameSlug) || gameSlug) ?? 'mtg';
  const apiGame = GAME_TO_MEILISEARCH[effectiveGame] || effectiveGame;
  const gameLabel = GAME_LABELS[effectiveGame] ?? effectiveGame.toUpperCase();

  const q = (searchParams.get('q') ?? '').trim();
  const setFilter = searchParams.get('set') ?? '';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const sortParam = (searchParams.get('sort') ?? 'name_asc') as string;

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [nomeInput, setNomeInput] = useState(q);
  const [edizioneInput, setEdizioneInput] = useState(setFilter);
  const [raritaInput, setRaritaInput] = useState('');
  const [isRarityOpen, setIsRarityOpen] = useState(false);
  const [data, setData] = useState<SearchApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNomeInput(q);
    setEdizioneInput(setFilter);
  }, [q, setFilter]);

  const buildUrl = useCallback(
    (updates: Record<string, string>) => {
      const p = new URLSearchParams(searchParams.toString());
      if (!p.get('game')) p.set('game', effectiveGame);
      Object.entries(updates).forEach(([k, v]) => {
        if (v) p.set(k, v);
        else p.delete(k);
      });
      return `/products/${categorySlug}?${p.toString()}`;
    },
    [searchParams, effectiveGame, categorySlug]
  );

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set('game', apiGame);
    // Nome + Edizione in un'unica query: Meilisearch cerca in tutti i campi searchable (es. name, set_name)
    // così "Alpha" o "30th" trovano i set senza richiedere il nome esatto del set.
    const queryParts: string[] = [];
    if (nomeInput.trim()) {
      queryParts.push(nomeInput.trim());
    }
    if (edizioneInput.trim()) {
      queryParts.push(edizioneInput.trim());
    }
    const q = queryParts.join(' ');
    if (q) params.set('q', q);
    if (categoryId != null) params.set('category_id', String(categoryId));
    params.set('page', String(pageParam));
    params.set('limit', '30');
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
  }, [apiGame, nomeInput, edizioneInput, categoryId, pageParam, sortParam]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const total = data?.total ?? 0;
  const hits = (data?.hits ?? []) as SinglesHit[];
  const currentPage = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;

  const handleCerca = () => {
    router.push(buildUrl({ q: nomeInput.trim(), set: edizioneInput.trim(), page: '1' }));
  };

  const formatEuro = (n: number | undefined) =>
    n != null ? formatEuroNoSpace(n, 'it-IT') : '–';
  const { t } = useTranslation();

  return (
    <RarityLegendProvider>
    <section className="min-h-screen pb-12 bg-[#F0F0F0]">
      {/* ─── Hero Header ─── */}
      {['singles', 'boosters', 'booster-boxes'].includes(categorySlug) && (
        <div className="bg-gradient-to-b from-[#3D65C6] to-[#1D3160] text-white">
          <div className="container-content px-4 sm:px-6 pt-8 pb-10 sm:pt-10 sm:pb-12">
            {/* Titolo */}
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide mb-1">
              {title}
            </h1>
            {/* Sottotitolo */}
            {subtitle && (
              <p className="text-xs sm:text-sm font-medium uppercase tracking-widest text-white/70 mb-6">
                {subtitle}
              </p>
            )}

            {/* ─── Filter Card ─── */}
            <div className="rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/[0.12] shadow-lg px-5 sm:px-6 py-5">
              <div className="flex flex-wrap items-end gap-4 sm:gap-5">
                {/* Edizione */}
                <div className="flex flex-col gap-1.5 min-w-[160px] flex-1">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">Edizione</span>
                  <div className="relative flex items-center h-10 rounded-lg border border-white/20 bg-white/[0.06] focus-within:border-[#FF8800] focus-within:bg-white/[0.1] transition-all">
                    <input
                      type="text"
                      value={edizioneInput}
                      onChange={(e) => setEdizioneInput(e.target.value)}
                      placeholder="Tutte le edizioni"
                      className="h-full w-full bg-transparent px-3 text-sm text-white placeholder:text-white/40 outline-none"
                    />
                    {edizioneInput && (
                      <button
                        type="button"
                        onClick={() => setEdizioneInput('')}
                        className="p-2 text-white/50 hover:text-white transition-colors focus:outline-none"
                        aria-label="Cancella edizione"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Rarità Coustom Dropdown (mostrato solo se 'singles') */}
                {categorySlug === 'singles' && (
                  <div className="flex flex-col gap-1.5 min-w-[130px] relative">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">Rarità</span>
                    <div className="relative h-10 w-full">
                      <button
                        type="button"
                        onClick={() => setIsRarityOpen(!isRarityOpen)}
                        className="h-full w-full flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/[0.06] hover:bg-white/[0.1] px-3 text-sm text-white outline-none focus:border-[#FF8800] transition-all cursor-pointer"
                      >
                        {raritaInput === 'common' ? 'Common' :
                         raritaInput === 'uncommon' ? 'Uncommon' :
                         raritaInput === 'rare' ? 'Rare' :
                         raritaInput === 'mythic' ? 'Mythic Rare' : 'Tutte'}
                        <ChevronDown className="h-4 w-4 text-white/60 ml-1" />
                      </button>

                      {isRarityOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsRarityOpen(false)} />
                          <div className="absolute top-[calc(100%+6px)] left-0 w-full rounded-lg border border-white/20 bg-[#14234b]/95 shadow-xl z-50 overflow-hidden backdrop-blur-md flex flex-col py-1">
                            {[
                              { v: '', l: 'Tutte' },
                              { v: 'common', l: 'Common' },
                              { v: 'uncommon', l: 'Uncommon' },
                              { v: 'rare', l: 'Rare' },
                              { v: 'mythic', l: 'Mythic Rare' },
                            ].map(opt => (
                              <button
                                key={opt.v}
                                type="button"
                                className={`w-full text-center px-3 py-2 text-sm text-white hover:bg-[#FF8800]/20 transition-colors ${raritaInput === opt.v ? 'bg-[#FF8800] hover:bg-[#FF8800]' : ''}`}
                                onClick={() => {
                                  setRaritaInput(opt.v);
                                  setIsRarityOpen(false);
                                }}
                              >
                                {opt.l}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Nome */}
                <div className="flex flex-col gap-1.5 flex-[2] min-w-[200px]">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">Nome</span>
                  <div className="relative flex items-center h-10 rounded-lg border border-white/20 bg-white/[0.06] focus-within:border-[#FF8800] focus-within:bg-white/[0.1] transition-all">
                    <input
                      type="text"
                      value={nomeInput}
                      onChange={(e) => setNomeInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCerca()}
                      placeholder="Cerca per nome"
                      className="h-full w-full bg-transparent px-3 text-sm text-white placeholder:text-white/40 outline-none"
                    />
                    {nomeInput && (
                      <button
                        type="button"
                        onClick={() => setNomeInput('')}
                        className="p-2 text-white/50 hover:text-white transition-colors focus:outline-none"
                        aria-label="Cancella nome"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Pulsante Cerca */}
                <button
                  type="button"
                  onClick={handleCerca}
                  className="h-10 px-6 rounded-lg bg-[#FF8800]/20 hover:bg-[#FF8800]/30 backdrop-blur-md border border-[#FF8800]/50 active:scale-[0.97] text-white text-sm font-bold flex items-center gap-2 transition-all shrink-0 shadow-[0_4_15px_rgba(255,136,0,0.25)]"
                >
                  <Search className="h-4 w-4 text-white" strokeWidth={2.5} />
                  CERCA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container-content py-4 sm:py-6">

        {/* Barra risultati + vista lista/griglia */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 border border-gray-200 rounded-lg bg-white mb-4">
          <p className="text-gray-700 text-sm">
            <strong>{total}</strong> Risultati
          </p>
          <div className="flex h-10 overflow-hidden rounded-full bg-gray-100">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="Vista lista"
              title="Vista lista"
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
              aria-label="Vista griglia"
              title="Vista griglia"
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

        {/* Contenuto: tabella lista o griglia */}
        <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm search-results-card">
          {error && (
            <div className="p-6 text-center text-red-600 bg-red-50">{error}</div>
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
            <SearchResultsTable
              hits={hits}
              selectedLang={selectedLang}
              gameSlug={normalizeGameSlug(effectiveGame) as SearchGameSlug | null}
              t={t}
              editionVariant="text"
              showCardDetails={showCardDetails}
              formatPrice={(hit) => formatEuro((hit as SinglesHit).market_price)}
            />
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
                    className="group border border-gray-200 rounded-lg bg-white p-3 hover:border-[#FF8800] hover:shadow-md transition-all"
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
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No img
                        </div>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm line-clamp-2">{primary}</p>
                    {secondary && (
                      <p className="text-xs text-gray-500 line-clamp-1">{secondary}</p>
                    )}
                    {hit.set_name && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{hit.set_name}</p>
                    )}
                    <p className="font-semibold text-sm mt-1" style={{ color: BRAND_ORANGE }}>
                      Da {formatEuro((hit as SinglesHit).market_price)}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Paginazione */}
          {!loading && !error && totalPages > 1 && (
            <div
              className="flex items-center justify-center gap-2 py-4 px-4 text-white"
              style={{ backgroundColor: BRAND_ORANGE }}
            >
              <Link
                href={buildUrl({ page: String(Math.max(1, currentPage - 1)) })}
                className={cn(
                  'p-2 rounded transition-opacity',
                  currentPage <= 1 ? 'opacity-50 pointer-events-none' : 'hover:opacity-90'
                )}
                aria-label="Pagina precedente"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <span className="px-4 font-bold uppercase text-sm">
                Pagina {currentPage} di {totalPages}
              </span>
              <Link
                href={buildUrl({ page: String(Math.min(totalPages, currentPage + 1)) })}
                className={cn(
                  'p-2 rounded transition-opacity',
                  currentPage >= totalPages ? 'opacity-50 pointer-events-none' : 'hover:opacity-90'
                )}
                aria-label="Pagina successiva"
              >
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
    </RarityLegendProvider>
  );
}

/** Wrapper per la pagina Singles: stessa UI con titolo e categoria "Singles". */
export function SinglesView({ game }: { game: GameSlug | null }) {
  return (
    <ProductCategoryView
      game={game}
      title="Singles"
      subtitle="Esplora la collezione completa di carte singole Magic: The Gathering"
      categorySlug="singles"
      categoryLabel="Singles"
      showCardDetails={true}
    />
  );
}
