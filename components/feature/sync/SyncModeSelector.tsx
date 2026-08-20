'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getMarketplaceSyncStatus,
  MarketplaceApiError,
  updateMarketplaceSyncMode,
  type MarketplaceSyncStatus,
  type SyncMode,
} from '@/lib/api/marketplace-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface ModeInfo {
  value: SyncMode;
  label: string;
  shortDesc: string;
}

const SYNC_MODES: ModeInfo[] = [
  {
    value: 'demo',
    label: 'Demo',
    shortDesc: 'Aggiorna lo stato locale dai webhook, senza mai scrivere verso CardTrader.',
  },
  {
    value: 'partial',
    label: 'Parziale',
    shortDesc: 'Legge i dati reali e simula le operazioni in locale. Nessuna scrittura esterna.',
  },
  {
    value: 'real',
    label: 'Reale',
    shortDesc: 'Ogni vendita su Ebartex decrementa lo stock su CardTrader.',
  },
];

function ConfirmRealModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1D3160]/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-real-title"
    >
      <div className="w-full max-w-lg border border-white/10 bg-[#F5F4F0] p-6 sm:p-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#FF7300]">Attenzione</p>
        <h2
          id="confirm-real-title"
          className="mt-2 font-display text-2xl uppercase tracking-[0.05em] text-[#1D3160]"
        >
          Attivare la sincronizzazione reale?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#1D3160]/70">
          In modalità <strong className="font-semibold text-[#1D3160]">Reale</strong>, ogni acquisto
          confermato su Ebartex invia una richiesta a CardTrader per decrementare le quantità
          dell&apos;articolo venduto.
        </p>
        <ul className="mt-5 space-y-2 text-sm text-[#1D3160]/70">
          <li>La chiave API deve avere permessi di lettura e scrittura.</li>
          <li>{t('accountPage.syncRealListingExport')}</li>
          <li>Puoi tornare in Demo o Parziale in qualunque momento.</li>
        </ul>
        <div className="mt-8 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-10 rounded-none border-[#1D3160]/20 bg-transparent px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#1D3160] hover:bg-white"
          >
            Annulla
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="h-10 rounded-none bg-[#1D3160] px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#152345]"
          >
            Conferma Reale
          </Button>
        </div>
      </div>
      <button type="button" onClick={onCancel} className="absolute inset-0 -z-10" aria-label="Chiudi" />
    </div>
  );
}

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
        setSuccess(`Modalità aggiornata a ${label}.`);
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
  const active = SYNC_MODES.find((m) => m.value === currentMode) ?? SYNC_MODES[0];

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

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#FF7300]">Stock</p>
            <h3 className="mt-1 font-display text-xl uppercase tracking-[0.06em] text-[#1D3160]">
              Modalità
            </h3>
          </div>
          <button
            type="button"
            onClick={fetchStatus}
            disabled={loadingStatus || saving}
            aria-label="Aggiorna stato"
            className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1D3160]/50 underline-offset-4 hover:text-[#1D3160] hover:underline disabled:opacity-40"
          >
            {loadingStatus ? 'Lettura…' : 'Aggiorna'}
          </button>
        </div>

        <div
          className="mt-5 grid grid-cols-3 border border-[#1D3160]/15"
          role="radiogroup"
          aria-label="Modalità di sincronizzazione stock"
        >
          {SYNC_MODES.map((mode) => {
            const isSelected = currentMode === mode.value;
            return (
              <button
                key={mode.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelectMode(mode.value)}
                disabled={saving || loadingStatus}
                className={cn(
                  'relative h-12 text-xs font-semibold uppercase tracking-[0.14em] transition-colors disabled:opacity-50',
                  isSelected
                    ? 'bg-[#1D3160] text-white'
                    : 'bg-transparent text-[#1D3160]/55 hover:text-[#1D3160]',
                )}
              >
                {mode.label}
                {saving && pendingMode === mode.value ? '…' : ''}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-[#1D3160]/65">{active.shortDesc}</p>

        {status && !loadingStatus && (
          <p className="mt-5 font-display text-sm uppercase tracking-[0.08em] text-[#1D3160]">
            <span className="tabular-nums">{status.total_listings}</span>
            <span className="mx-2 text-[#1D3160]/25">·</span>
            listing
            <span className="mx-3 text-[#1D3160]/20">/</span>
            <span className="tabular-nums">{status.synced_listings}</span>
            <span className="mx-2 text-[#1D3160]/25">·</span>
            su CardTrader
            <span className="mx-3 text-[#1D3160]/20">/</span>
            <span className="tabular-nums">{status.pending_events}</span>
            <span className="mx-2 text-[#1D3160]/25">·</span>
            in coda
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 border-l-2 border-red-700 pl-3 text-sm text-red-800">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="mt-4 border-l-2 border-[#1D3160] pl-3 text-sm text-[#1D3160]">
            {success}
          </p>
        )}
      </section>
    </>
  );
}
