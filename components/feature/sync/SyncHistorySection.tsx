'use client';

import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import type { SyncEvent } from '@/lib/api/marketplace-client';

const EVENT_TYPE_LABELS: Record<string, string> = {
  sync_imported: 'Import catalogo',
  listing_update: 'Aggiornamento stock',
  order_created: 'Vendita Ebartex',
  webhook_received: 'Webhook ricevuto',
};

function statusWord(ev: SyncEvent): { label: string; className: string } {
  if (ev.processed) return { label: 'Elaborato', className: 'text-[#1D3160]' };
  if (ev.error) return { label: 'Errore', className: 'text-red-700' };
  return { label: 'In coda', className: 'text-[#FF7300]' };
}

export function SyncHistorySection({
  events,
  loading,
  onRefresh,
  total,
}: {
  events: SyncEvent[];
  loading: boolean;
  onRefresh: () => void;
  total?: number;
}) {
  const intlLocale = useIntlLocale();

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#FF7300]">Log</p>
          <h2 className="mt-1 font-display text-xl uppercase tracking-[0.06em] text-[#1D3160]">
            Attività
            {total != null && total > 0 ? (
              <span className="ml-3 font-sans text-sm font-medium tabular-nums tracking-normal text-[#1D3160]/40">
                {total}
              </span>
            ) : null}
          </h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1D3160]/50 underline-offset-4 hover:text-[#1D3160] hover:underline disabled:opacity-40"
        >
          {loading ? 'Lettura…' : 'Aggiorna'}
        </button>
      </div>

      <div className="mt-5">
        {loading && events.length === 0 ? (
          <p className="py-10 text-sm text-[#1D3160]/40">Caricamento eventi…</p>
        ) : events.length === 0 ? (
          <p className="max-w-md py-10 text-sm leading-relaxed text-[#1D3160]/50">
            Nessun evento. Import e webhook compariranno qui appena parte la prima sincronizzazione.
          </p>
        ) : (
          <ul className="divide-y divide-[#1D3160]/10 border-t border-[#1D3160]/10">
            {events.map((ev) => {
              const status = statusWord(ev);
              return (
                <li
                  key={ev.id}
                  className="grid grid-cols-1 gap-1 py-3.5 sm:grid-cols-[9.5rem_1fr_7rem_6rem] sm:items-baseline sm:gap-4"
                >
                  <time className="font-mono text-[11px] tabular-nums text-[#1D3160]/45">
                    {ev.created_at
                      ? new Date(ev.created_at).toLocaleString(intlLocale, {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : '—'}
                  </time>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[#1D3160]">
                      {EVENT_TYPE_LABELS[ev.event_type] || ev.event_type}
                    </p>
                    {ev.error ? (
                      <p className="mt-0.5 truncate text-xs text-red-700" title={ev.error}>
                        {ev.error}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#1D3160]/40">
                    {ev.source}
                  </p>
                  <p className={`text-xs font-medium sm:text-right ${status.className}`}>
                    {status.label}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
