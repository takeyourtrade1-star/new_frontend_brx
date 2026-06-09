'use client';

import { MessageCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MockSupportTicket } from '@/lib/stores/mock-support-store';
import type { DisputeAPI, DisputeStatus } from '@/types/dispute';

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const BADGE_META: Record<MockSupportTicket['status'] | 'OPEN' | 'RESOLVED', { label: string; cls: string; Icon: typeof AlertCircle }> = {
  OPEN: { label: 'IN CORSO', cls: 'bg-amber-100 text-amber-800', Icon: AlertCircle },
  RESOLVED: { label: 'CHIUSO', cls: 'bg-emerald-100 text-emerald-800', Icon: CheckCircle2 },
};

function getDisputeBadgeMeta(status: DisputeStatus) {
  switch (status) {
    case 'OPEN':
      return { label: 'IN CORSO', cls: 'bg-amber-100 text-amber-800', Icon: AlertCircle };
    default:
      return { label: 'CHIUSO', cls: 'bg-emerald-100 text-emerald-800', Icon: CheckCircle2 };
  }
}

export type SupportTicket =
  | { type: 'real'; data: DisputeAPI }
  | { type: 'mock'; data: MockSupportTicket };

interface SupportTicketCardProps {
  ticket: SupportTicket;
}

export function SupportTicketCard({ ticket }: SupportTicketCardProps) {
  if (ticket.type === 'real') {
    const d = ticket.data;
    const meta = getDisputeBadgeMeta(d.status);
    const StatusIcon = meta.Icon;
    return (
      <article className="flex flex-col gap-4 border border-gray-200 bg-white p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide', meta.cls)}>
              <StatusIcon className="h-3.5 w-3.5" aria-hidden />
              {meta.label}
            </span>
            <span className="text-xs text-gray-500">Segnalazione #{d.id}</span>
            <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
              REALE
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Ordine #{d.order_id}
          </h3>
          <p className="text-sm text-gray-600">
            Aperta il {formatDateTime(d.created_at)}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-gray-500">Stato</div>
            <div className="text-xl font-bold text-gray-900">
              {d.status === 'OPEN' ? 'In corso' : 'Chiusa'}
            </div>
          </div>
        </div>
      </article>
    );
  }

  const m = ticket.data;
  const meta = BADGE_META[m.status];
  const StatusIcon = meta.Icon;

  return (
    <article className="flex flex-col gap-4 border border-gray-200 bg-white p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide', meta.cls)}>
            <StatusIcon className="h-3.5 w-3.5" aria-hidden />
            {meta.label}
          </span>
          <span className="text-xs text-gray-500">#{m.id.slice(0, 8)}</span>
          <span className="inline-flex rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            DEMO
          </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{m.title}</h3>
        <p className="text-sm text-gray-600">{m.description}</p>
        <p className="text-xs text-gray-500">
          Ordine {m.orderId} · Categoria: {m.category}
        </p>
        <p className="text-xs text-gray-500">Aperta il {formatDateTime(m.createdAt)}</p>
        {m.resolvedAt && (
          <p className="text-xs text-emerald-700">Risolto il {formatDateTime(m.resolvedAt)}</p>
        )}
      </div>
      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-gray-500">Stato</div>
          <div className="text-xl font-bold text-gray-900">
            {m.status === 'OPEN' ? 'In corso' : 'Chiusa'}
          </div>
        </div>
      </div>
    </article>
  );
}
