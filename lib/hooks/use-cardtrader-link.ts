'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { linkCardTraderAndStartImport } from '@/lib/sync/cardtrader-link-flow';

export function useCardTraderLink({
  userId,
  accessToken,
}: {
  userId: string | undefined;
  accessToken: string | null;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardTraderToken: string) => {
      if (!userId || !accessToken) {
        throw new Error('AUTH_REQUIRED');
      }
      return linkCardTraderAndStartImport(userId, accessToken, cardTraderToken);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['account-inventory', userId] }),
        queryClient.invalidateQueries({ queryKey: ['marketplace-sync-status'] }),
        queryClient.invalidateQueries({ queryKey: ['sync-status', userId] }),
      ]);
    },
  });
}
