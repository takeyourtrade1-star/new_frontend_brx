import { useQuery } from '@tanstack/react-query';

import { getMyOrders } from '@/lib/api/marketplace-client';
import { useAuthStore } from '@/lib/stores/auth-store';

/** Ordini marketplace dell'utente via React Query (regola §2). */
export function useMyMarketplaceOrders(enabled = true, pageSize = 50) {
  const owner = useAuthStore((state) => state.user?.id || 'anonymous');
  return useQuery({
    queryKey: ['marketplace', owner, 'my-orders', pageSize],
    queryFn: () => getMyOrders({ page: 1, page_size: pageSize }),
    enabled,
    staleTime: 30_000,
  });
}
