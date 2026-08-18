'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
  Zap,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import {
  getMarketplaceSyncStatus,
  MarketplaceApiError,
  updateMarketplaceSyncMode,
  type MarketplaceSyncStatus,
  type SyncMode,
} from '@/lib/api/marketplace-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ── Mode metadata ─────────────────────────────────────────────────────────────

interface ModeInfo {
  value: SyncMode;
  label: string;
  badge: string;
  badgeClass: string;
  cardBorderActive: string;
  cardBgActive: string;
  iconBg: string;
  icon: React.ReactNode;
  shortDesc: string;
  description: string;
}

const SYNC_MODES: ModeInfo[] = [
  {
    value: 'demo',
    label: 'Modalità DEMO',
    badge: 'Lettura Webhook',
    badgeClass: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    cardBorderActive: 'border-blue-500 ring-2 ring-blue-100',
    cardBgActive: 'bg-gradient-to-b from-blue-50/40 to-white',
    iconBg: 'bg-blue-100 text-blue-600',
    icon: <WifiOff className="h-5 w-5" aria-hidden />,
    shortDesc: 'Aggiorna lo stato locale dai webhook senza mai scrivere verso CardTrader.',
    description:
      'Legge i webhook del marketplace e aggiorna lo stato locale. Non esegue mai scritture verso piattaforme esterne.',
  },
  {
    value: 'partial',
    label: 'Modalità PARZIALE',
    badge: 'Shadow Test',
    badgeClass: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
    cardBorderActive: 'border-amber-500 ring-2 ring-amber-100',
    cardBgActive: 'bg-gradient-to-b from-amber-50/40 to-white',
    iconBg: 'bg-amber-100 text-amber-600',
    icon: <Wifi className="h-5 w-5" aria-hidden />,
    shortDesc: 'Legge dati reali e simula le operazioni in locale. Nessuna scrittura esterna.',
    description:
      'Prova generale (shadow): legge i dati reali di CardTrader in sola lettura e simula le operazioni in locale. Nessuna scrittura viene mai inviata a CardTrader.',
  },
  {
    value: 'real',
    label: 'Modalità REALE',
    badge: 'Produzione Attiva',
    badgeClass: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
    cardBorderActive: 'border-emerald-500 ring-2 ring-emerald-100',
    cardBgActive: 'bg-gradient-to-b from-emerald-50/40 to-white',
    iconBg: 'bg-emerald-100 text-emerald-600',
    icon: <Zap className="h-5 w-5" aria-hidden />,
    shortDesc: 'Ogni vendita su Ebartex decrementa lo stock su CardTrader (anti-overselling).',
    description:
      'Ogni acquisto su Ebartex decrementa lo stock CardTrader degli articoli importati (protezione oversell). Le inserzioni create su Ebartex non vengono mai esportate.',
  },
];

// ── Confirm modal ─────────────────────────────────────────────────────────────

function ConfirmRealModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-real-title"
    >
      <div className="w-full max-w-lg rounded-3xl border border-orange-200 bg-white p-6 shadow-2xl sm:p-7">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 ring-4 ring-amber-50">
            <AlertTriangle className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h2 id="confirm-real-title" className="text-lg font-bold tracking-tight text-[#1D3160]">
              Attivare la Sincronizzazione REALE?
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">
              In modalità <strong>REALE</strong>, ogni acquisto confermato su Ebartex invierà una richiesta API a CardTrader per decrementare le quantità dell'articolo venduto.
            </p>
          </div>
        </div>

        <div className="mb-6 space-y-2.5 rounded-2xl border border-gray-100 bg-gray-50/80 p-4 text-xs text-gray-700">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>La tua API key ha permessi di lettura e scrittura su CardTrader</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>Le inserzioni su Ebartex rimangono separate e non vengono esportate</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>Puoi tornare in modalità DEMO o PARZIALE in qualunque momento</span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-10 rounded-xl border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Annulla
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 text-xs font-bold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700"
          >
            Conferma e Attiva REALE
          </Button>
        </div>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="absolute inset-0 -z-10"
        aria-label="Chiudi"
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SyncModeSelector() {
  const [status, setStatus] = useState<MarketplaceSyncStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingMode, setPendingMode] = useState<SyncMode | null>(null);
  const [showConfirmReal, setShowConfirmReal] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const data = await getMarketplaceSyncStatus();
      setStatus(data);
    } catch {
      setError('Impossibile caricare lo stato sincronizzazione.');
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const applyMode = useCallback(
    async (mode: SyncMode, confirmRealWrites = false) => {
      setSaving(true);
      setError(null);
      setSuccess(null);
      try {
        const updated = await updateMarketplaceSyncMode(mode, {
          expectedModeVersion: status?.mode_version,
          confirmRealWrites,
        });
        setStatus((prev) =>
          prev
            ? {
                ...prev,
                sync_mode: updated.sync_mode,
                mode_version: updated.mode_version,
                writes_enabled: updated.writes_enabled,
              }
            : prev,
        );
        const label = SYNC_MODES.find((m) => m.value === mode)?.label ?? mode;
        setSuccess(`Modalità sincronizzazione aggiornata a ${label}.`);
        setTimeout(() => setSuccess(null), 4000);
      } catch (err) {
        if (err instanceof MarketplaceApiError) {
          setError(err.detail);
        } else {
          setError('Errore durante il cambio modalità. Riprova.');
        }
      } finally {
        setSaving(false);
        setPendingMode(null);
      }
    },
    [status?.mode_version],
  );

  const handleSelectMode = (mode: SyncMode) => {
    if (mode === status?.sync_mode || saving) return;
    if (mode === 'real') {
      setPendingMode(mode);
      setShowConfirmReal(true);
    } else {
      void applyMode(mode);
    }
  };

  const currentMode = status?.sync_mode ?? 'demo';

  return (
    <>
      {showConfirmReal && (
        <ConfirmRealModal
          onConfirm={() => {
            setShowConfirmReal(false);
            if (pendingMode) void applyMode(pendingMode, true);
          }}
          onCancel={() => {
            setShowConfirmReal(false);
            setPendingMode(null);
          }}
        />
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition-all sm:p-7">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold tracking-tight text-[#1D3160]">
              Modalità di Sincronizzazione Stock
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Scegli il livello di automazione per il decremento delle quantità su CardTrader
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchStatus}
            disabled={loadingStatus || saving}
            aria-label="Aggiorna stato"
            className="h-8 border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5 text-gray-400', loadingStatus ? 'animate-spin' : '')} />
            Aggiorna
          </Button>
        </div>

        {/* Segmented Cards */}
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {SYNC_MODES.map((mode) => {
            const isSelected = currentMode === mode.value;
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => handleSelectMode(mode.value)}
                disabled={saving || loadingStatus}
                className={cn(
                  'group relative flex flex-col justify-between rounded-2xl border p-4.5 text-left transition-all duration-200',
                  isSelected
                    ? cn('shadow-xs', mode.cardBorderActive, mode.cardBgActive)
                    : 'border-gray-200/80 bg-white hover:border-gray-300 hover:shadow-xs'
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105',
                        mode.iconBg
                      )}
                    >
                      {mode.icon}
                    </div>
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', mode.badgeClass)}>
                      {mode.badge}
                    </span>
                  </div>

                  <div className="mt-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#1D3160]">{mode.label}</span>
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-label="Attivo" />
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600">{mode.shortDesc}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100/80 pt-3 text-[11px] font-bold">
                  {isSelected ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Modalità Attiva
                    </span>
                  ) : (
                    <span className="text-gray-400 group-hover:text-[#FF7300] transition-colors">
                      Clicca per selezionare
                    </span>
                  )}
                  {saving && pendingMode === mode.value && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF7300]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Stats row */}
        {status && !loadingStatus && (
          <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
            <div className="text-center">
              <div className="text-lg font-extrabold text-[#1D3160]">{status.total_listings}</div>
              <div className="text-[11px] font-medium text-gray-500">Listing Totali Ebartex</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-extrabold text-emerald-700">{status.synced_listings}</div>
              <div className="text-[11px] font-medium text-gray-500">Sincronizzati con CT</div>
            </div>
            <div className="text-center">
              <div className={cn('text-lg font-extrabold', status.pending_events > 0 ? 'text-[#FF7300]' : 'text-gray-700')}>
                {status.pending_events}
              </div>
              <div className="text-[11px] font-medium text-gray-500">Eventi in Coda</div>
            </div>
          </div>
        )}

        {/* Feedback messages */}
        {error && (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 shadow-2xs"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" aria-hidden />
            {error}
          </div>
        )}
        {success && (
          <div
            role="status"
            className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 shadow-2xs"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            {success}
          </div>
        )}
      </section>
    </>
  );
}
