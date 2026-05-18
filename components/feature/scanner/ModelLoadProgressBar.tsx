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
 * Shown only while `modelStatus === 'loading'`; 3s turbo toast when ready.
 */
export function ModelLoadProgressBar({
  modelStatus,
  modelProgress,
}: {
  modelStatus: ModelStatus;
  modelProgress: OnnxLoadProgress;
}) {
  const [showReadyToast, setShowReadyToast] = useState(false);

  useEffect(() => {
    if (modelStatus !== 'ready') return;
    setShowReadyToast(true);
    const t = window.setTimeout(() => setShowReadyToast(false), 3000);
    return () => clearTimeout(t);
  }, [modelStatus]);

  const overlayClass =
    'pointer-events-none absolute left-0 right-0 z-[35] flex justify-center px-4';

  if (showReadyToast && modelStatus === 'ready') {
    return (
      <div
        className={overlayClass}
        style={{ top: OVERLAY_TOP }}
      >
        <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/35 bg-black/60 px-4 py-2 text-[11px] font-semibold text-emerald-200 backdrop-blur-md">
          ⚡ Modalità turbo attiva
        </span>
      </div>
    );
  }

  if (modelStatus !== 'loading') return null;

  const hasPercent = modelProgress.percent >= 0;
  const pct = hasPercent ? modelProgress.percent : 0;
  const isCaching = modelProgress.phase === 'caching';

  const title = isCaching
    ? 'Salvataggio modello offline…'
    : hasPercent
      ? `Scaricamento modello AI… ${pct}%`
      : 'Scaricamento modello AI…';

  const showBytes =
    modelProgress.loaded > 0 &&
    (modelProgress.total > 0 || !hasPercent);

  const ariaValueText = isCaching
    ? 'Salvataggio modello in cache locale'
    : hasPercent
      ? `Scaricamento modello AI, ${pct} percento`
      : 'Scaricamento modello AI in corso';

  return (
    <div
      className={overlayClass}
      style={{ top: OVERLAY_TOP }}
    >
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
          {hasPercent && !isCaching ? (
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
            ~{formatMb(modelProgress.loaded)}
            {modelProgress.total > 0 ? ` / ${formatMb(modelProgress.total)}` : ''}
          </p>
        )}
      </div>
    </div>
  );
}
