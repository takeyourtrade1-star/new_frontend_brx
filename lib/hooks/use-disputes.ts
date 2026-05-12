import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { disputesApi } from '@/lib/api/disputes-client';

export const disputeKeys = {
  all: ['disputes'] as const,
  mine: () => [...disputeKeys.all, 'mine'] as const,
  detail: (id: number) => [...disputeKeys.all, 'detail', id] as const,
  openByOrder: (orderId: number) => [...disputeKeys.all, 'open-by-order', orderId] as const,
  messages: (id: number) => [...disputeKeys.all, 'messages', id] as const,
};

export function useOpenDisputeByOrder(orderId: number, enabled = true) {
  return useQuery({
    queryKey: disputeKeys.openByOrder(orderId),
    queryFn: () => disputesApi.getOpenByOrder(orderId),
    enabled,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useDisputeDetail(disputeId: number, enabled = true) {
  return useQuery({
    queryKey: disputeKeys.detail(disputeId),
    queryFn: () => disputesApi.get(disputeId),
    enabled,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useDisputeMessages(disputeId: number, enabled = true) {
  return useQuery({
    queryKey: disputeKeys.messages(disputeId),
    queryFn: () => disputesApi.listMessages(disputeId),
    enabled,
    staleTime: 5_000,
    refetchInterval: 8_000,
  });
}

export function useSendDisputeMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ disputeId, body }: { disputeId: number; body: string }) =>
      disputesApi.postMessage(disputeId, body),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: disputeKeys.messages(vars.disputeId) });
    },
  });
}

export function useOpenDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number; reason?: string }) =>
      disputesApi.open(orderId, reason),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: disputeKeys.openByOrder(vars.orderId) });
      void qc.invalidateQueries({ queryKey: disputeKeys.mine() });
    },
  });
}

export function useResolveDisputeReassign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ disputeId, reason }: { disputeId: number; reason?: string }) =>
      disputesApi.resolveReassign(disputeId, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: disputeKeys.all });
    },
  });
}

export function useResolveDisputeCancel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ disputeId, reason }: { disputeId: number; reason?: string }) =>
      disputesApi.resolveCancel(disputeId, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: disputeKeys.all });
    },
  });
}
