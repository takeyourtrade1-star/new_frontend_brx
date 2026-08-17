'use client';

import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Link2,
  Webhook,
  Package,
  Store,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { SyncStatus } from '@/lib/api/sync-client';
import type { MarketplaceSyncStatus, SyncMode } from '@/lib/api/marketplace-client';

type CheckState = 'ok' | 'warn' | 'error' | 'loading' | 'idle';

function StatusTile({
  label,
  value,
  state,
  icon: Icon,
}: {
  label: string;
  value: string;
  state: CheckState;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const styles: Record<CheckState, string> = {
    ok: 'border-emerald-200 bg-emerald-50/80 text-emerald-800',
    warn: 'border-amber-200 bg-amber-50/80 text-amber-800',
    error: 'border-red-200 bg-red-50/80 text-red-800',
    loading: 'border-gray-200 bg-gray-50 text-gray-600',
    idle: 'border-gray-200 bg-white text-gray-600',
  };
  const dot: Record<CheckState, React.ReactNode> = {
    ok: <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />,
    warn: <AlertCircle className="h-4 w-4 text-amber-600" aria-hidden />,
    error: <XCircle className="h-4 w-4 text-red-600" aria-hidden />,
    loading: <Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-hidden />,
    idle: <span className="h-2 w-2 rounded-full bg-gray-300" aria-hidden />,
  };

  return (
    <div className={cn('flex flex-col gap-1.5 rounded-xl border p-2.5 transition-colors sm:gap-2 sm:p-4', styles[state])}>
      <div className="flex items-center justify-between gap-2">
        <Icon className="h-4 w-4 shrink-0 opacity-80 sm:h-5 sm:w-5" aria-hidden />
        {dot[state]}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
        <p className="mt-0.5 text-sm font-semibold leading-snug">{value}</p>
      </div>
    </div>
  );
}

const SYNC_MODE_LABELS: Record<SyncMode, string> = {
  demo: 'DEMO',
  partial: 'PARZIALE',
  real: 'REALE',
};

const BRX_STATUS_LABELS: Record<SyncStatus, string> = {
  active: 'Attiva',
  initial_sync: 'Import in corso',
  idle: 'In attesa',
  error: 'Errore',
};

export function SyncStatusOverview({
  loading,
  brxStatus,
  isDisconnected,
  webhookConfigured,
  marketplaceStatus,
  marketplaceLoading,
  lastSyncAt,
  lastError,
}: {
  loading: boolean;
  brxStatus: SyncStatus | null;
  isDisconnected: boolean;
  webhookConfigured: boolean;
  marketplaceStatus: MarketplaceSyncStatus | null;
  marketplaceLoading: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
}) {
  const intlLocale = useIntlLocale();
  const { t } = useTranslation();
  const cardtraderState: CheckState = loading
    ? 'loading'
    : isDisconnected
      ? 'idle'
      : brxStatus === 'error'
        ? 'error'
        : brxStatus
          ? 'ok'
          : 'warn';

  const webhookState: CheckState = loading
    ? 'loading'
    : isDisconnected
      ? 'idle'
      : webhookConfigured
        ? 'ok'
        : 'warn';

  const importState: CheckState = loading
    ? 'loading'
    : brxStatus === 'initial_sync'
      ? 'loading'
      : brxStatus === 'active'
        ? 'ok'
        : isDisconnected
          ? 'idle'
          : 'warn';

  const marketplaceState: CheckState = marketplaceLoading
    ? 'loading'
    : marketplaceStatus
      ? 'ok'
      : 'warn';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
        <StatusTile
          label="CardTrader"
          icon={Link2}
          state={cardtraderState}
          value={
            isDisconnected
              ? 'Non collegato'
              : brxStatus
                ? BRX_STATUS_LABELS[brxStatus]
                : '—'
          }
        />
        <StatusTile
          label="Webhook"
          icon={Webhook}
          state={webhookState}
          value={webhookConfigured ? 'Configurato' : isDisconnected ? '—' : 'Da configurare su CT'}
        />
        <StatusTile
          label="Inventario"
          icon={Package}
          state={importState}
          value={
            brxStatus === 'initial_sync'
              ? 'Sincronizzazione…'
              : brxStatus === 'active'
                ? 'Importato'
                : isDisconnected
                  ? '—'
                  : 'Non importato'
          }
        />
        <StatusTile
          label="Marketplace EBARTEX"
          icon={Store}
          state={marketplaceState}
          value={
            marketplaceStatus
              ? `${SYNC_MODE_LABELS[marketplaceStatus.sync_mode]} · ${marketplaceStatus.synced_listings}/${marketplaceStatus.total_listings} listing`
              : '—'
          }
        />
      </div>

      {(lastSyncAt || lastError) && (
        <div className="flex flex-wrap gap-4 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 text-xs text-gray-600">
          {lastSyncAt && (
            <span>
              Ultima sync:{' '}
              <strong className="font-medium text-gray-800">
                {new Date(lastSyncAt).toLocaleString(intlLocale)}
              </strong>
            </span>
          )}
          {lastError && (
            <span className="text-red-700">
              {t('accountPage.syncErrorTitle')}:{' '}
              <strong>{t('accountPage.syncLastErrorSafe')}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
