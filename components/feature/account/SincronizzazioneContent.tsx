'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { RefreshCw, Loader2, Play, Package } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { syncClient } from '@/lib/api/sync-client';
import type { SyncStatusResponse, WebhookUrlResponse, SyncProgressResponse } from '@/lib/api/sync-client';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { SyncModeSelector } from '@/components/feature/sync/SyncModeSelector';
import { SyncStatusOverview } from '@/components/feature/sync/SyncStatusOverview';
import { SyncWebhookCard } from '@/components/feature/sync/SyncWebhookCard';
import { SyncHistorySection } from '@/components/feature/sync/SyncHistorySection';
import { SyncManagementPanel } from '@/components/feature/sync/SyncManagementPanel';
import {
  getSyncEvents,
  getMarketplaceSyncStatus,
  MarketplaceApiError,
  type SyncEvent,
  type MarketplaceSyncStatus,
} from '@/lib/api/marketplace-client';

export function SincronizzazioneContent() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [syncStatus, setSyncStatus] = useState<SyncStatusResponse | null>(null);
  const [webhookData, setWebhookData] = useState<WebhookUrlResponse | null>(null);
  const [progress, setProgress] = useState<SyncProgressResponse | null>(null);
  const [marketplaceStatus, setMarketplaceStatus] = useState<MarketplaceSyncStatus | null>(null);

  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingWebhook, setLoadingWebhook] = useState(false);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [loadingSetup, setLoadingSetup] = useState(false);
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingDisconnect, setLoadingDisconnect] = useState(false);

  const [marketplaceSyncLoading, setMarketplaceSyncLoading] = useState(false);
  const [marketplaceSyncMessage, setMarketplaceSyncMessage] = useState<string | null>(null);
  const [marketplaceSyncError, setMarketplaceSyncError] = useState<string | null>(null);
  const [linkTokenError, setLinkTokenError] = useState<string | null>(null);
  const [syncEvents, setSyncEvents] = useState<SyncEvent[]>([]);
  const [syncEventsTotal, setSyncEventsTotal] = useState<number | undefined>();
  const [syncEventsLoading, setSyncEventsLoading] = useState(false);

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
  // Timer del polling ricorsivo: tracciato per fermarlo allo smontaggio.
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userId = user?.id;

  const loadSyncEvents = useCallback(async () => {
    setSyncEventsLoading(true);
    try {
      const res = await getSyncEvents({ page: 1, page_size: 30 });
      setSyncEvents(res.events);
      setSyncEventsTotal(res.total);
    } catch {
      /* keep previous */
    } finally {
      setSyncEventsLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    if (!userId || !accessToken) return;
    setLoadingStatus(true);
    setLoadingWebhook(true);
    setMarketplaceLoading(true);
    try {
      const [statusRes, webhookRes, mktRes] = await Promise.all([
        syncClient.getSyncStatus(userId, accessToken),
        syncClient.getWebhookUrl(userId, accessToken),
        getMarketplaceSyncStatus().catch(() => null),
      ]);
      setSyncStatus(statusRes);
      setWebhookData(webhookRes);
      setMarketplaceStatus(mktRes);
      if (statusRes.sync_status === 'initial_sync') {
        const progressRes = await syncClient.getSyncProgress(userId, accessToken);
        setProgress(progressRes);
      }
    } catch {
      /* partial failure ok */
    } finally {
      setLoadingStatus(false);
      setLoadingWebhook(false);
      setMarketplaceLoading(false);
    }
    void loadSyncEvents();
  }, [userId, accessToken, loadSyncEvents]);

  useEffect(() => {
    if (!userId || !accessToken) return;
    void refreshAll();
  }, [userId, accessToken, refreshAll]);

  // Ferma il polling ricorsivo allo smontaggio: evita timer orfani.
  useEffect(() => () => {
    pollingSessionRef.current += 1;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
  }, []);

  const handleLinkToken = async (token: string) => {
    if (!userId || !accessToken) return false;
    setLoadingSetup(true);
    setLinkTokenError(null);
    try {
      const res = await syncClient.linkCardtrader(
        { user_id: userId, cardtrader_token: token },
        accessToken
      );
      setSyncStatus((prev) =>
        prev
          ? {
              ...prev,
              sync_status: res.sync_status as SyncStatusResponse['sync_status'],
              disconnected: false,
              execution_mode: res.execution_mode,
              mode_version: res.mode_version,
              writes_enabled: res.writes_enabled,
            }
          : {
              user_id: userId,
              sync_status: res.sync_status as SyncStatusResponse['sync_status'],
              last_sync_at: null,
              last_error: null,
              disconnected: false,
              execution_mode: res.execution_mode,
              mode_version: res.mode_version,
              writes_enabled: res.writes_enabled,
            }
      );
      const webhookRes = await syncClient.getWebhookUrl(userId, accessToken);
      setWebhookData(webhookRes);
      setMarketplaceStatus(await getMarketplaceSyncStatus());
      return true;
    } catch {
      setLinkTokenError(t('accountPage.syncErrLink'));
      return false;
    } finally {
      setLoadingSetup(false);
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
      const isReconcile = syncStatus?.sync_status === 'active';
      const res = isReconcile
        ? await syncClient.reconcileFromCardTrader(userId, accessToken)
        : await syncClient.startSync(userId, accessToken);
      if (!isReconcile) {
        setSyncStatus((prev) => (prev ? { ...prev, sync_status: 'initial_sync' } : null));
      }
      const taskId = res?.task_id;
      if (!taskId) {
        setLoadingStart(false);
        return;
      }
      setCurrentTaskId(taskId);

      const pollIntervalMs = 5000;
      const maxPolls = 240;
      let polls = 0;

      const poll = async (): Promise<void> => {
        if (polls >= maxPolls) {
          setLastSyncError(t('accountPage.syncErrTimeout'));
          setLoadingStart(false);
          if (sessionId === pollingSessionRef.current) setCurrentTaskId(null);
          return;
        }
        polls += 1;
        try {
          const taskRes = await syncClient.getTaskStatus(taskId, accessToken);
          if (taskRes.ready) {
            if (taskRes.status === 'SUCCESS' && taskRes.result && typeof taskRes.result === 'object') {
              const r = taskRes.result as {
                created?: number;
                updated?: number;
                skipped?: number;
                total_products?: number;
                processed?: number;
              };
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
            }
            setLoadingStart(false);
            if (sessionId === pollingSessionRef.current) setCurrentTaskId(null);
            void refreshAll();
            return;
          }
          if (sessionId === pollingSessionRef.current) pollTimerRef.current = setTimeout(poll, pollIntervalMs);
        } catch {
          if (sessionId === pollingSessionRef.current) pollTimerRef.current = setTimeout(poll, pollIntervalMs);
        }
      };
      pollTimerRef.current = setTimeout(poll, pollIntervalMs);
    } catch (err: unknown) {
      setLastSyncError(err instanceof Error ? err.message : t('accountPage.syncErrStart'));
      setLoadingStart(false);
    }
  };

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
      } catch {
        /* ignore */
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 10000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [userId, accessToken, syncStatus?.sync_status]);

  const handleMarketplaceSyncTrigger = async () => {
    if (!userId || !accessToken) return;
    setMarketplaceSyncLoading(true);
    setMarketplaceSyncMessage(null);
    setMarketplaceSyncError(null);
    try {
      const res = await syncClient.reconcileFromCardTrader(userId, accessToken);
      setMarketplaceSyncMessage(res.message || 'Sincronizzazione marketplace avviata.');
      const mkt = await getMarketplaceSyncStatus();
      setMarketplaceStatus(mkt);
      await loadSyncEvents();
    } catch (err: unknown) {
      setMarketplaceSyncError(
        err instanceof MarketplaceApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : 'Sincronizzazione marketplace non riuscita.'
      );
    } finally {
      setMarketplaceSyncLoading(false);
    }
  };

  const handleDisconnect = async (action: 'suspend' | 'remove') => {
    if (!userId || !accessToken) return;
    setLoadingDisconnect(true);
    try {
      await syncClient.disconnectSync(userId, accessToken, action);
      if (action === 'remove') {
        setSyncStatus({
          user_id: userId,
          sync_status: 'idle',
          last_sync_at: null,
          last_error: null,
          disconnected: true,
          execution_mode: 'demo',
          mode_version: (syncStatus?.mode_version ?? 0) + 1,
          writes_enabled: false,
        });
        setWebhookData(null);
      } else {
        setSyncStatus((prev) => (prev ? { ...prev, sync_status: 'idle' } : null));
      }
      void refreshAll();
    } finally {
      setLoadingDisconnect(false);
    }
  };

  if (!user || !accessToken) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF7300]" />
          <p className="text-sm text-gray-500">{t('accountPage.syncLoadingAccount')}</p>
        </div>
      </div>
    );
  }

  const statusValue = syncStatus?.sync_status ?? 'idle';
  const isDisconnected = syncStatus?.disconnected === true;
  const webhookSecretReady = webhookData?.webhook_secret_configured === true;
  const hasWebhookUrl = Boolean(webhookData?.webhook_url);
  const integrationReady = Boolean(syncStatus && !isDisconnected);
  const canStartSync =
    integrationReady && hasWebhookUrl && webhookSecretReady && statusValue !== 'initial_sync';
  const showProgress = statusValue === 'initial_sync' && progress;
  const etaLabel =
    etaSeconds != null
      ? etaSeconds > 120
        ? `${Math.ceil(etaSeconds / 60)} min`
        : `${etaSeconds}s`
      : null;

  return (
    <div className="space-y-6 text-gray-900">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {t('accountPage.syncTitle')}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-gray-600">
            Collega CardTrader, configura il webhook e controlla come EBARTEX sincronizza il tuo
            inventario e i listing.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void refreshAll()}
          disabled={loadingStatus}
          className="shrink-0 border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        >
          {loadingStatus ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Aggiorna tutto
        </Button>
      </div>

      {isDisconnected && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t('accountPage.syncDisconnectedBanner')}
        </div>
      )}

      <SyncStatusOverview
        loading={loadingStatus}
        brxStatus={syncStatus?.sync_status ?? null}
        isDisconnected={isDisconnected}
        webhookConfigured={webhookSecretReady}
        marketplaceStatus={marketplaceStatus}
        marketplaceLoading={marketplaceLoading}
        lastSyncAt={syncStatus?.last_sync_at ?? null}
        lastError={syncStatus?.last_error ?? null}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {showProgress && progress && (
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-amber-900">
                  {t('accountPage.syncProgressTitle')}
                </p>
                <span className="text-lg font-bold text-[#FF7300]">
                  {progress.progress_percent ?? 0}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-amber-100">
                <div
                  className="h-full rounded-full bg-[#FF7300] transition-all duration-500"
                  style={{ width: `${Math.min(100, progress.progress_percent ?? 0)}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-amber-800">
                {t('accountPage.syncProgressLine', {
                  pct: progress.progress_percent ?? 0,
                  processed: progress.processed ?? 0,
                  totalPart:
                    progress.total_products != null
                      ? t('accountPage.syncTotalPart', { total: progress.total_products })
                      : '',
                })}
                {etaLabel ? ` · ETA: ${etaLabel}` : ''}
              </p>
            </div>
          )}

          {integrationReady && <SyncModeSelector />}

          <section className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-5">
            <h2 className="mb-1 text-sm font-semibold text-gray-900">Operazioni</h2>
            <p className="mb-4 text-xs text-gray-500">
              Import inventario da CardTrader e sync listing verso EBARTEX
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                onClick={() => void handleStartSync()}
                disabled={loadingStart || !canStartSync}
                className="bg-[#FF7300] font-semibold text-white hover:bg-[#e66a00] disabled:opacity-50"
              >
                {loadingStart ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {t('accountPage.syncStartFull')}
              </Button>
              {integrationReady && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleMarketplaceSyncTrigger()}
                  disabled={marketplaceSyncLoading}
                  className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  {marketplaceSyncLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sincronizza listing EBARTEX
                </Button>
              )}
              {integrationReady && (
                <Link
                  href="/account/oggetti"
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Vedi inventario
                </Link>
              )}
            </div>
            {!canStartSync && integrationReady && !webhookSecretReady && (
              <p className="mt-3 text-sm text-amber-700">{t('account.syncVerifyFirst')}</p>
            )}
            {marketplaceSyncMessage && (
              <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {marketplaceSyncMessage}
              </p>
            )}
            {marketplaceSyncError && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {marketplaceSyncError}
              </p>
            )}
            {lastSyncError && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {lastSyncError}
              </p>
            )}
            {lastSyncResult && (
              <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {t('accountPage.syncProcessedLine', {
                  processed: lastSyncResult.processed,
                  totalPart:
                    lastSyncResult.total_products > 0
                      ? t('accountPage.syncTotalPart', { total: lastSyncResult.total_products })
                      : '',
                  created: lastSyncResult.created,
                  updated: lastSyncResult.updated,
                  skipped: lastSyncResult.skipped,
                })}
              </p>
            )}
            {currentTaskId && (
              <p className="mt-2 font-mono text-xs text-gray-400">Task: {currentTaskId}</p>
            )}
          </section>

          {integrationReady && (
            <SyncHistorySection
              events={syncEvents}
              loading={syncEventsLoading}
              onRefresh={() => void loadSyncEvents()}
              total={syncEventsTotal}
            />
          )}
        </div>

        {/* Sidebar — webhook + management always visible */}
        <div className="space-y-6 lg:col-span-1">
          <SyncWebhookCard
            loading={loadingWebhook}
            webhookData={webhookData}
            isDisconnected={isDisconnected}
          />
          <SyncManagementPanel
            isDisconnected={isDisconnected}
            loadingSetup={loadingSetup}
            loadingDisconnect={loadingDisconnect}
            linkError={linkTokenError}
            onLinkToken={handleLinkToken}
            onSuspend={() => handleDisconnect('suspend')}
            onRemove={() => handleDisconnect('remove')}
          />
        </div>
      </div>
    </div>
  );
}
