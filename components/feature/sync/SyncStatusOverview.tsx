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
  Clock,
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
  badgeText,
}: {
  label: string;
  value: string;
  state: CheckState;
  icon: React.ComponentType<{ className?: string }>;
  badgeText?: string;
}) {
  const containerStyles: Record<CheckState, string> = {
    ok: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 via-white to-white text-emerald-950 shadow-2xs',
    warn: 'border-amber-200/80 bg-gradient-to-br from-amber-50/60 via-white to-white text-amber-950 shadow-2xs',
    error: 'border-red-200/80 bg-gradient-to-br from-red-50/60 via-white to-white text-red-950 shadow-2xs',
    loading: 'border-orange-200/80 bg-gradient-to-br from-orange-50/60 via-white to-white text-gray-800 shadow-2xs',
    idle: 'border-gray-200/80 bg-white text-gray-700 shadow-2xs',
  };

  const iconStyles: Record<CheckState, string> = {
    ok: 'bg-emerald-100 text-emerald-700',
    warn: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
    loading: 'bg-orange-100 text-[#FF7300]',
    idle: 'bg-gray-100 text-gray-400',
  };

  const dot: Record<CheckState, React.ReactNode> = {
    ok: <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />,
    warn: <AlertCircle className="h-4 w-4 text-amber-600" aria-hidden />,
    error: <XCircle className="h-4 w-4 text-red-600" aria-hidden />,
    loading: <Loader2 className="h-4 w-4 animate-spin text-[#FF7300]" aria-hidden />,
    idle: <span className="h-2 w-2 rounded-full bg-gray-300" aria-hidden />,
  };

  return (
    <div className={cn('flex flex-col justify-between rounded-2xl border p-4 transition-all', containerStyles[state])}>
      <div className="flex items-center justify-between gap-2">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', iconStyles[state])}>
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        {dot[state]}
      </div>

      <div className="mt-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <p className="text-sm font-bold text-gray-900">{value}</p>
          {badgeText && (
            <span className="inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
              {badgeText}
            </span>
          )}
        </div>
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
  initial_sync: 'In importazione',
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
        : brxStatus === 'initial_sync'
          ? 'loading'
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
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          label="Webhook Ricezione"
          icon={Webhook}
          state={webhookState}
          value={webhookConfigured ? 'Configurato' : isDisconnected ? 'Non attivo' : 'Da incollare su CT'}
        />
        <StatusTile
          label="Inventario Magic"
          icon={Package}
          state={importState}
          value={
            brxStatus === 'initial_sync'
              ? 'Sincronizzazione…'
              : brxStatus === 'active'
                ? 'Sincronizzato'
                : isDisconnected
                  ? 'Nessun dato'
                  : 'In attesa'
          }
        />
        <StatusTile
          label="Marketplace EBARTEX"
          icon={Store}
          state={marketplaceState}
          value={
            marketplaceStatus
              ? `${SYNC_MODE_LABELS[marketplaceStatus.sync_mode]}`
              : '—'
          }
          badgeText={
            marketplaceStatus
              ? `${marketplaceStatus.synced_listings}/${marketplaceStatus.total_listings} listing`
              : undefined
          }
        />
      </div>

      {(lastSyncAt || lastError) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200/70 bg-gray-50/70 px-4 py-2.5 text-xs text-gray-600">
          {lastSyncAt && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-gray-400" aria-hidden />
              <span>
                Ultima sincronizzazione completata:{' '}
                <strong className="font-semibold text-gray-900">
                  {new Date(lastSyncAt).toLocaleString(intlLocale)}
                </strong>
              </span>
            </div>
          )}
          {lastError && (
            <div className="flex items-center gap-1.5 text-red-700">
              <AlertCircle className="h-3.5 w-3.5 text-red-600" aria-hidden />
              <span>
                {t('accountPage.syncErrorTitle')}:{' '}
                <strong className="font-semibold">{t('accountPage.syncLastErrorSafe')}</strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
