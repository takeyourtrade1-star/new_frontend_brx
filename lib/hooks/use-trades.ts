'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tradesApi, type TradeListParams } from '@/lib/api/trades-client';
import type { CreateTradeInput, TradeAddress, TradeResponse } from '@/types/trade';

export const tradeKeys = {
  all: ['trades'] as const,
  list: (params?: TradeListParams) => ['trades', 'list', params ?? {}] as const,
  detail: (id: number) => ['trades', 'detail', id] as const,
  history: (id: number) => ['trades', 'history', id] as const,
};

export function useTrades(params?: TradeListParams) {
  return useQuery({ queryKey: tradeKeys.list(params), queryFn: () => tradesApi.list(params), staleTime: 15_000 });
}

export function useTrade(tradeId: number) {
  return useQuery({
    queryKey: tradeKeys.detail(tradeId),
    queryFn: () => tradesApi.get(tradeId),
    enabled: tradeId > 0,
    staleTime: 10_000,
  });
}

export function useTradeHistory(tradeId: number) {
  return useQuery({
    queryKey: tradeKeys.history(tradeId),
    queryFn: () => tradesApi.history(tradeId),
    enabled: tradeId > 0,
    staleTime: 30_000,
  });
}

function useTradeMutation<T>(mutationFn: (input: T) => Promise<TradeResponse>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tradeKeys.all });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['account-inventory'] });
    },
  });
}

export function useCreateTrade() {
  return useTradeMutation<CreateTradeInput>((input) => tradesApi.create(input));
}
export function useCounterTrade() {
  return useTradeMutation<{
    tradeId: number;
    input: Omit<CreateTradeInput, 'receiver_id' | 'delivery_method'>;
  }>(({ tradeId, input }) => tradesApi.counter(tradeId, input));
}
export function useAcceptTrade() {
  return useTradeMutation<{ tradeId: number; address: TradeAddress }>(({ tradeId, address }) =>
    tradesApi.accept(tradeId, address));
}
export function useDeclineTrade() {
  return useTradeMutation<{ tradeId: number; reason?: string }>(({ tradeId, reason }) =>
    tradesApi.decline(tradeId, reason));
}
export function useCancelTrade() {
  return useTradeMutation<{ tradeId: number; reason?: string }>(({ tradeId, reason }) =>
    tradesApi.cancel(tradeId, reason));
}
export function useShipTrade() {
  return useTradeMutation<{ tradeId: number; tracking_carrier: string; tracking_code: string }>(
    ({ tradeId, ...tracking }) => tradesApi.ship(tradeId, tracking));
}
export function useConfirmTradeReceipt() {
  return useTradeMutation<number>((tradeId) => tradesApi.confirmReceipt(tradeId));
}
export function useRequestTradeCancel() {
  return useTradeMutation<number>((tradeId) => tradesApi.requestCancel(tradeId));
}
export function useConfirmTradeCancel() {
  return useTradeMutation<number>((tradeId) => tradesApi.confirmCancel(tradeId));
}
export function useTradeAssistance() {
  return useTradeMutation<{ tradeId: number; reason: string }>(({ tradeId, reason }) =>
    tradesApi.assistance(tradeId, reason));
}
