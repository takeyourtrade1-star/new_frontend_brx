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
  ArrowUpRight,
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
  subtext,
}: {
  label: string;
  value: string;
  state: CheckState;
  icon: React.ComponentType<{ className?: string }>;
  badgeText?: string;
  subtext?: string;
}) {
  const containerBorder: Record<CheckState, string> = {
    ok: 'border-emerald-200/90 bg-white hover:border-emerald-300 shadow-xs',
    warn: 'border-amber-200/90 bg-white hover:border-amber-300 shadow-xs',
    error: 'border-red-200/90 bg-white hover:border-red-300 shadow-xs',
    loading: 'border-orange-200/90 bg-white hover:border-orange-300 shadow-xs',
    idle: 'border-gray-200/90 bg-white hover:border-gray-300 shadow-xs',
  };

  const iconStyles: Record<CheckState, string> = {
    ok: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
    warn: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
    error: 'bg-red-50 text-red-600 ring-1 ring-red-100',
    loading: 'bg-orange-50 text-[#FF7300] ring-1 ring-orange-100',
    idle: 'bg-gray-50 text-gray-400 ring-1 ring-gray-100',
  };

  const badgePill: Record<CheckState, string> = {
    ok: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    warn: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    error: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    loading: 'bg-orange-50 text-[#FF7300] ring-1 ring-orange-200',
    idle: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  };

  return (
    <div
      className={cn(
        'group flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all duration-200 hover:shadow-md',
        containerBorder[state]
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105', iconStyles[state])}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider', badgePill[state])}>
          {state === 'loading' ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : state === 'ok' ? (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          ) : state === 'warn' ? (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          ) : state === 'error' ? (
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
          )}
          {badgeText || (state === 'ok' ? 'Attivo' : state === 'warn' ? 'In attesa' : state === 'error' ? 'Errore' : state === 'loading' ? 'Sync' : 'Inattivo')}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
        <p className="mt-1 text-base font-extrabold tracking-tight text-[#1D3160] sm:text-lg">{value}</p>
        {subtext && <p className="mt-0.5 text-xs text-gray-500">{subtext}</p>}
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
  active: 'Connesso & Sincronizzato',
  initial_sync: 'Importazione attiva',
  idle: 'Pronto per la sincronizzazione',
  error: 'Errore di connessione',
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatusTile
          label="CardTrader API"
          icon={Link2}
          state={cardtraderState}
          value={
            isDisconnected
              ? 'Non collegato'
              : brxStatus
                ? BRX_STATUS_LABELS[brxStatus]
                : '—'
          }
          subtext={isDisconnected ? 'Inserisci la tua chiave API' : 'Crittografia AES-256 attiva'}
        />
        <StatusTile
          label="Webhook Ricezione"
          icon={Webhook}
          state={webhookState}
          value={webhookConfigured ? 'In ascolto 24/7' : isDisconnected ? 'Non configurato' : 'In attesa salvataggio'}
          subtext={webhookConfigured ? 'Notifiche vendite in tempo reale' : 'Endpoint automatico'}
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
                  ? 'Nessun articolo'
                  : 'Pronto per import'
          }
          subtext="Catalogo sincronizzato con Ebartex"
        />
        <StatusTile
          label="Modalità Ebartex"
          icon={Store}
          state={marketplaceState}
          value={
            marketplaceStatus
              ? `Modalità ${SYNC_MODE_LABELS[marketplaceStatus.sync_mode]}`
              : '—'
          }
          subtext={
            marketplaceStatus
              ? `${marketplaceStatus.synced_listings} di ${marketplaceStatus.total_listings} listing sincronizzati`
              : 'Stato marketplace'
          }
        />
      </div>

      {(lastSyncAt || lastError) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200/80 bg-white px-4 py-3 text-xs text-gray-600 shadow-2xs">
          {lastSyncAt && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#FF7300]" aria-hidden />
              <span>
                Ultima sincronizzazione completata:{' '}
                <strong className="font-semibold text-[#1D3160]">
                  {new Date(lastSyncAt).toLocaleString(intlLocale)}
                </strong>
              </span>
            </div>
          )}
          {lastError && (
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" aria-hidden />
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
