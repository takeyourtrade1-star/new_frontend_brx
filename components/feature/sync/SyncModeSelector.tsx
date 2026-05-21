'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, Loader2, RefreshCw, Wifi, WifiOff, Zap } from 'lucide-react';
import {
  getMarketplaceSyncStatus,
  updateMarketplaceSyncMode,
  type MarketplaceSyncStatus,
  type SyncMode,
} from '@/lib/api/marketplace-client';

// ── Mode metadata ─────────────────────────────────────────────────────────────

const SYNC_MODES: {
  value: SyncMode;
  label: string;
  badgeClass: string;
  icon: React.ReactNode;
  description: string;
  warning?: string;
}[] = [
  {
    value: 'demo',
    label: 'DEMO',
    badgeClass: 'bg-blue-100 text-blue-700 ring-blue-200',
    icon: <WifiOff className="h-4 w-4" aria-hidden />,
    description:
      'Legge i webhook del marketplace e aggiorna lo stato locale. Non esegue mai scritture verso piattaforme esterne.',
  },
  {
    value: 'partial',
    label: 'PARZIALE',
    badgeClass: 'bg-orange-100 text-orange-700 ring-orange-200',
    icon: <Wifi className="h-4 w-4" aria-hidden />,
    description:
      'Sincronizza i tuoi listing verso il marketplace collegato. Gli acquisti sulla piattaforma sono mock: le quantità esterne non vengono decrementate.',
  },
  {
    value: 'real',
    label: 'REALE',
    badgeClass: 'bg-green-100 text-green-700 ring-green-200',
    icon: <Zap className="h-4 w-4" aria-hidden />,
    description:
      'Sincronizzazione bidirezionale completa. Ogni acquisto rimuove la carta dal marketplace collegato tramite saga transazionale.',
    warning:
      'Passare a modalità REALE attiva operazioni dirette sul marketplace collegato. Assicurati che la tua chiave API abbia i permessi di scrittura.',
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-real-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-orange-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-orange-500" aria-hidden />
          <div>
            <h2 id="confirm-real-title" className="text-base font-semibold text-gray-900">
              Attiva sincronizzazione REALE?
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              In questa modalità ogni acquisto effettuato sulla piattaforma decrementa la
              quantità direttamente sul marketplace collegato tramite la tua API key. Assicurati che:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                La tua API key ha permessi di scrittura sul marketplace
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                I tuoi listing sono già sincronizzati sul marketplace collegato
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                Hai testato il flusso in modalità DEMO o PARZIALE
              </li>
            </ul>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700"
          >
            Attiva modalità REALE
          </button>
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
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const data = await getMarketplaceSyncStatus();
      setStatus(data);
    } catch (err) {
      setError('Impossibile caricare lo stato sync.');
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const applyMode = useCallback(
    async (mode: SyncMode) => {
      setSaving(true);
      setError(null);
      setSuccess(null);
      try {
        await updateMarketplaceSyncMode(mode);
        setStatus((prev) => (prev ? { ...prev, sync_mode: mode } : prev));
        const label = SYNC_MODES.find((m) => m.value === mode)?.label ?? mode;
        setSuccess(`Modalità aggiornata a ${label}.`);
        setTimeout(() => setSuccess(null), 4000);
      } catch (err) {
        setError('Errore durante il cambio modalità. Riprova.');
      } finally {
        setSaving(false);
        setPendingMode(null);
      }
    },
    [],
  );

  const handleSelectMode = (mode: SyncMode) => {
    setDropdownOpen(false);
    if (mode === status?.sync_mode) return;
    if (mode === 'real') {
      setPendingMode(mode);
      setShowConfirmReal(true);
    } else {
      void applyMode(mode);
    }
  };

  const currentModeInfo = SYNC_MODES.find((m) => m.value === status?.sync_mode) ?? SYNC_MODES[0];

  return (
    <>
      {showConfirmReal && (
        <ConfirmRealModal
          onConfirm={() => {
            setShowConfirmReal(false);
            if (pendingMode) void applyMode(pendingMode);
          }}
          onCancel={() => {
            setShowConfirmReal(false);
            setPendingMode(null);
          }}
        />
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Modalità Sincronizzazione</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Controlla come la piattaforma interagisce con i marketplace collegati
            </p>
          </div>
          <button
            type="button"
            onClick={fetchStatus}
            disabled={loadingStatus}
            aria-label="Aggiorna stato"
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 ${loadingStatus ? 'animate-spin' : ''}`} aria-hidden />
          </button>
        </div>

        {/* Current mode badge + dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            disabled={saving || loadingStatus}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition hover:bg-gray-100 disabled:opacity-60"
          >
            <span className="flex items-center gap-2.5">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-hidden />
              ) : (
                currentModeInfo.icon
              )}
              <span className="text-sm font-medium text-gray-800">
                {loadingStatus ? 'Caricamento...' : currentModeInfo.label}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${currentModeInfo.badgeClass}`}
              >
                {loadingStatus ? '…' : currentModeInfo.value.toUpperCase()}
              </span>
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>

          {dropdownOpen && (
            <ul
              role="listbox"
              aria-label="Seleziona modalità"
              className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
            >
              {SYNC_MODES.map((mode) => (
                <li key={mode.value} role="option" aria-selected={status?.sync_mode === mode.value}>
                  <button
                    type="button"
                    onClick={() => handleSelectMode(mode.value)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${
                      status?.sync_mode === mode.value ? 'bg-gray-50' : ''
                    }`}
                  >
                    <span className={`mt-0.5 ${status?.sync_mode === mode.value ? 'text-primary' : 'text-gray-400'}`}>
                      {mode.icon}
                    </span>
                    <span className="flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{mode.label}</span>
                        <span
                          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${mode.badgeClass}`}
                        >
                          {mode.value.toUpperCase()}
                        </span>
                        {status?.sync_mode === mode.value && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-label="Modalità attiva" />
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">{mode.description}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Description of current mode */}
        {!loadingStatus && status && (
          <p className="mt-3 text-xs text-gray-500">{currentModeInfo.description}</p>
        )}

        {/* Stats row */}
        {status && !loadingStatus && (
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-3">
            <div className="text-center">
              <div className="text-base font-semibold text-gray-900">{status.total_listings}</div>
              <div className="text-xs text-gray-500">Listing totali</div>
            </div>
            <div className="text-center">
              <div className="text-base font-semibold text-gray-900">{status.synced_listings}</div>
              <div className="text-xs text-gray-500">Sincronizzati</div>
            </div>
            <div className="text-center">
              <div className={`text-base font-semibold ${status.pending_events > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                {status.pending_events}
              </div>
              <div className="text-xs text-gray-500">In attesa</div>
            </div>
          </div>
        )}

        {/* Feedback messages */}
        {error && (
          <div
            role="alert"
            className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {error}
          </div>
        )}
        {success && (
          <div
            role="status"
            className="mt-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700"
          >
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {success}
          </div>
        )}
      </div>
    </>
  );
}
