/**
 * React Query hooks for the auction API.
 * Wraps auctionApi calls for cache, refetch, and mutation patterns.
 * Includes WebSocket hook for live bid updates.
 */

import { useEffect, useRef } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { auctionApi } from '@/lib/api/auction-client';
import { AuctionWebSocket, type AuctionWsEvent } from '@/lib/ws/auction-ws';
import type {
  AuctionAPI,
  AuctionListResponse,
  AuctionDetailResponse,
  BidListResponse,
  MinimumBidResponse,
  PlaceBidResponse,
  PlaceBidPayload,
  AuctionCreatePayload,
} from '@/types/auction';

const KEYS = {
  all: ['auctions'] as const,
  list: (params?: { q?: string; status?: string; limit?: number; offset?: number }) =>
    ['auctions', 'list', params ?? {}] as const,
  detail: (id: number) => ['auctions', 'detail', id] as const,
  bids: (auctionId: number) => ['auctions', 'bids', auctionId] as const,
  minBid: (auctionId: number) => ['auctions', 'minBid', auctionId] as const,
};

export function useAuctionList(params?: {
  q?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => auctionApi.listAuctions(params),
    staleTime: 30_000,
  });
}

export function useAuctionDetail(
  id: number,
  options?: Partial<UseQueryOptions<AuctionDetailResponse>>
) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => auctionApi.getAuction(id),
    staleTime: 15_000,
    enabled: id > 0,
    ...options,
  });
}

export function useAuctionBids(
  auctionId: number,
  params?: { limit?: number; offset?: number }
) {
  return useQuery({
    queryKey: KEYS.bids(auctionId),
    queryFn: () => auctionApi.listBids(auctionId, params),
    staleTime: 10_000,
    enabled: auctionId > 0,
    refetchInterval: 60_000,
  });
}

export function useMinimumBid(auctionId: number) {
  return useQuery({
    queryKey: KEYS.minBid(auctionId),
    queryFn: () => auctionApi.getMinimumBid(auctionId),
    staleTime: 5_000,
    enabled: auctionId > 0,
  });
}

export function usePlaceBid(auctionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PlaceBidPayload) =>
      auctionApi.placeBid(auctionId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.detail(auctionId) });
      qc.invalidateQueries({ queryKey: KEYS.bids(auctionId) });
      qc.invalidateQueries({ queryKey: KEYS.minBid(auctionId) });
    },
  });
}

export function useCreateAuction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AuctionCreatePayload) =>
      auctionApi.createAuction(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useUpdateAuction(auctionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      auctionApi.updateAuction(auctionId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.detail(auctionId) });
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useDeleteAuction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (auctionId: number) => auctionApi.deleteAuction(auctionId),
    onSuccess: (_data, auctionId) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.removeQueries({ queryKey: KEYS.detail(auctionId) });
      qc.removeQueries({ queryKey: KEYS.bids(auctionId) });
      qc.removeQueries({ queryKey: KEYS.minBid(auctionId) });
    },
  });
}

/**
 * Connects a WebSocket to /auctions/{id}/ws for live bid updates.
 * On every bid event the React Query caches for detail, bids, and minBid are
 * instantly invalidated so the UI refreshes without waiting for the next poll.
 */
export function useAuctionWebSocket(auctionId: number) {
  const qc = useQueryClient();
  const wsRef = useRef<AuctionWebSocket | null>(null);

  useEffect(() => {
    if (auctionId <= 0) return;

    const ws = new AuctionWebSocket(auctionId);
    wsRef.current = ws;

    const unsub = ws.subscribe((_event: AuctionWsEvent) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(auctionId) });
      qc.invalidateQueries({ queryKey: KEYS.bids(auctionId) });
      qc.invalidateQueries({ queryKey: KEYS.minBid(auctionId) });
    });

    ws.connect();

    return () => {
      unsub();
      ws.close();
      wsRef.current = null;
    };
  }, [auctionId, qc]);
}
