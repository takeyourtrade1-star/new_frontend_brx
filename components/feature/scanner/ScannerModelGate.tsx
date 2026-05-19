'use client';

import type { ModelStatus, OnnxLoadProgress } from '@/hooks/useBrxScanner';

function formatMb(bytes: number): string {
  if (bytes <= 0) return '0 MB';
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

/** Full-screen gate: download + init ONNX before camera opens. */
export function ScannerModelGate({
  modelStatus,
  modelProgress,
  modelError,
  onRetry,
  onUseStandard,
}: {
  modelStatus: ModelStatus;
  modelProgress: OnnxLoadProgress;
  modelError?: string | null;
  onRetry: () => void;
  onUseStandard: () => void;
}) {
  const hasPercent = modelProgress.percent >= 0;
  const pct = hasPercent ? modelProgress.percent : 0;
  const isCaching = modelProgress.phase === 'caching';
  const isInitializing = modelProgress.phase === 'initializing';
  const failed = modelStatus === 'failed';

  const title = failed
    ? 'Download non riuscito'
    : isInitializing
      ? 'Avvio motore AI…'
      : isCaching
        ? 'Salvataggio offline…'
        : hasPercent
          ? `Download modello AI ${pct}%`
          : 'Preparazione scanner…';

  const subtitle = failed
    ? 'Il modello non è accessibile dal telefono. Puoi riprovare o usare la modalità standard.'
    : 'Una sola volta: poi lo scanner sarà molto più veloce.';

  return (
    <div
      className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-[#0a0f1a] px-6"
      role="dialog"
      aria-labelledby="scanner-gate-title"
      aria-busy={!failed}
    >
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF7300]/15 ring-1 ring-[#FF7300]/30">
          <span className="text-3xl" aria-hidden>
            {failed ? '⚠️' : '⚡'}
          </span>
        </div>

        <h2 id="scanner-gate-title" className="text-lg font-semibold text-white">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/60">{subtitle}</p>

        {!failed && (
          <div
            className="mt-8"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={hasPercent ? 100 : undefined}
            aria-valuenow={hasPercent ? pct : undefined}
          >
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              {hasPercent && !isCaching && !isInitializing ? (
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF7300] to-amber-400 transition-[width] duration-300"
                  style={{ width: `${pct}%` }}
                />
              ) : (
                <div className="h-full w-1/3 animate-pulse rounded-full bg-gradient-to-r from-[#FF7300] to-amber-400" />
              )}
            </div>
            {modelProgress.loaded > 0 && (
              <p className="mt-3 text-xs tabular-nums text-white/50">
                {formatMb(modelProgress.loaded)}
                {modelProgress.total > 0 ? ` / ~${formatMb(modelProgress.total)}` : ''}
              </p>
            )}
          </div>
        )}

        {failed && modelError && (
          <p className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-left text-[11px] leading-snug text-amber-100/80">
            {modelError}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {failed && (
            <>
              <button
                type="button"
                onClick={onRetry}
                className="w-full rounded-xl bg-[#FF7300] py-3 text-sm font-semibold text-white transition hover:bg-[#e66800] active:scale-[0.98]"
              >
                Riprova download
              </button>
              <button
                type="button"
                onClick={onUseStandard}
                className="w-full rounded-xl border border-white/20 bg-white/5 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10"
              >
                Continua in modalità standard
              </button>
            </>
          )}
          {!failed && (
            <p className="text-[11px] text-white/40">Non chiudere la pagina durante il download</p>
          )}
        </div>
      </div>
    </div>
  );
}
