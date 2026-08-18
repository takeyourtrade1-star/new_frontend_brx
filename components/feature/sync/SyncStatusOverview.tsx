'use client';

import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import type { SyncStatus } from '@/lib/api/sync-client';
import type { MarketplaceSyncStatus, SyncMode } from '@/lib/api/marketplace-client';

type RailState = 'off' | 'idle' | 'live' | 'syncing' | 'error' | 'loading';

const MODE_LABEL: Record<SyncMode, string> = {
  demo: 'Demo',
  partial: 'Parziale',
  real: 'Reale',
};

const BRX_LABEL: Record<SyncStatus, string> = {
  active: 'Collegato',
  initial_sync: 'Import in corso',
  idle: 'Pronto',
  error: 'Errore',
};

function railState(args: {
  loading: boolean;
  isDisconnected: boolean;
  brxStatus: SyncStatus | null;
}): RailState {
  if (args.loading) return 'loading';
  if (args.isDisconnected) return 'off';
  if (args.brxStatus === 'error') return 'error';
  if (args.brxStatus === 'initial_sync') return 'syncing';
  if (args.brxStatus === 'active') return 'live';
  if (args.brxStatus === 'idle') return 'idle';
  return 'off';
}

function SyncRail({
  state,
  progress,
}: {
  state: RailState;
  progress: number;
}) {
  const fill =
    state === 'syncing'
      ? Math.min(100, Math.max(0, progress))
      : state === 'off' || state === 'loading'
        ? 0
        : 100;

  const beadLeft =
    state === 'syncing' ? `${fill}%` : state === 'off' || state === 'loading' ? '0%' : '50%';

  return (
    <div className="relative flex items-center gap-3 sm:gap-5" aria-hidden>
      <span
        className={cn(
          'h-2.5 w-2.5 shrink-0 rounded-full border',
          state === 'off' || state === 'loading'
            ? 'border-white/35 bg-transparent'
            : state === 'error'
              ? 'border-[#F5A8A2] bg-[#F5A8A2]'
              : 'border-[#FF7300] bg-[#FF7300]',
        )}
      />

      <div className="relative h-[2px] min-w-0 flex-1 overflow-hidden">
        <div
          className={cn(
            'absolute inset-0',
            state === 'off' || state === 'loading'
              ? 'bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.28)_0_6px,transparent_6px_12px)]'
              : 'bg-white/15',
          )}
        />
        <div
          className={cn(
            'absolute inset-y-0 left-0 transition-[width] duration-700 ease-out',
            state === 'error' ? 'bg-[#F5A8A2]' : 'bg-[#FF7300]',
          )}
          style={{ width: `${fill}%` }}
        />
        {state === 'live' && (
          <span className="sync-rail-current absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        )}
      </div>

      <span
        className={cn(
          'absolute left-1/2 top-1/2 hidden h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full sm:block',
          state === 'syncing' && 'sm:hidden',
        )}
      />

      {(state === 'live' || state === 'syncing' || state === 'idle' || state === 'error') && (
        <span
          className={cn(
            'pointer-events-none absolute top-1/2 z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[left] duration-700 ease-out',
            state === 'error' ? 'bg-[#F5A8A2]' : 'bg-white',
            state === 'live' && 'sync-rail-bead',
          )}
          style={{ left: `calc(${beadLeft} * 0.92 + 4%)` }}
        />
      )}

      <span
        className={cn(
          'h-2.5 w-2.5 shrink-0 rounded-full border',
          state === 'off' || state === 'loading'
            ? 'border-white/35 bg-transparent'
            : state === 'error'
              ? 'border-[#F5A8A2] bg-[#F5A8A2]'
              : state === 'syncing'
                ? 'border-white/50 bg-white/20'
                : 'border-[#FF7300] bg-[#FF7300]',
        )}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className="mt-1 truncate font-display text-base tracking-wide text-white sm:text-lg">{value}</p>
      {hint ? <p className="mt-0.5 truncate text-xs text-white/45">{hint}</p> : null}
    </div>
  );
}

export function SyncStatusOverview({
  loading,
  brxStatus,
  isDisconnected,
  webhookConfigured,
  marketplaceStatus,
  marketplaceLoading,
  lastSyncAt,
  lastError,
  progressPercent,
  progressProcessed,
  progressTotal,
  etaLabel,
}: {
  loading: boolean;
  brxStatus: SyncStatus | null;
  isDisconnected: boolean;
  webhookConfigured: boolean;
  marketplaceStatus: MarketplaceSyncStatus | null;
  marketplaceLoading: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
  progressPercent?: number | null;
  progressProcessed?: number | null;
  progressTotal?: number | null;
  etaLabel?: string | null;
}) {
  const intlLocale = useIntlLocale();
  const { t } = useTranslation();
  const state = railState({ loading, isDisconnected, brxStatus });
  const percent = progressPercent ?? 0;

  const leftCaption = isDisconnected
    ? 'Non collegato'
    : brxStatus
      ? BRX_LABEL[brxStatus]
      : '—';

  const rightCaption =
    brxStatus === 'initial_sync'
      ? 'Riceve il catalogo'
      : brxStatus === 'active'
        ? 'Sincronizzato'
        : isDisconnected
          ? 'In attesa'
          : 'Pronto';

  const centerCaption =
    state === 'syncing'
      ? `${Math.round(percent)}%`
      : state === 'live'
        ? 'In linea'
        : state === 'error'
          ? 'Interrotto'
          : state === 'loading'
            ? 'Lettura stato'
            : 'Spento';

  const listingValue = marketplaceLoading
    ? '…'
    : marketplaceStatus
      ? `${marketplaceStatus.synced_listings} / ${marketplaceStatus.total_listings}`
      : '—';

  return (
    <section className="relative overflow-hidden bg-[#1D3160] text-white">
      <style>{`
        @keyframes sync-rail-current {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(520%); }
        }
        @keyframes sync-rail-bead {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 115, 0, 0.55); }
          50% { box-shadow: 0 0 0 8px rgba(255, 115, 0, 0); }
        }
        .sync-rail-current { animation: sync-rail-current 2.8s linear infinite; }
        .sync-rail-bead { animation: sync-rail-bead 1.8s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .sync-rail-current, .sync-rail-bead { animation: none; }
        }
      `}</style>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative px-5 py-7 sm:px-8 sm:py-9">
        <div className="flex items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#FF7300]">
              CardTrader · Ebartex
            </p>
            <h1 className="mt-2 font-display text-[1.65rem] uppercase leading-none tracking-[0.06em] sm:text-4xl">
              {t('accountPage.syncTitle')}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
              {t('accountPage.syncSubtitle')}
            </p>
          </div>
        </div>

        <div className="mt-10 sm:mt-14">
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 sm:gap-4">
            <div>
              <p className="font-display text-sm uppercase tracking-[0.16em] sm:text-base">CardTrader</p>
              <p className="mt-1 text-xs text-white/50">{leftCaption}</p>
            </div>
            <p className="pb-4 text-center font-display text-xs uppercase tracking-[0.2em] text-[#FF7300] sm:text-sm">
              {centerCaption}
            </p>
            <div className="text-right">
              <p className="font-display text-sm uppercase tracking-[0.16em] sm:text-base">Ebartex</p>
              <p className="mt-1 text-xs text-white/50">{rightCaption}</p>
            </div>
          </div>

          <div className="mt-4">
            <SyncRail state={state} progress={percent} />
          </div>

          {state === 'syncing' && (
            <p className="mt-4 text-center text-xs text-white/55">
              {t('accountPage.syncProgressLine', {
                pct: Math.round(percent),
                processed: progressProcessed ?? 0,
                totalPart:
                  progressTotal != null
                    ? t('accountPage.syncTotalPart', { total: progressTotal })
                    : '',
              })}
              {etaLabel ? ` · ${etaLabel}` : ''}
            </p>
          )}
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/10 pt-6 sm:grid-cols-4">
          <Metric
            label="API"
            value={
              loading ? '…' : isDisconnected ? 'Non collegata' : brxStatus ? BRX_LABEL[brxStatus] : '—'
            }
            hint={isDisconnected ? 'Inserisci il token' : 'AES-256'}
          />
          <Metric
            label="Webhook"
            value={
              loading ? '…' : webhookConfigured ? 'In ascolto' : isDisconnected ? 'Spento' : 'Da attivare'
            }
            hint={webhookConfigured ? 'Vendite in tempo reale' : 'Endpoint personale'}
          />
          <Metric
            label="Inventario"
            value={listingValue}
            hint="Listing sincronizzati"
          />
          <Metric
            label="Modalità"
            value={
              marketplaceLoading
                ? '…'
                : marketplaceStatus
                  ? MODE_LABEL[marketplaceStatus.sync_mode]
                  : '—'
            }
            hint={
              marketplaceStatus
                ? marketplaceStatus.writes_enabled
                  ? 'Scritture attive'
                  : 'Sola lettura'
                : 'Marketplace'
            }
          />
        </dl>

        {(lastSyncAt || lastError) && (
          <div className="mt-6 flex flex-col gap-1 border-t border-white/10 pt-4 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
            {lastSyncAt ? (
              <p>
                Ultimo import{' '}
                <time className="text-white" dateTime={lastSyncAt}>
                  {new Date(lastSyncAt).toLocaleString(intlLocale)}
                </time>
              </p>
            ) : (
              <span />
            )}
            {lastError ? (
              <p className="text-[#F5A8A2]">
                {t('accountPage.syncErrorTitle')}: {t('accountPage.syncLastErrorSafe')}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
