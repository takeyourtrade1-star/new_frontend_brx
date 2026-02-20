'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Home,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  PauseCircle,
  Unlink,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { syncClient } from '@/lib/api/sync-client';
import type { SyncStatusResponse, WebhookUrlResponse, SyncProgressResponse } from '@/lib/api/sync-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type LogEntry = { ts: string; label: string; data: string; isError?: boolean };

function Breadcrumb() {
  return (
    <nav className="mb-6 flex items-center gap-2 text-sm text-white/90" aria-label="Breadcrumb">
      <Link href="/account" className="hover:text-white" aria-label="Account">
        <Home className="h-4 w-4" />
      </Link>
      <span className="text-white/60">/</span>
      <span>ACCOUNT</span>
      <span className="text-white/60">/</span>
      <span className="text-white">SINCRONIZZAZIONE</span>
    </nav>
  );
}

function Card({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800',
        className
      )}
    >
      {title && (
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    active: { bg: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400', text: 'Attivo' },
    initial_sync: { bg: 'bg-amber-500/20 text-amber-600 dark:text-amber-400', text: 'Sincronizzazione in corso' },
    idle: { bg: 'bg-gray-500/20 text-gray-600 dark:text-gray-400', text: 'In attesa' },
    error: { bg: 'bg-red-500/20 text-red-600 dark:text-red-400', text: 'Errore' },
  };
  const c = config[status] || config.idle;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        c.bg
      )}
    >
      {c.text}
    </span>
  );
}

