import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import {
  fetchCardsByBlueprintIds,
  type BlueprintToCardMap,
} from '@/lib/meilisearch-cards-by-ids';

export function useMeilisearchCards(
  blueprintIds: number[],
  filterField = 'cardtrader_id',
  options?: Partial<UseQueryOptions<BlueprintToCardMap>>,
) {
  return useQuery<BlueprintToCardMap>({
    queryKey: ['meilisearch-cards', blueprintIds, filterField],
    queryFn: () => fetchCardsByBlueprintIds(blueprintIds, filterField),
    enabled: blueprintIds.length > 0,
    staleTime: 5 * 60_000,
    placeholderData: {},
    ...options,
  });
}
