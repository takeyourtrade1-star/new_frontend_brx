import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { SearchApiResponse, SearchHit } from '@/app/api/search/route';

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
    staleTime: 60_000,
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

      for (let page = 2; page <= totalPages; page++) {
        const next = await fetchSearch({ ...base, page }).catch(() => null);
        if (next?.hits) all.push(...next.hits);
      }
      return all;
    },
    enabled: Boolean(game && setName),
    staleTime: 2 * 60_000,
    ...options,
  });
}
