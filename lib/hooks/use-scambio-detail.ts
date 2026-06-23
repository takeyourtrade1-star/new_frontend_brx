'use client';

import { useQuery } from '@tanstack/react-query';
import type { ScambioUI } from '@/components/feature/scambi/scambi-types';
import { fetchScambioById, getScambioById } from '@/lib/scambi/scambi-catalog';

/**
 * Dettaglio scambio via React Query (regola §2).
 * Usa la cache sincrona del catalogo come `initialData`: se la riga è già nota
 * non rifetcha, altrimenti scarica via `fetchScambioById`.
 */
export function useScambioDetail(scambioId: string) {
  return useQuery<ScambioUI | null>({
    queryKey: ['scambio', 'detail', scambioId],
    queryFn: () => fetchScambioById(scambioId),
    initialData: () => getScambioById(scambioId) ?? undefined,
    enabled: Boolean(scambioId),
    staleTime: 60_000,
  });
}
