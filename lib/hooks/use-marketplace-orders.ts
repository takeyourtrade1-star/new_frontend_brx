import { useQuery } from '@tanstack/react-query';

import { getMyOrders } from '@/lib/api/marketplace-client';

/** Ordini marketplace dell'utente via React Query (regola §2). */
export function useMyMarketplaceOrders(enabled = true, pageSize = 50) {
  return useQuery({
    queryKey: ['marketplace', 'my-orders', pageSize],
    queryFn: () => getMyOrders({ page: 1, page_size: pageSize }),
    enabled,
    staleTime: 30_000,
  });
}
