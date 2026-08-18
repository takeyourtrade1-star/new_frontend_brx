'use client';

import { useState } from 'react';
import { Copy, Check, Webhook, ExternalLink, Loader2, ShieldCheck, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
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
    <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-[#1D3160]/5 via-white to-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#FF7300] ring-1 ring-orange-100">
            <Webhook className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1D3160]">Webhook Ricezione</h2>
            <p className="text-[11px] text-gray-500">Notifiche vendite CardTrader 24/7</p>
          </div>
        </div>

        {webhookData?.webhook_secret_configured ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Attivo
          </span>
        ) : !isDisconnected ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-800 ring-1 ring-amber-200">
            <AlertCircle className="h-3.5 w-3.5" aria-hidden />
            Da Incollare
          </span>
        ) : null}
      </div>

      <div className="space-y-4 p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-xs text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin text-[#FF7300]" />
            <span>Caricamento endpoint webhook personale...</span>
          </div>
        ) : isDisconnected ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
            <Webhook className="mx-auto h-8 w-8 text-gray-300 mb-2" />
            <p className="text-xs font-semibold text-gray-700">Webhook non ancora attivo</p>
            <p className="mt-1 text-[11px] text-gray-500">
              Collega la tua chiave CardTrader per generare automaticamente il tuo URL webhook personale.
            </p>
          </div>
        ) : webhookData?.webhook_url ? (
          <>
            <div>
              <label
                htmlFor="webhook-endpoint-url"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#1D3160]"
              >
                Il tuo Endpoint Webhook Unico
              </label>
              <div className="flex gap-2">
                <Input
                  id="webhook-endpoint-url"
                  readOnly
                  value={webhookData.webhook_url}
                  className="h-10 rounded-xl bg-gray-50/80 font-mono text-xs text-gray-800 shadow-2xs focus-visible:ring-[#FF7300]"
                  aria-label="URL webhook"
                />
                <Button
                  type="button"
                  onClick={() => void handleCopy()}
                  className={cn(
                    'h-10 shrink-0 rounded-xl px-3.5 text-xs font-bold transition-all',
                    copied
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-[#1D3160] text-white hover:bg-[#152345]'
                  )}
                  title="Copia URL"
                >
                  {copied ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                      Copiato!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      Copia
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Steps walkthrough */}
            <div className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5 text-xs text-gray-700">
              <p className="font-bold text-[#1D3160] text-xs">Come attivarlo su CardTrader:</p>
              <ol className="space-y-2 text-[11px] text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#1D3160] text-[9px] font-black text-white">
                    1
                  </span>
                  <span>Apri le impostazioni <strong>Webhooks</strong> su CardTrader</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#1D3160] text-[9px] font-black text-white">
                    2
                  </span>
                  <span>Incolla l'URL copiato nel campo <strong>Endpoint URL</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#1D3160] text-[9px] font-black text-white">
                    3
                  </span>
                  <span>Salva per ricevere gli aggiornamenti automatici in tempo reale</span>
                </li>
              </ol>
            </div>

            <a
              href="https://www.cardtrader.com/apps/full"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF7300] hover:text-[#D95F00] hover:underline"
            >
              Apri Webhooks su CardTrader
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </>
        ) : (
          <p className="text-xs text-gray-500">Webhook non disponibile al momento.</p>
        )}
      </div>
    </section>
  );
}
