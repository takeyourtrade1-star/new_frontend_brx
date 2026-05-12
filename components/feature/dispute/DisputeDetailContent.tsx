'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { disputesApi } from '@/lib/api/disputes-client';
import type { DisputeMessageAPI } from '@/types/dispute';
import {
  useDisputeDetail,
  useDisputeMessages,
  useResolveDisputeCancel,
  useResolveDisputeReassign,
  useSendDisputeMessage,
} from '@/lib/hooks/use-disputes';

function backendWsBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_AUCTION_API_URL ?? '';
  if (fromEnv) {
    return fromEnv.replace(/^http/i, 'ws').replace(/\/+$/, '');
  }
  if (typeof window === 'undefined') return '';
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}`;
}

const RECONNECT_DELAY_MS = 3_000;
const MAX_RECONNECT_ATTEMPTS = 5;

export function DisputeDetailContent({ disputeId }: { disputeId: number }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const detailQuery = useDisputeDetail(disputeId, disputeId > 0);
  const messagesQuery = useDisputeMessages(disputeId, disputeId > 0);
  const sendMutation = useSendDisputeMessage();
  const reassignMutation = useResolveDisputeReassign();
  const cancelMutation = useResolveDisputeCancel();
  const [text, setText] = useState('');

  // Local WS-appended messages (deduplicated against the server-fetched list).
  const [wsMessages, setWsMessages] = useState<DisputeMessageAPI[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const mountedRef = useRef(true);

  const connect = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const ticketRes = await disputesApi.createWsTicket(disputeId);
      if (!mountedRef.current) return;
      const ticket = ticketRes.data.ticket;
      const wsUrl = `${backendWsBase()}/disputes/ws?ticket=${encodeURIComponent(ticket)}`;
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data as string) as { type: string; data?: DisputeMessageAPI };
          if (payload.type === 'message' && payload.data) {
            setWsMessages((prev) => {
              // Deduplicate by id.
              if (prev.some((m) => m.id === payload.data!.id)) return prev;
              return [...prev, payload.data!];
            });
          }
        } catch {
          // Ignore malformed frames.
        }
      };

      ws.onerror = () => {
        // onerror is always followed by onclose, so we handle reconnect there.
      };

      ws.onclose = () => {
        socketRef.current = null;
        if (!mountedRef.current) return;
        if (reconnectCountRef.current >= MAX_RECONNECT_ATTEMPTS) return;
        reconnectCountRef.current += 1;
        setTimeout(() => void connect(), RECONNECT_DELAY_MS);
      };
    } catch {
      // Ticket fetch failed: fall back to the polling interval provided by useDisputeMessages.
    }
  }, [disputeId]);

  useEffect(() => {
    mountedRef.current = true;
    reconnectCountRef.current = 0;
    void connect();
    return () => {
      mountedRef.current = false;
      const ws = socketRef.current;
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
      socketRef.current = null;
    };
  }, [connect]);

  // Reset local WS messages whenever the base query reloads (tab focus, manual refetch).
  useEffect(() => {
    setWsMessages([]);
  }, [messagesQuery.dataUpdatedAt]);

  const serverMessages = messagesQuery.data?.data ?? [];

  // Merge server + WS-only messages, deduplicating by id, sorted by creation time.
  const allMessages = useMemo<DisputeMessageAPI[]>(() => {
    const byId = new Map<number, DisputeMessageAPI>();
    for (const m of serverMessages) byId.set(m.id, m);
    for (const m of wsMessages) if (!byId.has(m.id)) byId.set(m.id, m);
    return [...byId.values()].sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return diff !== 0 ? diff : a.id - b.id;
    });
  }, [serverMessages, wsMessages]);

  const dispute = detailQuery.data?.data;

  // Compare current user's ID against the order's seller_id (included in the detail response).
  const isSeller = useMemo(() => {
    const uid = user?.id ? String(user.id) : '';
    if (!uid || !dispute?.seller_id) return false;
    return uid === dispute.seller_id;
  }, [user?.id, dispute?.seller_id]);

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    await sendMutation.mutateAsync({ disputeId, body });
    setText('');
  };

  const handleReassign = async () => {
    const result = await reassignMutation.mutateAsync({ disputeId });
    const newOrderId = (result as { data?: { new_order_id?: number } })?.data?.new_order_id;
    if (!newOrderId) return;
    // Seller resolves: show vendite. Buyer (edge) would use acquisti for the new order.
    if (isSeller) {
      router.push('/ordini/vendite');
    } else {
      router.push(`/ordini/acquisti/${newOrderId}`);
    }
  };

  const handleCancel = async () => {
    await cancelMutation.mutateAsync({ disputeId });
    router.push('/ordini/vendite');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Contestazione #{disputeId}</h1>
        <Link href="/ordini/vendite" className="text-sm text-[#FF7300] hover:underline">
          Torna alle vendite
        </Link>
      </div>

      {detailQuery.isLoading ? (
        <div className="rounded border bg-white p-4 text-sm text-gray-500">Caricamento contestazione…</div>
      ) : detailQuery.isError ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {detailQuery.error instanceof Error ? detailQuery.error.message : 'Errore caricamento contestazione.'}
        </div>
      ) : (
        <div className="rounded border bg-white p-4 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold">Stato: {dispute?.status ?? '—'}</span>
            <span>Ordine #{dispute?.order_id ?? '—'}</span>
            <span>Aperta da: {dispute?.opened_by ?? '—'}</span>
          </div>
          {dispute?.status === 'OPEN' && isSeller && (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => void handleReassign()}
                disabled={reassignMutation.isPending || cancelMutation.isPending}
                className="rounded bg-[#FF7300] px-3 py-2 text-xs font-bold uppercase text-white disabled:opacity-60"
              >
                {reassignMutation.isPending ? 'Riassegnazione…' : 'Riassegna al secondo'}
              </button>
              <button
                type="button"
                onClick={() => void handleCancel()}
                disabled={reassignMutation.isPending || cancelMutation.isPending}
                className="rounded border border-red-300 px-3 py-2 text-xs font-bold uppercase text-red-700 disabled:opacity-60"
              >
                {cancelMutation.isPending ? 'Annullamento…' : 'Annulla asta'}
              </button>
            </div>
          )}
          {reassignMutation.isError && (
            <p className="mt-2 text-xs text-red-600">
              {reassignMutation.error instanceof Error ? reassignMutation.error.message : 'Errore riassegnazione.'}
            </p>
          )}
          {cancelMutation.isError && (
            <p className="mt-2 text-xs text-red-600">
              {cancelMutation.error instanceof Error ? cancelMutation.error.message : 'Errore annullamento.'}
            </p>
          )}
        </div>
      )}

      <div className="rounded border bg-white p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">Chat</h2>
        <div className="max-h-[420px] space-y-2 overflow-auto">
          {allMessages.map((m) => (
            <div
              key={m.id}
              className={`rounded px-3 py-2 text-sm ${
                String(m.sender_user_id) === String(user?.id)
                  ? 'ml-8 bg-orange-50 text-gray-900'
                  : 'mr-8 bg-gray-50 text-gray-800'
              }`}
            >
              <div>{m.body}</div>
              <div className="mt-1 text-[11px] text-gray-500">{new Date(m.created_at).toLocaleString('it-IT')}</div>
            </div>
          ))}
          {allMessages.length === 0 && <p className="text-sm text-gray-500">Nessun messaggio.</p>}
        </div>
        {dispute?.status === 'OPEN' ? (
          <form onSubmit={(e) => void onSend(e)} className="mt-3 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-w-0 flex-1 rounded border px-3 py-2 text-sm"
              placeholder="Scrivi un messaggio…"
              maxLength={4000}
            />
            <button
              type="submit"
              disabled={sendMutation.isPending || !text.trim()}
              className="rounded bg-[#FF7300] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              Invia
            </button>
          </form>
        ) : (
          <p className="mt-3 text-xs text-gray-500">La contestazione è chiusa. Non è possibile inviare nuovi messaggi.</p>
        )}
      </div>
    </div>
  );
}
