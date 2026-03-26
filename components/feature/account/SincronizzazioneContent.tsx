'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
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
import { useTranslation } from '@/lib/i18n/useTranslation';
import { AccountBreadcrumb } from '@/components/feature/account/AccountBreadcrumb';

type LogEntry = { ts: string; label: string; data: string; isError?: boolean };

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
        'rounded-none border border-gray-200 bg-white p-5 shadow-sm',
        className
      )}
    >
      {title && (
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const config: Record<string, { bg: string; key: 'accountPage.syncStatusActive' | 'accountPage.syncStatusSyncing' | 'accountPage.syncStatusIdle' | 'accountPage.syncStatusError' }> = {
    active: { bg: 'bg-emerald-500/20 text-emerald-600', key: 'accountPage.syncStatusActive' },
    initial_sync: { bg: 'bg-amber-500/20 text-amber-600', key: 'accountPage.syncStatusSyncing' },
    idle: { bg: 'bg-gray-500/20 text-gray-600', key: 'accountPage.syncStatusIdle' },
    error: { bg: 'bg-red-500/20 text-red-600', key: 'accountPage.syncStatusError' },
  };
  const c = config[status] || config.idle;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-none px-3 py-1 text-xs font-medium',
        c.bg
      )}
    >
      {t(c.key)}
    </span>
  );
}

