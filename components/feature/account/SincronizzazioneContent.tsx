'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { RefreshCw, Loader2, Play, Package, ArrowRight, Zap, Layers } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { syncClient } from '@/lib/api/sync-client';
import type { SyncStatusResponse, WebhookUrlResponse, SyncProgressResponse } from '@/lib/api/sync-client';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useCardTraderLink } from '@/lib/hooks/use-cardtrader-link';
import { classifySyncStatusLoadFailure } from '@/lib/sync/sync-status-load';
import { SyncModeSelector } from '@/components/feature/sync/SyncModeSelector';
import { SyncStatusOverview } from '@/components/feature/sync/SyncStatusOverview';
import { SyncWebhookCard } from '@/components/feature/sync/SyncWebhookCard';
import { SyncHistorySection } from '@/components/feature/sync/SyncHistorySection';
import { SyncManagementPanel } from '@/components/feature/sync/SyncManagementPanel';
import {
  getSyncEvents,
  getMarketplaceSyncStatus,
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
  const [statusResolved, setStatusResolved] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [statusLoadError, setStatusLoadError] = useState(false);
  const [loadingSetup, setLoadingSetup] = useState(false);
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingDisconnect, setLoadingDisconnect] = useState(false);

  const [linkTokenError, setLinkTokenError] = useState<string | null>(null);
  const [linkTokenMessage, setLinkTokenMessage] = useState<string | null>(null);
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
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userId = user?.id;
  const cardTraderLink = useCardTraderLink({ userId, accessToken });

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
    setStatusLoadError(false);
    const [statusResult, marketplaceResult] = await Promise.allSettled([
      syncClient.getSyncStatus(userId, accessToken),
      getMarketplaceSyncStatus(),
    ]);

    if (statusResult.status === 'fulfilled') {
      const statusRes = statusResult.value;
      setSyncStatus(statusRes);
      setNotConfigured(false);
      if (statusRes.disconnected) {
        setWebhookData(null);
      } else {
        const webhookResult = await Promise.allSettled([
          syncClient.getWebhookUrl(userId, accessToken),
        ]);
        setWebhookData(
          webhookResult[0].status === 'fulfilled' ? webhookResult[0].value : null,
        );
      }
      if (statusRes.sync_status === 'initial_sync') {
        const progressResult = await Promise.allSettled([
          syncClient.getSyncProgress(userId, accessToken),
        ]);
        if (progressResult[0].status === 'fulfilled') {
          setProgress(progressResult[0].value);
        }
      }
    } else {
      const failure = classifySyncStatusLoadFailure(statusResult.reason);
      if (failure === 'not_configured') {
        setSyncStatus(null);
        setWebhookData(null);
        setNotConfigured(true);
      } else {
        setStatusLoadError(true);
      }
    }

    setMarketplaceStatus(
      marketplaceResult.status === 'fulfilled' ? marketplaceResult.value : null,
    );
    setStatusResolved(true);
    setLoadingStatus(false);
    setLoadingWebhook(false);
    setMarketplaceLoading(false);
    void loadSyncEvents();
  }, [userId, accessToken, loadSyncEvents]);

  useEffect(() => {
    if (!userId || !accessToken) return;
    void refreshAll();
  }, [userId, accessToken, refreshAll]);

  useEffect(() => {
    return () => {
      pollingSessionRef.current += 1;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  const startPollingTask = useCallback(
    (taskId: string, sessionId: number) => {
      setCurrentTaskId(taskId);
      setLoadingStart(true);
      const pollIntervalMs = 4000;
      const maxPolls = 300;
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
          const taskRes = await syncClient.getTaskStatus(taskId, accessToken!);
          if (taskRes.ready) {
            if (taskRes.status === 'SUCCESS') {
              if (taskRes.result && typeof taskRes.result === 'object') {
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
              }
              setSyncStatus((prev) => (prev ? { ...prev, sync_status: 'active' } : null));
            } else if (taskRes.status === 'FAILURE' || taskRes.error) {
              setLastSyncError(taskRes.error || t('accountPage.syncErrFailedRetry'));
              setSyncStatus((prev) => (prev ? { ...prev, sync_status: 'error' } : null));
            }
            setLoadingStart(false);
            if (sessionId === pollingSessionRef.current) setCurrentTaskId(null);
            void refreshAll();
            return;
          }
          if (sessionId === pollingSessionRef.current) {
            pollTimerRef.current = setTimeout(poll, pollIntervalMs);
          }
        } catch {
          if (sessionId === pollingSessionRef.current) {
            pollTimerRef.current = setTimeout(poll, pollIntervalMs);
          }
        }
      };

      pollTimerRef.current = setTimeout(poll, pollIntervalMs);
    },
    [accessToken, refreshAll, t]
  );

  const handleLinkToken = async (token: string) => {
    if (!userId || !accessToken) return false;
    pollingSessionRef.current += 1;
    const sessionId = pollingSessionRef.current;
    setLoadingSetup(true);
    setLinkTokenError(null);
    setLinkTokenMessage(null);
    setLastSyncError(null);
    try {
      const result = await cardTraderLink.mutateAsync(token);
      const res = result.link;
      const initialTaskId = result.syncStart?.task_id;
      const importStarted = Boolean(initialTaskId);
      setNotConfigured(false);
      setStatusLoadError(false);
      setSyncStatus((prev) =>
        prev
          ? {
              ...prev,
              sync_status: importStarted
                ? 'initial_sync'
                : (res.sync_status as SyncStatusResponse['sync_status']),
              disconnected: false,
              execution_mode: res.execution_mode,
              mode_version: res.mode_version,
              writes_enabled: res.writes_enabled,
            }
          : {
              user_id: userId,
              sync_status: importStarted
                ? 'initial_sync'
                : (res.sync_status as SyncStatusResponse['sync_status']),
              last_sync_at: null,
              last_error: null,
              disconnected: false,
              execution_mode: res.execution_mode,
              mode_version: res.mode_version,
              writes_enabled: res.writes_enabled,
            }
      );
      if (result.webhook) setWebhookData(result.webhook);
      if (result.marketplaceStatus) setMarketplaceStatus(result.marketplaceStatus);

      if (importStarted && initialTaskId) {
        setLinkTokenMessage(t('accountPage.syncTokenLinkedAndStarted'));
        startPollingTask(initialTaskId, sessionId);
      } else if (result.followUpFailures.includes('initial_sync')) {
        setLinkTokenMessage(t('accountPage.syncTokenLinkedOnly'));
        setLastSyncError(t('accountPage.syncErrStartRetry'));
      } else {
        setLinkTokenMessage(t('accountPage.syncTokenLinked'));
      }
      return true;
    } catch (error: unknown) {
      const status = (error as { status?: number } | null)?.status;
      setLinkTokenError(
        status === 401
          ? t('accountPage.syncErrSession')
          : status === 409
            ? t('accountPage.syncErrConflict')
            : status === 422
              ? t('accountPage.syncErrTokenFormat')
              : status === 502
                ? t('accountPage.syncErrTokenRejected')
                : t('accountPage.syncErrLink'),
      );
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
      startPollingTask(taskId, sessionId);
    } catch (err: unknown) {
      const status = (err as { status?: number } | null)?.status;
      setLastSyncError(
        status === 409
          ? t('accountPage.syncErrConflict')
          : status === 401
            ? t('accountPage.syncErrSession')
            : t('accountPage.syncErrStartRetry'),
      );
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
          <p className="text-sm font-medium text-gray-500">{t('accountPage.syncLoadingAccount')}</p>
        </div>
      </div>
    );
  }

  const statusValue = syncStatus?.sync_status ?? 'idle';
  const isDisconnected = syncStatus?.disconnected === true || notConfigured;
  const webhookSecretReady = webhookData?.webhook_secret_configured === true;
  const integrationReady = Boolean(syncStatus && !isDisconnected);
  const canStartSync = integrationReady && statusValue !== 'initial_sync';
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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {t('accountPage.syncTitle')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Collega CardTrader e mantieni il tuo inventario sincronizzato in tempo reale con Ebartex.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refreshAll()}
          disabled={loadingStatus}
          className="shrink-0 border-gray-300 bg-white font-semibold text-gray-700 shadow-2xs hover:bg-gray-50"
        >
          {loadingStatus ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin text-[#FF7300]" />
          ) : (
            <RefreshCw className="mr-2 h-3.5 w-3.5 text-gray-500" />
          )}
          {t('accountPage.syncRefreshAll')}
        </Button>
      </div>

      {statusLoadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 shadow-2xs">
          {t('accountPage.syncStatusUnavailable')}
        </div>
      ) : statusResolved ? (
        <SyncManagementPanel
          isDisconnected={isDisconnected}
          loadingSetup={loadingSetup}
          loadingDisconnect={loadingDisconnect}
          linkError={linkTokenError}
          linkMessage={linkTokenMessage}
          onLinkToken={handleLinkToken}
          onSuspend={() => handleDisconnect('suspend')}
          onRemove={() => handleDisconnect('remove')}
        />
      ) : null}

      {/* Overview Metric Matrix */}
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Active Progress Banner */}
          {showProgress && progress && (
            <div className="overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50/50 to-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#FF7300]" />
                  <p className="text-sm font-bold text-orange-950">
                    {t('accountPage.syncProgressTitle')}
                  </p>
                </div>
                <span className="font-mono text-base font-extrabold text-[#FF7300]">
                  {progress.progress_percent ?? 0}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-orange-100/80">
                <div
                  className="h-full rounded-full bg-[#FF7300] transition-all duration-500"
                  style={{ width: `${Math.min(100, progress.progress_percent ?? 0)}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-orange-900">
                <span>
                  {t('accountPage.syncProgressLine', {
                    pct: progress.progress_percent ?? 0,
                    processed: progress.processed ?? 0,
                    totalPart:
                      progress.total_products != null
                        ? t('accountPage.syncTotalPart', { total: progress.total_products })
                        : '',
                  })}
                </span>
                {etaLabel && (
                  <span className="rounded bg-orange-200/60 px-2 py-0.5 font-bold text-orange-950">
                    ETA stimata: {etaLabel}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Mode Selector */}
          {integrationReady && <SyncModeSelector />}

          {/* Operations Card */}
          <section className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm transition-all">
            <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50/70 via-white to-white px-4 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-gray-900">
                {t('accountPage.syncOperationsTitle')}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {t('accountPage.syncOperationsText')}
              </p>
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  type="button"
                  onClick={() => void handleStartSync()}
                  disabled={loadingStart || !canStartSync}
                  className="h-10 bg-[#FF7300] px-5 font-bold text-white shadow-sm transition hover:bg-[#e66a00] disabled:opacity-50"
                >
                  {loadingStart ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  {statusValue === 'active'
                    ? t('accountPage.syncRefreshInventory')
                    : t('accountPage.syncStartFull')}
                </Button>

                {integrationReady && (
                  <Link
                    href="/account/oggetti"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-xs font-bold text-gray-700 shadow-2xs transition hover:bg-gray-50"
                  >
                    <Package className="mr-2 h-4 w-4 text-gray-500" />
                    {t('account.syncViewInventory')}
                  </Link>
                )}
              </div>

              {lastSyncError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-xs font-medium text-red-800 shadow-2xs"
                >
                  {lastSyncError}
                </div>
              )}

              {lastSyncResult && (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-xs font-medium text-emerald-900 shadow-2xs"
                >
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
                </div>
              )}

              {currentTaskId && (
                <p className="font-mono text-[11px] text-gray-400">
                  Task Celery attivo: {currentTaskId}
                </p>
              )}
            </div>
          </section>

          {/* Sync History */}
          {integrationReady && (
            <SyncHistorySection
              events={syncEvents}
              loading={syncEventsLoading}
              onRefresh={() => void loadSyncEvents()}
              total={syncEventsTotal}
            />
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          <SyncWebhookCard
            loading={loadingWebhook}
            webhookData={webhookData}
            isDisconnected={isDisconnected}
          />
        </div>
      </div>
    </div>
  );
}
