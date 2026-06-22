'use client';

import { RefreshCw, Loader2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SyncEvent } from '@/lib/api/marketplace-client';

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
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-3 py-3 sm:px-5 sm:py-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-gray-500" aria-hidden />
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Storico eventi</h2>
            <p className="text-xs text-gray-500">
              Webhook e operazioni marketplace
              {total != null ? ` · ${total} totali` : ''}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        >
          {loading ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
          )}
          Aggiorna
        </Button>
      </div>

      <div className="p-3 sm:p-5">
        {loading && events.length === 0 ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : events.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            Nessun evento registrato. Gli eventi compariranno dopo webhook o sync manuali.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Data</th>
                  <th className="pb-2 pr-4 font-medium">Tipo</th>
                  <th className="pb-2 pr-4 font-medium">Origine</th>
                  <th className="pb-2 pr-4 font-medium">Stato</th>
                  <th className="pb-2 font-medium">Dettaglio</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 pr-4 font-mono text-xs text-gray-500 whitespace-nowrap">
                      {ev.created_at
                        ? new Date(ev.created_at).toLocaleString('it-IT', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-gray-800">{ev.event_type}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{ev.source}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          ev.processed
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        )}
                      >
                        {ev.processed ? 'Elaborato' : 'In coda'}
                      </span>
                    </td>
                    <td className="py-2.5 max-w-[200px] truncate text-xs text-red-600" title={ev.error ?? ''}>
                      {ev.error ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
