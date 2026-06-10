'use client';

import { MessageCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExpandableCard } from '@/components/shared/ExpandableCard';
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
  OPEN: { label: 'In corso', cls: 'bg-amber-50 text-amber-700', Icon: AlertCircle },
  RESOLVED: { label: 'Chiuso', cls: 'bg-emerald-50 text-emerald-700', Icon: CheckCircle2 },
};

function getDisputeBadgeMeta(status: DisputeStatus) {
  switch (status) {
    case 'OPEN':
      return { label: 'In corso', cls: 'bg-amber-50 text-amber-700', Icon: AlertCircle };
    default:
      return { label: 'Chiuso', cls: 'bg-emerald-50 text-emerald-700', Icon: CheckCircle2 };
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

    const summary = (
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-[#FF7300]">
          <StatusIcon className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">Ordine #{d.order_id}</h3>
            <span className="text-xs font-bold text-gray-900 shrink-0">
              {d.status === 'OPEN' ? 'In corso' : 'Chiusa'}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">Segnalazione #{d.id}</p>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', meta.cls)}>
              <StatusIcon className="h-3 w-3" aria-hidden />
              {meta.label}
            </span>
            <span className="inline-flex rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-400">
              Reale
            </span>
          </div>
        </div>
      </div>
    );

    const details = (
      <p className="text-sm text-gray-600">Aperta il {formatDateTime(d.created_at)}</p>
    );

    return <ExpandableCard summary={summary} details={details} />;
  }

  const m = ticket.data;
  const meta = BADGE_META[m.status];
  const StatusIcon = meta.Icon;

  const summary = (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-[#FF7300]">
        <StatusIcon className="h-5 w-5" aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{m.title}</h3>
          <span className="text-xs font-bold text-gray-900 shrink-0">
            {m.status === 'OPEN' ? 'In corso' : 'Chiusa'}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-gray-500">Ordine {m.orderId}</p>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', meta.cls)}>
            <StatusIcon className="h-3 w-3" aria-hidden />
            {meta.label}
          </span>
          <span className="inline-flex rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-400">
            Demo
          </span>
        </div>
      </div>
    </div>
  );

  const details = (
    <div className="space-y-2">
      <p className="text-sm text-gray-600">{m.description}</p>
      <p className="text-xs text-gray-500">Categoria: {m.category}</p>
      <p className="text-xs text-gray-500">Aperta il {formatDateTime(m.createdAt)}</p>
      {m.resolvedAt && (
        <p className="text-xs text-emerald-700">Risolto il {formatDateTime(m.resolvedAt)}</p>
      )}
    </div>
  );

  return <ExpandableCard summary={summary} details={details} />;
}
