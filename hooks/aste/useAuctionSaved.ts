'use client';

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { savedApi } from '@/lib/api/auction-client';

export interface UseAuctionSavedParams {
  numericId: number;
  isAuthenticated: boolean;
  currentUserId: string | number | null;
}

export interface UseAuctionSavedReturn {
  isSaved: boolean;
  /** Salva (true) o rimuove (false) l'asta; invalida le query saved-auctions. */
  setSaved: (shouldSave: boolean) => Promise<unknown>;
}

/**
 * Stato "salva per dopo" dell'asta: query stato + mutazione save/unsave con
 * invalidazione. Estratto da AsteDetailView, comportamento identico.
 */
export function useAuctionSaved({
  numericId,
  isAuthenticated,
  currentUserId,
}: UseAuctionSavedParams): UseAuctionSavedReturn {
  const queryClient = useQueryClient();

  const savedStatusQuery = useQuery({
    queryKey: ['saved-auctions', 'status', numericId, currentUserId],
    queryFn: () => savedApi.getSavedStatus(numericId),
    enabled: isAuthenticated && !Number.isNaN(numericId) && numericId > 0,
    staleTime: 10_000,
  });

  const savedMutation = useMutation({
    mutationFn: async (shouldSave: boolean) => {
      if (shouldSave) return savedApi.saveAuction(numericId);
      await savedApi.unsaveAuction(numericId);
      return { success: true, data: { saved: false } };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-auctions', 'status', numericId, currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['saved-auctions', 'list', currentUserId] });
    },
  });

  const isSaved = Boolean(savedStatusQuery.data?.data?.saved);
  const setSaved = useCallback(
    (shouldSave: boolean) => savedMutation.mutateAsync(shouldSave),
    [savedMutation],
  );

  return { isSaved, setSaved };
}
