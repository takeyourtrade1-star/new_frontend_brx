'use client';

import { useState } from 'react';
import { Copy, Check, Webhook, ExternalLink, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  const handleCopy = async () => {
    const url = webhookData?.webhook_url ?? '';
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF7300]/10">
          <Webhook className="h-5 w-5 text-[#FF7300]" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-gray-900">Il tuo webhook</h2>
          <p className="text-xs text-gray-500">Sempre attivo — incollalo nelle impostazioni CardTrader</p>
        </div>
        {webhookData?.webhook_secret_configured && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
            <Shield className="h-3 w-3" aria-hidden />
            Secret OK
          </span>
        )}
      </div>

      <div className="p-5">
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Caricamento URL webhook…
          </div>
        ) : isDisconnected ? (
          <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            Collega CardTrader per generare il tuo URL webhook personale.
          </p>
        ) : webhookData?.webhook_url ? (
          <>
            <div className="flex gap-2">
              <Input
                readOnly
                value={webhookData.webhook_url}
                className="font-mono text-xs text-gray-800 md:text-sm"
                aria-label="URL webhook"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleCopy()}
                className="shrink-0 border-gray-300"
                title="Copia URL"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {copied && (
              <p className="mt-2 text-xs font-medium text-emerald-600">URL copiato negli appunti</p>
            )}

            <ol className="mt-4 space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                  1
                </span>
                {webhookData.instructions?.step_1 ?? 'Apri le impostazioni webhook su CardTrader'}
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                  2
                </span>
                {webhookData.instructions?.step_2 ?? 'Incolla l’URL qui sopra'}
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                  3
                </span>
                {webhookData.instructions?.step_3 ?? 'Salva e verifica che il secret sia configurato'}
              </li>
            </ol>

            {!webhookData.webhook_secret_configured && (
              <p
                className={cn(
                  'mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800'
                )}
              >
                Il secret webhook non risulta ancora configurato. Completa lo step su CardTrader prima
                dell’import massivo.
              </p>
            )}

            <a
              href="https://www.cardtrader.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#FF7300] hover:underline"
            >
              Apri CardTrader
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </>
        ) : (
          <p className="text-sm text-gray-500">Webhook non disponibile. Collega prima il token API.</p>
        )}
      </div>
    </section>
  );
}
