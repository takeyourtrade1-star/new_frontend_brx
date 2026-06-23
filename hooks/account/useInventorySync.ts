import { useCallback, useEffect, useState } from 'react';
import { syncClient } from '@/lib/api/sync-client';
import type { SyncStatusResponse } from '@/lib/api/sync-client';
import type { MessageKey } from '@/lib/i18n/messages/en';

type SyncBanner = { type: 'success' | 'error' | 'info'; message: string } | null;

/**
 * Piano 1.4 — seam "sync marketplace" estratto da OggettiContent.
 * Incapsula: verifica stato sync, banner, flag derivati e l'intero flusso
 * `handleSyncNow` (avvio/aggancio/recover + polling task + applicazione risultato).
 * Logica spostata fedelmente; comportamento invariato.
 */
export function useInventorySync({
  userId,
  accessToken,
  refreshInventory,
  t,
}: {
  userId: string | undefined;
  accessToken: string | null;
  refreshInventory: () => Promise<void>;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}) {
  const [syncBanner, setSyncBanner] = useState<SyncBanner>(null);
  const [syncPending, setSyncPending] = useState(false);
  const [syncNowPending, setSyncNowPending] = useState(false);

  /** Verifica lato frontend: chiamate al sync service solo se integrazione marketplace attiva. */
  const [syncStatus, setSyncStatus] = useState<SyncStatusResponse | null>(null);
  const [syncStatusLoading, setSyncStatusLoading] = useState(true);

  const syncEnabled =
    Boolean(syncStatus && !syncStatus.disconnected) &&
    (syncStatus?.sync_status === 'active' || syncStatus?.sync_status === 'initial_sync');
  const isDisconnected = syncStatus?.disconnected === true;
  const integrationConnected = Boolean(syncStatus && !isDisconnected);
  const syncAnyPending = syncPending || syncNowPending;
  const canSyncNow = integrationConnected && syncStatus?.sync_status !== 'initial_sync';

  // 1) Verifica stato sync con il marketplace (una sola chiamata, prima di qualsiasi altra al sync service)
  useEffect(() => {
    if (!userId || !accessToken) {
      setSyncStatusLoading(false);
      return;
    }
    let cancelled = false;
    setSyncStatusLoading(true);
    syncClient
      .getSyncStatus(userId, accessToken)
      .then((res) => {
        if (!cancelled) setSyncStatus(res);
      })
      .catch(() => {
        if (!cancelled) setSyncStatus(null);
      })
      .finally(() => {
        if (!cancelled) setSyncStatusLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId, accessToken]);

  const handleSyncNow = useCallback(async () => {
    if (!userId || !accessToken || !syncStatus) return;
    if (isDisconnected) return;

    setSyncNowPending(true);
    setSyncBanner(null);

    const pollTaskUntilReady = async (taskId: string) => {
      const pollIntervalMs = 2500;
      const maxPolls = 240; // ~10 min
      let lastTask: Awaited<ReturnType<typeof syncClient.getTaskStatus>> | null = null;
      for (let polls = 0; polls < maxPolls; polls++) {
        lastTask = await syncClient.getTaskStatus(taskId, accessToken);
        if (lastTask.ready) break;
        await new Promise((r) => setTimeout(r, pollIntervalMs));
      }
      if (!lastTask?.ready) throw new Error(t('accountPage.syncErrTimeout'));
      return lastTask;
    };

    const applyTaskResult = async (
      task: Awaited<ReturnType<typeof syncClient.getTaskStatus>> | null
    ): Promise<void> => {
      const [nextStatus] = await Promise.all([
        syncClient.getSyncStatus(userId, accessToken).catch(() => syncStatus),
      ]);
      setSyncStatus(nextStatus);
      await refreshInventory();

      if (!task) return;

      if (task.status === 'SUCCESS') {
        const r = (task.result ?? {}) as {
          processed?: number;
          total_products?: number;
          created?: number;
          updated?: number;
          skipped?: number;
        };
        const parts: string[] = [];
        if (typeof r.processed === 'number') {
          parts.push(
            `Processati ${r.processed}${typeof r.total_products === 'number' && r.total_products > 0 ? `/${r.total_products}` : ''}`
          );
        }
        if (
          typeof r.created === 'number' ||
          typeof r.updated === 'number' ||
          typeof r.skipped === 'number'
        ) {
          parts.push(`C:${r.created ?? 0} U:${r.updated ?? 0} S:${r.skipped ?? 0}`);
        }
        setSyncBanner({ type: 'success', message: parts.join(' · ') });
      } else {
        const msg =
          (typeof task.error === 'string' && task.error) ||
          task.message ||
          t('accountPage.syncErrFailed');
        setSyncBanner({ type: 'error', message: msg });
      }
    };

    const attachOrRecoverRunningSync = async () => {
      setSyncBanner({ type: 'info', message: 'Sincronizzazione già in corso: mi aggancio al task attivo…' });
      const progressRes = await syncClient.getSyncProgress(userId, accessToken);
      const opId = progressRes.operation_id;
      if (opId) {
        const task = await pollTaskUntilReady(opId);
        await applyTaskResult(task);
        return;
      }

      // Stato incoerente: backend segnala sync in corso ma non espone operation_id.
      // Proviamo un avvio forzato per riallineare lo stato.
      const forced = await syncClient.startSync(userId, accessToken, true);
      if (!forced?.task_id) throw new Error(t('accountPage.syncErrStart'));
      const forcedTask = await pollTaskUntilReady(forced.task_id);
      await applyTaskResult(forcedTask);
    };

    try {
      if (syncStatus.sync_status === 'initial_sync') {
        await attachOrRecoverRunningSync();
        return;
      }

      const startRes = await syncClient.startSync(userId, accessToken);
      const taskId = startRes?.task_id;
      if (!taskId) throw new Error(t('accountPage.syncErrStart'));

      const lastTask = await pollTaskUntilReady(taskId);
      await applyTaskResult(lastTask);
    } catch (e) {
      const errStatus = (e as { status?: unknown })?.status;
      const errMsg = e instanceof Error ? e.message : (e as { message?: unknown })?.message;
      const isConflict =
        errStatus === 409 || (typeof errMsg === 'string' && errMsg.toLowerCase().includes('conflict'));

      if (isConflict) {
        try {
          await attachOrRecoverRunningSync();
        } catch (innerErr: unknown) {
          const innerMsg = innerErr instanceof Error ? innerErr.message : t('accountPage.syncErrFailed');
          setSyncBanner({ type: 'error', message: innerMsg });
        }
      } else {
        const msg = e instanceof Error ? e.message : t('accountPage.syncErrFailed');
        setSyncBanner({ type: 'error', message: msg });
      }
    } finally {
      setSyncNowPending(false);
    }
  }, [userId, accessToken, syncStatus, isDisconnected, refreshInventory, t]);

  return {
    syncStatus,
    syncStatusLoading,
    syncBanner,
    setSyncBanner,
    syncPending,
    setSyncPending,
    syncNowPending,
    syncEnabled,
    isDisconnected,
    integrationConnected,
    syncAnyPending,
    canSyncNow,
    handleSyncNow,
  };
}
