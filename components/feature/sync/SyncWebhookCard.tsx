'use client';

import { useState } from 'react';
import { useTimeoutFn } from '@/lib/hooks/use-timeout-fn';
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
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#FF7300]">Automazione</p>
          <h2 className="mt-1 font-display text-xl uppercase tracking-[0.06em] text-[#1D3160]">
            Webhook
          </h2>
        </div>
        <p className="text-xs uppercase tracking-[0.14em] text-[#1D3160]/40">
          {webhookData?.webhook_secret_configured
            ? 'In ascolto'
            : isDisconnected
              ? 'Spento'
              : 'Da attivare'}
        </p>
      </div>

      <div className="mt-5">
        {loading ? (
          <p className="text-sm text-[#1D3160]/45">Caricamento endpoint…</p>
        ) : isDisconnected ? (
          <p className="text-sm leading-relaxed text-[#1D3160]/60">
            Collega il token CardTrader per generare l&apos;URL webhook personale. Serve a ricevere
            le vendite in tempo reale.
          </p>
        ) : webhookData?.webhook_url ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="webhook-endpoint-url" className="sr-only">
                Il tuo endpoint webhook
              </label>
              <input
                id="webhook-endpoint-url"
                readOnly
                value={webhookData.webhook_url}
                aria-label="URL webhook"
                className="h-12 min-w-0 flex-1 border border-[#1D3160]/15 bg-white px-3 font-mono text-xs text-[#1D3160] outline-none focus:border-[#FF7300]"
              />
              <button
                type="button"
                onClick={() => void handleCopy()}
                title="Copia URL"
                className="h-12 shrink-0 bg-[#1D3160] px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#152345]"
              >
                {copied ? 'Copiato' : 'Copia'}
              </button>
            </div>

            <p className="text-sm leading-relaxed text-[#1D3160]/60">
              Su CardTrader: Webhooks → incolla l&apos;URL → salva.
              {' '}
              <a
                href="https://www.cardtrader.com/apps/full"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#FF7300] underline-offset-4 hover:underline"
              >
                Apri CardTrader
              </a>
            </p>
          </div>
        ) : (
          <p className="text-sm text-[#1D3160]/45">Webhook non disponibile al momento.</p>
        )}
      </div>
    </section>
  );
}
