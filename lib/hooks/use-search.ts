import {
  useInfiniteQuery,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import type { SearchApiResponse, SearchHit } from '@/app/api/search/route';
import type { SearchAvailabilityResponse } from '@/app/api/search/availability/route';
import type { SetResult } from '@/lib/search/global-search-types';
import { STALE } from '@/lib/hooks/query-config';

export type { SearchApiResponse, SearchHit };

export interface SearchParams {
  q?: string;
  game?: string;
  set?: string;
  category_id?: number | null;
  category_ids?: number[];
  page?: number;
  limit?: number;
  sort?: string;
  exact_mode?: boolean;
  show_similar?: boolean;
}

function toSearchUrl(params: SearchParams): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.game) sp.set('game', params.game);
  if (params.set) sp.set('set', params.set);
  if (params.category_ids && params.category_ids.length > 0) {
    sp.set('category_ids', params.category_ids.join(','));
  } else if (params.category_id != null) {
    sp.set('category_id', String(params.category_id));
  }
  if (params.page != null) sp.set('page', String(params.page));
  if (params.limit != null) sp.set('limit', String(params.limit));
  if (params.sort) sp.set('sort', params.sort);
  if (params.exact_mode) sp.set('exact_mode', 'true');
  if (params.show_similar) sp.set('show_similar', 'true');
  return `/api/search?${sp.toString()}`;
}

async function fetchSearch(params: SearchParams): Promise<SearchApiResponse> {
  const res = await fetch(toSearchUrl(params));
  if (!res.ok) {
    const j = await res.json().catch(() => ({})) as { error?: string; detail?: string };
    throw new Error(j?.error ?? j?.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export function useSearchCards(
  params: SearchParams,
  options?: Partial<UseQueryOptions<SearchApiResponse>>,
) {
  return useQuery<SearchApiResponse>({
    queryKey: ['search', 'cards', params],
    queryFn: () => fetchSearch(params),
    staleTime: STALE.catalog,
    ...options,
  });
}

export interface SearchAvailabilityCard {
  cardId: string;
  blueprintId: number;
}

async function fetchSearchAvailability(
  cards: SearchAvailabilityCard[],
): Promise<SearchAvailabilityResponse> {
  const res = await fetch('/api/search/availability', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cards }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<SearchAvailabilityResponse>;
}

/** Numero venditori reale per i risultati visibili, aggregato dal BFF. */
export function useSearchAvailability(cards: SearchAvailabilityCard[]) {
  return useQuery<SearchAvailabilityResponse>({
    queryKey: ['search', 'availability', cards],
    queryFn: () => fetchSearchAvailability(cards),
    enabled: cards.length > 0,
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Variante paginata "carica altri": stessa query di useSearchCards ma con
 * useInfiniteQuery — ogni fetchNextPage() accoda la pagina successiva finché
 * esistono altri risultati (page < totalPages). Usata dai picker (es. crea
 * asta) al posto della paginazione a pagine.
 */
export function useInfiniteSearchCards(
  params: Omit<SearchParams, 'page'>,
  options?: { enabled?: boolean },
) {
  return useInfiniteQuery({
    queryKey: ['search', 'cards-infinite', params],
    queryFn: ({ pageParam }) => fetchSearch({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: STALE.catalog,
    enabled: options?.enabled,
  });
}

export interface SetSearchParams {
  q?: string;
  game?: string;
  limit?: number;
}

async function fetchSets(params: SetSearchParams): Promise<SetResult[]> {
  const sp = new URLSearchParams({ q: params.q ?? '', limit: String(params.limit ?? 8) });
  if (params.game) sp.set('game', params.game);
  const res = await fetch(`/api/sets?${sp.toString()}`);
  if (!res.ok) {
    const j = await res.json().catch(() => ({})) as { error?: string; detail?: string };
    throw new Error(j?.error ?? j?.detail ?? `HTTP ${res.status}`);
  }
  const data: unknown = await res.json();
  return Array.isArray(data) ? (data as SetResult[]) : [];
}

/** Set/espansione autocomplete (modalità "sets" della search bar). */
export function useSetSearch(
  params: SetSearchParams,
  options?: Partial<UseQueryOptions<SetResult[]>>,
) {
  return useQuery<SetResult[]>({
    queryKey: ['search', 'sets', params.q ?? '', params.game ?? ''],
    queryFn: () => fetchSets(params),
    staleTime: STALE.catalog,
    ...options,
  });
}

/**
 * Fetches ALL pages for a set page sequentially (limit=100 per page).
 * Returns the flat merged hits array, exposing loading/error like any query.
 */
export function useSetPageCards(
  game: string,
  setName: string,
  search: string,
  options?: Partial<UseQueryOptions<SearchHit[]>>,
) {
  return useQuery<SearchHit[]>({
    queryKey: ['search', 'set-page', game, setName, search],
    queryFn: async () => {
      const base: SearchParams = {
        q: search || setName,
        game,
        set: setName,
        limit: 100,
        sort: 'name_asc',
      };
      const first = await fetchSearch({ ...base, page: 1 });
      const totalPages = search ? 1 : Math.max(1, first.totalPages ?? 1);
      const all: SearchHit[] = Array.isArray(first.hits) ? first.hits : [];

      if (totalPages > 1) {
        // Pagine 2..N in parallelo con concorrenza limitata, preservando
        // l'ordine: ogni risultato è indicizzato per posizione e poi appiattito.
        const restPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
        const CONCURRENCY = 5;
        const pageHits: SearchHit[][] = new Array(restPages.length);
        let cursor = 0;
        const worker = async () => {
          while (cursor < restPages.length) {
            const idx = cursor++;
            // Niente catch: una pagina fallita fa fallire la query (React Query
            // riprova), invece di mostrare un set incompleto in silenzio.
            const next = await fetchSearch({ ...base, page: restPages[idx] });
            pageHits[idx] = Array.isArray(next.hits) ? next.hits : [];
          }
        };
        await Promise.all(
          Array.from({ length: Math.min(CONCURRENCY, restPages.length) }, () => worker()),
        );
        for (const hits of pageHits) all.push(...hits);
      }
      return all;
    },
    enabled: Boolean(game && setName),
    staleTime: 2 * 60_000,
    ...options,
  });
}