export function SincronizzazioneContent() {
  const { t } = useTranslation();
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
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const pollingSessionRef = useRef(0);
  const progressSampleRef = useRef<{ ts: number; pct: number } | null>(null);

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
    pollingSessionRef.current += 1;
    const sessionId = pollingSessionRef.current;
    setLoadingStart(true);
    setLastSyncResult(null);
    setLastSyncError(null);
    setEtaSeconds(null);
    try {
      const res = await syncClient.startSync(userId, accessToken);
      addLog('startSync', res);
      setSyncStatus((prev) => (prev ? { ...prev, sync_status: 'initial_sync' } : null));

      const taskId = res?.task_id;
      if (!taskId) {
        setLoadingStart(false);
        return;
      }
      setCurrentTaskId(taskId);

      // Poll task status until completed (max ~10 min)
      const pollIntervalMs = 2500;
      const maxPolls = 240; // 10 min
      let polls = 0;

      const poll = async (): Promise<void> => {
        if (polls >= maxPolls) {
          setLastSyncError(t('accountPage.syncErrTimeout'));
          setLoadingStart(false);
          if (sessionId === pollingSessionRef.current) {
            setCurrentTaskId(null);
          }
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
              setLastSyncError(taskRes.error || t('accountPage.syncErrFailed'));
            } else {
              setLastSyncError('Sincronizzazione completata ma risultato dettagliato non disponibile.');
            }
            setLoadingStart(false);
            if (sessionId === pollingSessionRef.current) {
              setCurrentTaskId(null);
            }
            return;
          }

          if (sessionId === pollingSessionRef.current) {
            setTimeout(poll, pollIntervalMs);
          }
        } catch (err: any) {
          addLog('getTaskStatus ERROR', { message: err?.message }, true);
          if (sessionId === pollingSessionRef.current) {
            setTimeout(poll, pollIntervalMs);
          }
        }
      };

      setTimeout(poll, pollIntervalMs);
    } catch (err: any) {
      addLog('startSync ERROR', { message: err?.message, data: err?.data }, true);
      setLastSyncError(err?.message || t('accountPage.syncErrStart'));
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

  // Poll live progress while initial sync is running.
  useEffect(() => {
    if (!userId || !accessToken) return;
    if (syncStatus?.sync_status !== 'initial_sync') {
      progressSampleRef.current = null;
      setEtaSeconds(null);
      return;
    }

    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      try {
        const [statusRes, progressRes] = await Promise.all([
          syncClient.getSyncStatus(userId, accessToken),
          syncClient.getSyncProgress(userId, accessToken),
        ]);
        if (stopped) return;
        setSyncStatus(statusRes);
        setProgress(progressRes);

        const pct = Number(progressRes.progress_percent ?? 0);
        const now = Date.now();
        const prev = progressSampleRef.current;
        if (pct > 0 && pct < 100 && prev && pct > prev.pct) {
          const ratePctPerMs = (pct - prev.pct) / Math.max(1, now - prev.ts);
          const remainingPct = 100 - pct;
          const estimateMs = remainingPct / ratePctPerMs;
          if (Number.isFinite(estimateMs) && estimateMs > 0) {
            setEtaSeconds(Math.round(estimateMs / 1000));
          }
        }
        progressSampleRef.current = { ts: now, pct };
      } catch (err: any) {
        addLog('liveProgress ERROR', { message: err?.message }, true);
      }
    };

    void tick();
    const id = setInterval(() => void tick(), 3000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [userId, accessToken, syncStatus?.sync_status, addLog]);

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
      <div className="text-gray-900">
        <AccountBreadcrumb current="sidebar.sync" />
        <div className="mt-8 flex items-center justify-center border border-gray-200 bg-white p-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF7300]" />
            <p className="text-sm text-gray-500">{t('accountPage.syncLoadingAccount')}</p>
          </div>
        </div>
      </div>
    );
  }

  const statusValue = syncStatus?.sync_status ?? 'idle';
  const showProgress = statusValue === 'initial_sync' && progress;
  const isDisconnected = syncStatus?.disconnected === true;
  const canSuspendOrRemove = Boolean(syncStatus && !isDisconnected);
  const hasWebhookUrl = Boolean(webhookData?.webhook_url);
  const webhookSecretReady = webhookData?.webhook_secret_configured === true;
  const integrationReady = Boolean(syncStatus && !isDisconnected);
  const canStartSync = integrationReady && hasWebhookUrl && webhookSecretReady && statusValue !== 'initial_sync';
  const etaLabel =
    etaSeconds != null
      ? etaSeconds > 120
        ? `${Math.ceil(etaSeconds / 60)} min`
        : `${etaSeconds}s`
      : null;
  const syncCompleted = statusValue === 'active' || Boolean(lastSyncResult);
  const currentStep = !integrationReady ? 1 : !webhookSecretReady ? 2 : !syncCompleted ? 3 : 4;

  return (
    <div className="text-gray-900">
      <AccountBreadcrumb current="sidebar.sync" />

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900">{t('accountPage.syncTitle')}</h1>
          {loadingStatus ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" /> : <StatusBadge status={statusValue} />}
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          {[1, 2, 3, 4].map((s) => {
            const done = s < currentStep || (s === 4 && syncCompleted);
            const active = s === currentStep;
            return (
              <div
                key={s}
                className={cn(
                  'rounded-lg border px-3 py-2 text-xs font-medium',
                  done ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-600',
                  active && 'border-[#FF7300] bg-orange-50 text-[#FF7300]'
                )}
              >
                STEP {s}
              </div>
            );
          })}
        </div>
      </div>

      {isDisconnected && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {t('accountPage.syncDisconnectedBanner')}
        </div>
      )}

      {currentStep === 1 && (
        <Card title="Step 1 - Collega CardTrader">
          <p className="mb-4 text-sm text-gray-600">
            Inserisci il token API CardTrader per attivare l’integrazione.
          </p>
          <div className="flex flex-wrap gap-3">
            <Input
              type="password"
              placeholder={t('accountPage.syncTokenPlaceholder')}
              value={cardtraderToken}
              onChange={(e) => setCardtraderToken(e.target.value)}
              className="max-w-md rounded-none border-gray-300 bg-white text-gray-900 focus-visible:ring-1 focus-visible:ring-[#FF7300]"
            />
            <Button
              type="button"
              onClick={handleSetupTestUser}
              disabled={loadingSetup || !cardtraderToken.trim()}
              className="bg-[#FF7300] font-semibold text-white hover:bg-[#e66a00] disabled:opacity-50"
            >
              {loadingSetup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('accountPage.syncSaveConnect')}
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 2 && (
        <Card title="Step 2 - Configura Webhook">
          {loadingWebhook ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('accountPage.syncLoadingWebhook')}
            </div>
          ) : webhookData ? (
            <>
              <p className="mb-3 text-sm text-gray-600">
                Copia l’URL e inseriscilo su CardTrader. Al momento sincronizziamo solo Magic: The Gathering.
              </p>
              <div className="mb-3 flex gap-2">
                <Input
                  readOnly
                  value={webhookData.webhook_url}
                  className="rounded-none border-gray-300 bg-white font-mono text-sm text-gray-700 focus-visible:ring-1 focus-visible:ring-[#FF7300]"
                />
                <Button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="h-10 w-10 shrink-0 rounded-none border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {copied && <p className="mb-3 text-xs font-medium text-emerald-600">{t('accountPage.syncCopied')}</p>}
              <ol className="mb-4 list-inside list-decimal space-y-1 text-sm text-gray-600">
                <li>
                  <a
                    href="https://www.cardtrader.com/it/full_api_app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#FF7300] hover:underline"
                  >
                    {t('accountPage.syncWebhookStep1')} <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>{t('accountPage.syncWebhookStep2')}</li>
                <li>{t('accountPage.syncWebhookStep3')}</li>
              </ol>
              <p className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">{t('accountPage.syncWebhookSecret')}</span>
                <span
                  className={cn(
                    'font-medium',
                    webhookData.webhook_secret_configured ? 'text-emerald-600' : 'text-amber-600'
                  )}
                >
                  {webhookData.webhook_secret_configured ? t('accountPage.syncYes') : t('accountPage.syncNo')}
                </span>
              </p>
              {!webhookSecretReady && (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Configura il secret su CardTrader per procedere allo step successivo.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">{t('accountPage.syncConfigureTokenFirst')}</p>
          )}
        </Card>
      )}

      {currentStep === 3 && (
        <Card title="Step 3 - Avvia sincronizzazione">
          <p className="mb-4 text-sm text-gray-600">
            Avvia la sincronizzazione iniziale. Ti mostreremo avanzamento e risultato nel prossimo step.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button
              type="button"
              onClick={handleStartSync}
              disabled={loadingStart || !canStartSync}
              className="bg-[#FF7300] font-semibold text-white hover:bg-[#e66a00] disabled:opacity-50"
            >
              {loadingStart ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('accountPage.syncStartFull')}
            </Button>
            {!canStartSync && (
              <span className="text-sm text-gray-500">Verifica prima token, webhook e secret configurato.</span>
            )}
          </div>
          {loadingStart && (
            <p className="mt-4 text-sm text-amber-600">{t('accountPage.syncStartedWait')}</p>
          )}
        </Card>
      )}

      {currentStep === 4 && (
        <Card title="Step 4 - Stato sincronizzazione">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleRefreshStatus}
              disabled={loadingRefresh}
              className="rounded-none border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              {loadingRefresh ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {t('accountPage.syncRefreshProgress')}
            </Button>
            {currentTaskId ? (
              <span className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                Task: {currentTaskId}
              </span>
            ) : null}
          </div>

          {showProgress && progress && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="mb-2 text-sm font-medium text-gray-700">{t('accountPage.syncProgressTitle')}</p>
              <p className="text-sm text-gray-600">
                {t('accountPage.syncProgressLine', {
                  pct: progress.progress_percent ?? 0,
                  processed: progress.processed ?? 0,
                  totalPart:
                    progress.total_products != null
                      ? t('accountPage.syncTotalPart', { total: progress.total_products })
                      : '',
                })}
                {progress.created != null
                  ? ` ${t('accountPage.syncProgressTail', {
                      c: progress.created,
                      u: progress.updated ?? 0,
                      s: progress.skipped ?? 0,
                    })}`
                  : ''}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Chunk: {progress.processed_chunks ?? 0}/{progress.total_chunks ?? '—'}
                {etaLabel ? ` · ETA stimata: ${etaLabel}` : ''}
              </p>
            </div>
          )}

          {lastSyncError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">{t('accountPage.syncErrorTitle')}</p>
              <p className="text-sm text-red-600">{lastSyncError}</p>
            </div>
          )}

          {lastSyncResult && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="mb-1 text-sm font-semibold text-emerald-800">{t('accountPage.syncCompleteTitle')}</p>
              <p className="text-sm text-emerald-700">
                {t('accountPage.syncProcessedLine', {
                  processed: lastSyncResult.processed,
                  totalPart:
                    lastSyncResult.total_products != null && lastSyncResult.total_products > 0
                      ? t('accountPage.syncTotalPart', { total: lastSyncResult.total_products })
                      : '',
                  created: lastSyncResult.created,
                  updated: lastSyncResult.updated,
                  skipped: lastSyncResult.skipped,
                })}
              </p>
              <div className="mt-4">
                <Link
                  href="/account/oggetti"
                  className="inline-flex items-center rounded-md bg-[#FF7300] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e66a00]"
                >
                  Vedi ora il mio inventario
                </Link>
              </div>
            </div>
          )}

          {canSuspendOrRemove && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4">
              <Button
                type="button"
                onClick={() => handleDisconnect('suspend')}
                disabled={loadingDisconnect}
                className="border border-amber-500 text-amber-700 hover:bg-amber-50"
                title={t('accountPage.syncSuspendTitle')}
              >
                {loadingDisconnect && disconnectConfirm === 'suspend' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PauseCircle className="mr-2 h-4 w-4" />
                )}
                {t('accountPage.syncSuspend')}
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
                className="border-red-300 text-red-700 hover:bg-red-50"
                title={t('accountPage.syncRemoveTitle')}
              >
                {loadingDisconnect && disconnectConfirm === 'remove' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Unlink className="mr-2 h-4 w-4" />
                )}
                {disconnectConfirm === 'remove' ? t('accountPage.syncConfirmRemove') : t('accountPage.syncRemoveLink')}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
