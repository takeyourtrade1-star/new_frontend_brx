'use client';

import { useCallback, useState } from 'react';

import { parseLocaleMoneyInput, roundUpToHalfStep } from '@/lib/auction/bid-math';
import { formatAuctionEur } from '@/lib/auction/auction-detail-utils';
import { useCancelProxyLimit, useUpdateProxyLimit } from '@/lib/hooks/use-auctions';

export type ProxyNoticeKind = 'success' | 'warning';

export interface UseAuctionProxyBiddingParams {
  numericId: number;
  /** Limite proxy corrente (posseduto dal componente, usato anche nel render). */
  myMaxBidEur: number | null;
  setMyMaxBidEur: (value: number | null) => void;
  /** Mostra una notifica fluttuante (es. setFloatingNotice del componente). */
  onNotice: (notice: { kind: ProxyNoticeKind; message: string }) => void;
}

export interface UseAuctionProxyBiddingReturn {
  proxyModalOpen: boolean;
  proxyInput: string;
  setProxyInput: (value: string) => void;
  proxyInputError: string | null;
  setProxyInputError: (value: string | null) => void;
  openProxyModal: () => void;
  closeProxyModal: () => void;
  stopProxyBidding: () => Promise<void>;
  increaseProxyLimit: () => Promise<void>;
  /** Azzera modale/input quando si naviga su un'altra asta. */
  resetProxyModal: () => void;
  isUpdating: boolean;
  isCancelling: boolean;
}

/**
 * Logica proxy bidding (modale limite massimo) estratta da AsteDetailView:
 * apertura/chiusura modale, validazione importo, mutazioni update/cancel.
 * Comportamento identico; `myMaxBidEur` resta nel componente.
 */
export function useAuctionProxyBidding({
  numericId,
  myMaxBidEur,
  setMyMaxBidEur,
  onNotice,
}: UseAuctionProxyBiddingParams): UseAuctionProxyBiddingReturn {
  const [proxyModalOpen, setProxyModalOpen] = useState(false);
  const [proxyInput, setProxyInput] = useState('');
  const [proxyInputError, setProxyInputError] = useState<string | null>(null);

  const updateProxyLimitMutation = useUpdateProxyLimit(numericId);
  const cancelProxyLimitMutation = useCancelProxyLimit(numericId);

  const closeProxyModal = useCallback(() => {
    setProxyModalOpen(false);
    setProxyInputError(null);
  }, []);

  const openProxyModal = useCallback(() => {
    if (myMaxBidEur == null) return;
    const normalized = roundUpToHalfStep(myMaxBidEur);
    setProxyInput(
      Number.isInteger(normalized)
        ? String(normalized)
        : normalized.toFixed(1).replace('.', ','),
    );
    setProxyInputError(null);
    setProxyModalOpen(true);
  }, [myMaxBidEur]);

  const stopProxyBidding = useCallback(async () => {
    try {
      await cancelProxyLimitMutation.mutateAsync();
      setMyMaxBidEur(null);
      onNotice({ kind: 'success', message: 'Proxy bidding disattivato.' });
      closeProxyModal();
    } catch (err) {
      setProxyInputError(err instanceof Error ? err.message : 'Impossibile disattivare il proxy bidding.');
    }
  }, [cancelProxyLimitMutation, closeProxyModal, onNotice, setMyMaxBidEur]);

  const increaseProxyLimit = useCallback(async () => {
    if (myMaxBidEur == null) return;
    const parsed = parseLocaleMoneyInput(proxyInput);
    if (!Number.isFinite(parsed)) {
      setProxyInputError('Inserisci un importo valido.');
      return;
    }
    const nextLimit = roundUpToHalfStep(parsed);
    if (nextLimit <= myMaxBidEur) {
      setProxyInputError(`Il nuovo limite deve essere superiore a ${formatAuctionEur(myMaxBidEur)}.`);
      return;
    }
    try {
      const res = await updateProxyLimitMutation.mutateAsync({ maxAmount: nextLimit });
      setMyMaxBidEur(res.data.proxy_limit);
      onNotice({
        kind: 'success',
        message: `Proxy bidding impostato a ${formatAuctionEur(res.data.proxy_limit)}.`,
      });
      closeProxyModal();
    } catch (err) {
      setProxyInputError(err instanceof Error ? err.message : 'Impossibile aggiornare il limite proxy.');
    }
  }, [closeProxyModal, myMaxBidEur, onNotice, proxyInput, setMyMaxBidEur, updateProxyLimitMutation]);

  const resetProxyModal = useCallback(() => {
    setProxyModalOpen(false);
    setProxyInput('');
    setProxyInputError(null);
  }, []);

  return {
    proxyModalOpen,
    proxyInput,
    setProxyInput,
    proxyInputError,
    setProxyInputError,
    openProxyModal,
    closeProxyModal,
    stopProxyBidding,
    increaseProxyLimit,
    resetProxyModal,
    isUpdating: updateProxyLimitMutation.isPending,
    isCancelling: cancelProxyLimitMutation.isPending,
  };
}
