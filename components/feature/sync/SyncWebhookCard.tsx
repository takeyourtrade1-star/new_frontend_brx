'use client';

import { useState } from 'react';
import { Copy, Check, Webhook, ExternalLink, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTimeoutFn } from '@/lib/hooks/use-timeout-fn';
import { cn } from '@/lib/utils';
import type { WebhookUrlResponse } from '@/lib/api/sync-client';

export function SyncWebhookCard({
  loading,
  webhookData,
  isDisconnected,
  onCopy,
}: {
  loading: boolean;
  webhookData: WebhookUrlResponse | null;
  isDisconnected: boolean;
  onCopy?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const setTimeoutFn = useTimeoutFn();

  const handleCopy = async () => {
    const url = webhookData?.webhook_url ?? '';
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onCopy?.();
      setTimeoutFn(() => setCopied(false), 2500);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm transition-all">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/70 via-white to-white px-4 py-4 sm:px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF7300]/10 text-[#FF7300]">
          <Webhook className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-gray-900">Webhook CardTrader</h2>
          <p className="text-xs text-gray-500">Ricezione automatica vendite</p>
        </div>
        {webhookData?.webhook_secret_configured ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            Attivo
          </span>
        ) : !isDisconnected ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 ring-1 ring-amber-200">
            <AlertCircle className="h-3 w-3" aria-hidden />
            In attesa
          </span>
        ) : null}
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#FF7300]" />
            Caricamento endpoint webhook...
          </div>
        ) : isDisconnected ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-5 text-center">
            <p className="text-xs text-gray-500">
              Collega CardTrader per generare il tuo URL webhook personale e abilitare la sincronizzazione in tempo reale.
            </p>
          </div>
        ) : webhookData?.webhook_url ? (
          <>
            <div>
              <label htmlFor="webhook-endpoint-url" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                Endpoint Webhook Personale
              </label>
              <div className="flex gap-1.5">
                <Input
                  id="webhook-endpoint-url"
                  readOnly
                  value={webhookData.webhook_url}
                  className="h-9 bg-gray-50 font-mono text-xs text-gray-800 shadow-2xs focus-visible:ring-[#FF7300]"
                  aria-label="URL webhook"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleCopy()}
                  className="h-9 shrink-0 border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  title="Copia URL"
                >
                  {copied ? (
                    <>
                      <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copiato</span>
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3.5 w-3.5 text-gray-500" />
                      Copia
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Steps */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 text-xs text-gray-600">
              <p className="mb-2 font-semibold text-gray-900">Come configurarlo su CardTrader:</p>
              <ol className="space-y-1.5 text-[11px]">
                <li className="flex items-start gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FF7300]/15 text-[10px] font-bold text-[#FF7300]">
                    1
                  </span>
                  <span>Apri le impostazioni <strong>Webhooks</strong> su CardTrader</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FF7300]/15 text-[10px] font-bold text-[#FF7300]">
                    2
                  </span>
                  <span>Incolla questo URL nel campo endpoint</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FF7300]/15 text-[10px] font-bold text-[#FF7300]">
                    3
                  </span>
                  <span>Salva per attivare gli aggiornamenti automatici</span>
                </li>
              </ol>
            </div>

            <a
              href="https://www.cardtrader.com/en/docs/api/full/reference"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF7300] hover:underline"
            >
              Apri impostazioni CardTrader
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </>
        ) : (
          <p className="text-xs text-gray-500">Webhook non disponibile.</p>
        )}
      </div>
    </section>
  );
}
