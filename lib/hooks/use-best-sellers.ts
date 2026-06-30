import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import {
  getPublicBestSellers,
  type PublicBestSellersResponse,
} from '@/lib/api/marketplace-client';

/**
 * Feed "best sellers": carte realmente in vendita dai venditori registrati.
 * Consuma `GET /listings/public/best-sellers` (vedi contratto in marketplace-client).
 *
 * `retry: false` perché l'endpoint backend potrebbe non essere ancora attivo: in
 * tal caso la query fallisce subito e il chiamante fa fallback al catalogo, senza
 * martellare il marketplace con retry.
 */
export function useBestSellers(
  params: { game?: string; limit?: number },
  options?: Partial<UseQueryOptions<PublicBestSellersResponse>>,
) {
  return useQuery<PublicBestSellersResponse>({
    queryKey: ['best-sellers', params],
    queryFn: () => getPublicBestSellers(params),
    // Dato listing semi-live: freschezza breve, ma non aggressiva per una hero di home.
    staleTime: 60_000,
    retry: false,
    ...options,
  });
}
