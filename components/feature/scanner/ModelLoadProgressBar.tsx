'use client';

import { useEffect, useState } from 'react';
import type { ModelStatus, OnnxLoadProgress } from '@/hooks/useBrxScanner';

function formatMb(bytes: number): string {
  if (bytes <= 0) return '0 MB';
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

const OVERLAY_TOP =
  'max(4.25rem, calc(env(safe-area-inset-top) + 3.75rem))';

/**
 * Top overlay for ONNX download progress (non-blocking; pointer-events-none).
 * Loading: byte progress + indeterminate bar when percent === -1.
 * Ready: 3s turbo toast. Failed: brief standard-mode message.
 */
export function ModelLoadProgressBar({
  modelStatus,
  modelProgress,
  modelError,
  onRetryDownload,
}: {
  modelStatus: ModelStatus;
  modelProgress: OnnxLoadProgress;
  modelError?: string | null;
  onRetryDownload?: () => void;
}) {
  const [showReadyToast, setShowReadyToast] = useState(false);
  const [showFailedToast, setShowFailedToast] = useState(false);

  useEffect(() => {
    if (modelStatus !== 'ready') return;
    setShowReadyToast(true);
    const t = window.setTimeout(() => setShowReadyToast(false), 3000);
    return () => clearTimeout(t);
  }, [modelStatus]);

  useEffect(() => {
    if (modelStatus !== 'failed') {
      setShowFailedToast(false);
      return;
    }
    setShowFailedToast(true);
  }, [modelStatus]);

  const overlayClass =
    'pointer-events-none absolute left-0 right-0 z-[35] flex justify-center px-4';

  if (showReadyToast && modelStatus === 'ready') {
    return (
      <div className={overlayClass} style={{ top: OVERLAY_TOP }}>
        <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/35 bg-black/60 px-4 py-2 text-[11px] font-semibold text-emerald-200 backdrop-blur-md">
          ⚡ Modalità turbo attiva
        </span>
      </div>
    );
  }

  if (showFailedToast && modelStatus === 'failed') {
    const detail = modelError ?? modelProgress.reason;
    return (
      <div className={overlayClass} style={{ top: OVERLAY_TOP }}>
        <span className="inline-flex max-w-md flex-col items-center gap-2 rounded-xl border border-amber-500/30 bg-black/60 px-4 py-2.5 text-[11px] font-semibold text-amber-100/90 backdrop-blur-md">
          <span className="text-center leading-snug">
            Download modello non riuscito — modalità standard
          </span>
          {detail && (
            <span className="text-center text-[10px] font-normal text-white/55 line-clamp-2">
              {detail}
            </span>
          )}
          {onRetryDownload && (
            <button
              type="button"
              onClick={onRetryDownload}
              className="pointer-events-auto rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-white/20"
            >
              Riprova download
            </button>
          )}
        </span>
      </div>
    );
  }

  if (modelStatus !== 'loading') return null;

  const isIndeterminate = modelProgress.percent < 0;
  const hasPercent = modelProgress.percent >= 0;
  const pct = hasPercent ? modelProgress.percent : 0;
  const isCaching = modelProgress.phase === 'caching';
  const isInitializing = modelProgress.phase === 'initializing';

  const title = isInitializing
    ? 'Avvio motore AI…'
    : isCaching
    ? 'Salvataggio modello offline…'
    : isIndeterminate
      ? 'Scaricamento in corso…'
      : hasPercent
        ? `Scaricamento modello AI… ${pct}%`
        : 'Scaricamento modello AI…';

  const showBytes = modelProgress.loaded > 0;

  const ariaValueText = isCaching
    ? 'Salvataggio modello in cache locale'
    : isIndeterminate
      ? 'Scaricamento modello AI in corso'
      : hasPercent
        ? `Scaricamento modello AI, ${pct} percento`
        : 'Scaricamento modello AI in corso';

  return (
    <div className={overlayClass} style={{ top: OVERLAY_TOP }}>
      <div
        className="w-full max-w-md rounded-xl bg-black/60 px-4 py-3 backdrop-blur-md"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={hasPercent ? 100 : undefined}
        aria-valuenow={hasPercent ? pct : undefined}
        aria-valuetext={ariaValueText}
        aria-busy={!isCaching}
      >
        <style>{`
          @keyframes onnx-indeterminate {
            0%   { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
          }
        `}</style>

        <p className="text-[13px] font-medium text-white/95">{title}</p>

        <div
          className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/15"
          aria-hidden
        >
          {hasPercent && !isCaching && !isInitializing ? (
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          ) : (
            <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-[onnx-indeterminate_1.4s_ease-in-out_infinite]" />
          )}
        </div>

        {showBytes && (
          <p className="mt-1.5 text-[11px] tabular-nums text-white/60">
            {formatMb(modelProgress.loaded)}
            {modelProgress.total > 0 ? ` / ~${formatMb(modelProgress.total)}` : ''}
          </p>
        )}

        {modelProgress.reason && modelProgress.phase === 'downloading' && (
          <p className="mt-1 text-[10px] text-white/45 line-clamp-1">
            {modelProgress.reason}
          </p>
        )}
      </div>
    </div>
  );
}
