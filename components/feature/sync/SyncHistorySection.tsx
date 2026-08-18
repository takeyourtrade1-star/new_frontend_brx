'use client';

import { RefreshCw, Loader2, History, CheckCircle2, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import type { SyncEvent } from '@/lib/api/marketplace-client';

const EVENT_TYPE_LABELS: Record<string, { label: string; chipClass: string }> = {
  sync_imported: { label: 'Import Catalogo', chipClass: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  listing_update: { label: 'Aggiornamento Stock', chipClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  order_created: { label: 'Vendita Ebartex', chipClass: 'bg-orange-50 text-[#FF7300] ring-1 ring-orange-200' },
  webhook_received: { label: 'Webhook Ricevuto', chipClass: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200' },
};

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
    <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-[#1D3160]/5 via-white to-white px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-[#1D3160] ring-1 ring-gray-200">
            <History className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#1D3160]">Storico Eventi & Webhook</h2>
              {total != null && total > 0 && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                  {total} eventi
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Tracciamento in tempo reale di tutte le operazioni e webhook ricevuti
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="h-8 border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5 text-gray-400', loading ? 'animate-spin' : '')} />
          Aggiorna Storico
        </Button>
      </div>

      <div className="p-0">
        {loading && events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-xs text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin text-[#FF7300] mb-2" />
            <span>Caricamento eventi...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center">
            <History className="mx-auto h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-700">Nessun evento registrato</p>
            <p className="mt-1 text-xs text-gray-400 max-w-sm mx-auto">
              Gli eventi di sincronizzazione e i webhook appariranno automaticamente non appena avvierai un import o riceverai notifiche da CardTrader.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="py-3 pl-6 pr-4">Data e Ora</th>
                  <th className="py-3 pr-4">Tipo Evento</th>
                  <th className="py-3 pr-4">Origine</th>
                  <th className="py-3 pr-4">Stato</th>
                  <th className="py-3 pr-6">Dettaglio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map((ev) => {
                  const typeMeta = EVENT_TYPE_LABELS[ev.event_type] || {
                    label: ev.event_type,
                    chipClass: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200',
                  };
                  return (
                    <tr key={ev.id} className="transition hover:bg-gray-50/70">
                      <td className="py-3 pl-6 pr-4 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                        {ev.created_at
                          ? new Date(ev.created_at).toLocaleString(intlLocale, {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold', typeMeta.chipClass)}>
                          {typeMeta.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-700 uppercase tracking-wider text-[10px]">
                        {ev.source}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                            ev.processed
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                              : ev.error
                                ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                          )}
                        >
                          {ev.processed ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Elaborato
                            </>
                          ) : ev.error ? (
                            <>
                              <AlertCircle className="h-3 w-3 text-red-600" />
                              Errore
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 text-amber-600" />
                              In coda
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 pr-6 max-w-[240px] truncate text-gray-600" title={ev.error ?? ''}>
                        {ev.error ? (
                          <span className="font-medium text-red-600">{ev.error}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