export function SincronizzazioneContent() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken ?? (typeof window !== 'undefined' ? localStorage.getItem('ebartex_access_token') : null));

  const [syncStatus, setSyncStatus] = useState<SyncStatusResponse | null>(null);
  const [webhookData, setWebhookData] = useState<WebhookUrlResponse | null>(null);
  const [progress, setProgress] = useState<SyncProgressResponse | null>(null);

  const [cardtraderToken, setCardtraderToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingSetup, setLoadingSetup] = useState(false);
  const [loadingWebhook, setLoadingWebhook] = useState(false);
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [loadingDisconnect, setLoadingDisconnect] = useState(false);
  const [disconnectConfirm, setDisconnectConfirm] = useState<'suspend' | 'remove' | null>(null);

  /** Risultato ultima sincronizzazione massiva (dopo che il task Celery è completato). */
  const [lastSyncResult, setLastSyncResult] = useState<{
    total_products: number;
    processed: number;
    created: number;
    updated: number;
    skipped: number;
  } | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  const addLog = useCallback((label: string, data: unknown, isError?: boolean) => {
    const ts = new Date().toISOString();
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    setLogs((prev) => [{ ts, label, data: dataStr, isError }, ...prev]);
  }, []);

  const userId = user?.id;

  // Fetch sync status on mount (when user + token available)
  useEffect(() => {
    if (!userId || !accessToken) return;
    let cancelled = false;
    setLoadingStatus(true);
    syncClient
      .getSyncStatus(userId, accessToken)
      .then((res) => {
        if (!cancelled) setSyncStatus(res);
        addLog('getSyncStatus', res);
      })
      .catch((err) => {
        if (!cancelled) addLog('getSyncStatus ERROR', { message: err?.message, data: (err as any)?.data }, true);
      })
      .finally(() => {
        if (!cancelled) setLoadingStatus(false);
      });
    return () => { cancelled = true; };
  }, [userId, accessToken, addLog]);

  // Fetch webhook URL on mount
  useEffect(() => {
    if (!userId || !accessToken) return;
    let cancelled = false;
    setLoadingWebhook(true);
    syncClient
      .getWebhookUrl(userId, accessToken)
      .then((res) => {
        if (!cancelled) setWebhookData(res);
        addLog('getWebhookUrl', res);
      })
      .catch((err) => {
        if (!cancelled) addLog('getWebhookUrl ERROR', { message: err?.message, data: (err as any)?.data }, true);
      })
      .finally(() => {
        if (!cancelled) setLoadingWebhook(false);
      });
    return () => { cancelled = true; };
  }, [userId, accessToken, addLog]);

  const handleSetupTestUser = async () => {
    if (!userId || !accessToken || !cardtraderToken.trim()) return;
    setLoadingSetup(true);
    try {
      const res = await syncClient.setupTestUser(
        { user_id: userId, cardtrader_token: cardtraderToken.trim() },
        accessToken
      );
      addLog('setupTestUser', res);
      setSyncStatus((prev) => (prev ? { ...prev, sync_status: res.sync_status as any } : null));
    } catch (err: any) {
      addLog('setupTestUser ERROR', { message: err?.message, data: err?.data }, true);
    } finally {
      setLoadingSetup(false);
    }
  };

  const handleCopyWebhook = async () => {
    const url = webhookData?.webhook_url ?? '';
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      addLog('clipboard', { action: 'copy', url });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addLog('clipboard ERROR', 'Copy failed', true);
    }
  };

  const handleStartSync = async () => {
    if (!userId || !accessToken) return;
    setLoadingStart(true);
    setLastSyncResult(null);
    setLastSyncError(null);
    try {
      const res = await syncClient.startSync(userId, accessToken);
      addLog('startSync', res);
      setSyncStatus((prev) => (prev ? { ...prev, sync_status: 'initial_sync' } : null));

      const taskId = res?.task_id;
      if (!taskId) {
        setLoadingStart(false);
        return;
      }

      // Poll task status until completed (max ~10 min)
      const pollIntervalMs = 2500;
      const maxPolls = 240; // 10 min
      let polls = 0;

      const poll = async (): Promise<void> => {
        if (polls >= maxPolls) {
          setLastSyncError('Timeout: la sincronizzazione sta impiegando più del previsto. Controlla lo stato più tardi.');
          setLoadingStart(false);
          return;
        }
        polls += 1;
        try {
          const taskRes = await syncClient.getTaskStatus(taskId, accessToken);
          addLog('getTaskStatus', taskRes);

          if (taskRes.ready) {
            if (taskRes.status === 'SUCCESS' && taskRes.result && typeof taskRes.result === 'object') {
              const r = taskRes.result as { created?: number; updated?: number; skipped?: number; total_products?: number; processed?: number };
              setLastSyncResult({
                total_products: r.total_products ?? 0,
                processed: r.processed ?? 0,
                created: r.created ?? 0,
                updated: r.updated ?? 0,
                skipped: r.skipped ?? 0,
              });
              setSyncStatus((prev) => (prev ? { ...prev, sync_status: 'active' } : null));
            } else if (taskRes.status === 'FAILURE' || taskRes.error) {
              setLastSyncError(taskRes.error || 'Sincronizzazione fallita.');
            }
            setLoadingStart(false);
            return;
          }

          setTimeout(poll, pollIntervalMs);
        } catch (err: any) {
          addLog('getTaskStatus ERROR', { message: err?.message }, true);
          setTimeout(poll, pollIntervalMs);
        }
      };

      setTimeout(poll, pollIntervalMs);
    } catch (err: any) {
      addLog('startSync ERROR', { message: err?.message, data: err?.data }, true);
      setLastSyncError(err?.message || 'Impossibile avviare la sincronizzazione.');
      setLoadingStart(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!userId || !accessToken) return;
    setLoadingRefresh(true);
    try {
      const [statusRes, progressRes] = await Promise.all([
        syncClient.getSyncStatus(userId, accessToken),
        syncClient.getSyncProgress(userId, accessToken),
      ]);
      setSyncStatus(statusRes);
      setProgress(progressRes);
      addLog('getSyncStatus + getSyncProgress', { status: statusRes, progress: progressRes });
    } catch (err: any) {
      addLog('refresh ERROR', { message: err?.message, data: err?.data }, true);
    } finally {
      setLoadingRefresh(false);
    }
  };

  const handleDisconnect = async (action: 'suspend' | 'remove') => {
    if (!userId || !accessToken) return;
    setLoadingDisconnect(true);
    setDisconnectConfirm(null);
    try {
      const res = await syncClient.disconnectSync(userId, accessToken, action);
      addLog('disconnectSync', res);
      setSyncStatus((prev) =>
        prev ? { ...prev, sync_status: 'idle', disconnected: action === 'remove' ? true : prev.disconnected } : null
      );
      if (action === 'remove') {
        setWebhookData((prev) => (prev ? { ...prev, webhook_secret_configured: false } : null));
      }
    } catch (err: any) {
      addLog('disconnectSync ERROR', { message: err?.message, data: err?.data }, true);
    } finally {
      setLoadingDisconnect(false);
    }
  };

  if (!user || !accessToken) {
    return (
      <div className="text-white">
        <Breadcrumb />
        <div className="mt-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white/5 p-12 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF7300]" />
            <p className="text-sm text-white/80">Caricamento account...</p>
          </div>
        </div>
      </div>
    );
  }

  const statusValue = syncStatus?.sync_status ?? 'idle';
  const showProgress = statusValue === 'initial_sync' && progress;
  const isDisconnected = syncStatus?.disconnected === true;
  const canSuspendOrRemove = Boolean(syncStatus && !isDisconnected);

  return (
    <div className="text-white">
      <Breadcrumb />

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold uppercase tracking-wide text-white">
          Sincronizzazione CardTrader
        </h1>
        <div className="flex items-center gap-3">
          {loadingStatus ? (
            <Loader2 className="h-5 w-5 animate-spin text-white/60" />
          ) : (
            <StatusBadge status={statusValue} />
          )}
        </div>
      </div>

      {isDisconnected && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Collegamento CardTrader rimosso. Inserisci di nuovo il token nello Step 1 per sincronizzare.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* A. Header & status already above */}

        {/* B. Step 1 - Configurazione API */}
        <Card title="Step 1 — Configurazione API">
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
            Inserisci il tuo Token API di CardTrader per collegare l&apos;account.
          </p>
          <div className="flex flex-wrap gap-3">
            <Input
              type="password"
              placeholder="Token API CardTrader"
              value={cardtraderToken}
              onChange={(e) => setCardtraderToken(e.target.value)}
              className="max-w-md border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <Button
              type="button"
              onClick={handleSetupTestUser}
              disabled={loadingSetup || !cardtraderToken.trim()}
              className="bg-[#FF7300] font-semibold text-white hover:bg-[#e66a00] disabled:opacity-50"
            >
              {loadingSetup ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Salva e Collega
            </Button>
          </div>
        </Card>

        {/* C. Step 2 - Webhook */}
        <Card title="Step 2 — Configurazione Webhook (Automazione)">
          {loadingWebhook ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Caricamento URL webhook...
            </div>
          ) : webhookData ? (
            <>
              <div className="mb-3 flex gap-2">
                <Input
                  readOnly
                  value={webhookData.webhook_url}
                  className="font-mono text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                />
                <Button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="h-10 w-10 shrink-0 border border-gray-300 dark:border-gray-600"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {copied && (
                <p className="mb-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">Copiato!</p>
              )}
              <ul className="mb-4 list-inside list-decimal space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <li>
                  <a
                    href="https://www.cardtrader.com/it/full_api_app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#FF7300] hover:underline"
                  >
                    Vai su CardTrader <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Incolla l&apos;URL nel campo &quot;Indirizzo del tuo endpoint webhook&quot;</li>
                <li>Clicca &quot;Salva l&apos;endpoint del Webhook&quot;</li>
              </ul>
              <p className="flex items-center gap-2 text-sm">
                <span className="text-gray-600 dark:text-gray-400">Segreto Webhook Configurato:</span>
                <span
                  className={cn(
                    'font-medium',
                    webhookData.webhook_secret_configured ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  )}
                >
                  {webhookData.webhook_secret_configured ? 'SÌ' : 'NO'}
                </span>
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500">Configura prima il token (Step 1) per ottenere l&apos;URL webhook.</p>
          )}
        </Card>

        {/* D. Azioni manuali */}
        <Card title="Azioni manuali">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              type="button"
              onClick={handleStartSync}
              disabled={loadingStart || statusValue === 'initial_sync' || isDisconnected}
              className="bg-[#FF7300] font-semibold text-white hover:bg-[#e66a00] disabled:opacity-50"
            >
              {loadingStart ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Avvia Sincronizzazione Massiva
            </Button>
            <Button
              type="button"
              onClick={handleRefreshStatus}
              disabled={loadingRefresh}
              className="border border-gray-300 dark:border-gray-600"
            >
              {loadingRefresh ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Aggiorna Stato / Progresso
            </Button>
            {canSuspendOrRemove && (
              <>
                <Button
                  type="button"
                  onClick={() => handleDisconnect('suspend')}
                  disabled={loadingDisconnect}
                  className="border border-amber-500 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/30"
                  title="Mette in pausa la sincronizzazione. Puoi riavviarla dopo."
                >
                  {loadingDisconnect && disconnectConfirm === 'suspend' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PauseCircle className="mr-2 h-4 w-4" />
                  )}
                  Sospendi sincronizzazione
                </Button>
                <Button
                  type="button"
                  onClick={() =>
                    disconnectConfirm === 'remove'
                      ? handleDisconnect('remove')
                      : setDisconnectConfirm('remove')
                  }
                  disabled={loadingDisconnect}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                  title="Rimuove il collegamento con CardTrader. Dovrai inserire di nuovo il token."
                >
                  {loadingDisconnect && disconnectConfirm === 'remove' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Unlink className="mr-2 h-4 w-4" />
                  )}
                  {disconnectConfirm === 'remove' ? 'Conferma rimozione' : 'Rimuovi collegamento CardTrader'}
                </Button>
                {disconnectConfirm === 'remove' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDisconnectConfirm(null)}
                    className="text-gray-600 dark:text-gray-400"
                  >
                    Annulla
                  </Button>
                )}
              </>
            )}
          </div>
          {loadingStart && statusValue === 'initial_sync' && (
            <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
              Sincronizzazione avviata. Attendi il completamento…
            </p>
          )}
          {lastSyncError && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">Errore</p>
              <p className="text-sm text-red-600 dark:text-red-400">{lastSyncError}</p>
            </div>
          )}
          {lastSyncResult && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
              <p className="mb-1 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                Sincronizzazione completata
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                <strong>{lastSyncResult.processed}</strong> carte elaborate
                {lastSyncResult.total_products != null && lastSyncResult.total_products > 0 && (
                  <> di <strong>{lastSyncResult.total_products}</strong> totali</>
                )}.
                {' '}
                <strong>{lastSyncResult.created}</strong> aggiunte al DB,{' '}
                <strong>{lastSyncResult.updated}</strong> aggiornate,{' '}
                <strong>{lastSyncResult.skipped}</strong> saltate.
              </p>
            </div>
          )}
          {showProgress && (
            <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/50">
              <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">Progresso sincronizzazione</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {progress?.progress_percent ?? 0}% — elaborati {progress?.processed ?? 0} prodotti
                {progress?.total_products != null && ` di ${progress.total_products}`}.
                {progress?.created != null && ` Creati: ${progress.created}, aggiornati: ${progress.updated ?? 0}, saltati: ${progress.skipped ?? 0}.`}
              </p>
            </div>
          )}
        </Card>

        {/* E. Debug console */}
        <Card title="Debug Console">
          <div className="h-64 overflow-y-auto rounded-md bg-black p-4 font-mono text-sm text-green-400">
            {logs.length === 0 ? (
              <span className="text-gray-500">Le risposte API appariranno qui.</span>
            ) : (
              logs.map((entry, i) => (
                <div key={i} className="mb-3 border-b border-gray-800 pb-2 last:border-0">
                  <span className="text-gray-500">[{entry.ts}]</span>{' '}
                  <span className={entry.isError ? 'text-red-400' : 'text-green-400'}>{entry.label}</span>
                  <pre className={cn('mt-1 whitespace-pre-wrap break-all', entry.isError ? 'text-red-400' : 'text-green-400')}>
                    {entry.data}
                  </pre>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
