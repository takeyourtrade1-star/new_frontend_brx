'use client';

import { useEffect, useCallback, useState, type RefObject } from 'react';
import { Camera, X, Lightbulb } from 'lucide-react';
import { useBrxScanner } from '@/hooks/useBrxScanner';
import { ScannerModelGate } from '@/components/feature/scanner/ScannerModelGate';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ScannerModalProps {
  onConfirm: (query: string) => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Glass UI tokens (mirrors scanner page)
// ---------------------------------------------------------------------------

const glassHeader =
  'border-b border-white/[0.12] bg-[#0a0f1a]/55 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_4px_24px_rgba(0,0,0,0.35)]';
const glassIconBtn =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/18 bg-white/[0.1] text-[#FF7300] backdrop-blur-md transition hover:border-[#FF7300]/40 hover:bg-white/[0.16] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7300]/50';

// ---------------------------------------------------------------------------
// Card sizing constants
// ---------------------------------------------------------------------------

const CARD_W = 'min(78vw, 290px)';
const CARD_H = 'calc(min(78vw, 290px) * 7 / 5)';

// ---------------------------------------------------------------------------
// Top loading bar
// ---------------------------------------------------------------------------

function TopLoadingBar({ active }: { active: boolean }) {
  return (
    <div
      className="pointer-events-none absolute left-0 right-0 top-0 z-40 h-[3px] overflow-hidden"
      aria-hidden
    >
      <div
        className={[
          'h-full w-full origin-left bg-[#FF7300] transition-all duration-500',
          active ? 'opacity-100' : 'opacity-0 scale-x-0',
        ].join(' ')}
        style={
          active
            ? { animation: 'loading-bar 1.4s ease-in-out infinite' }
            : undefined
        }
      />
      <style>{`
        @keyframes loading-bar {
          0%   { transform: scaleX(0); transform-origin: left; }
          50%  { transform: scaleX(0.7); transform-origin: left; }
          100% { transform: scaleX(1); transform-origin: left; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scan corners
// ---------------------------------------------------------------------------

type BracketState = 'idle' | 'scanning' | 'matched';

function ScanCorners({ bracketState }: { bracketState: BracketState }) {
  const color =
    bracketState === 'matched'
      ? 'border-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.55)]'
      : bracketState === 'scanning'
      ? 'border-[#FF7300] shadow-[0_0_14px_rgba(255,115,0,0.45)]'
      : 'border-white/70';

  const pulse =
    bracketState === 'scanning'
      ? 'animate-[scanner-corner-pulse_2.2s_ease-in-out_infinite]'
      : bracketState === 'matched'
      ? 'animate-[scanner-match-pop_0.5s_ease-out]'
      : '';

  const cornerLen = 'clamp(22px, 6vw, 32px)';
  const cornerThickness = '3px';
  const radius = '12px';

  const baseCorner = cn(
    'pointer-events-none absolute transition-all duration-300',
    color,
    pulse,
  );

  return (
    <div
      className="pointer-events-none relative"
      style={{ width: CARD_W, height: CARD_H }}
      aria-hidden
    >
      <style>{`
        @keyframes scanner-corner-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        @keyframes scanner-match-pop {
          0% { transform: scale(1); }
          40% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Top-left */}
      <span
        className={baseCorner}
        style={{
          top: 0, left: 0,
          width: cornerLen, height: cornerLen,
          borderTop: `${cornerThickness} solid currentColor`,
          borderLeft: `${cornerThickness} solid currentColor`,
          borderTopLeftRadius: radius,
        }}
      />
      {/* Top-right */}
      <span
        className={baseCorner}
        style={{
          top: 0, right: 0,
          width: cornerLen, height: cornerLen,
          borderTop: `${cornerThickness} solid currentColor`,
          borderRight: `${cornerThickness} solid currentColor`,
          borderTopRightRadius: radius,
        }}
      />
      {/* Bottom-left */}
      <span
        className={baseCorner}
        style={{
          bottom: 0, left: 0,
          width: cornerLen, height: cornerLen,
          borderBottom: `${cornerThickness} solid currentColor`,
          borderLeft: `${cornerThickness} solid currentColor`,
          borderBottomLeftRadius: radius,
        }}
      />
      {/* Bottom-right */}
      <span
        className={baseCorner}
        style={{
          bottom: 0, right: 0,
          width: cornerLen, height: cornerLen,
          borderBottom: `${cornerThickness} solid currentColor`,
          borderRight: `${cornerThickness} solid currentColor`,
          borderBottomRightRadius: radius,
        }}
      />

      {bracketState === 'scanning' && (
        <span
          className="pointer-events-none absolute inset-x-3 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#FF7300] to-transparent shadow-[0_0_12px_rgba(255,115,0,0.6)]"
          style={{ animation: 'scanner-line 2.6s ease-in-out infinite' }}
        />
      )}
      <style>{`
        @keyframes scanner-line {
          0%   { top: 8%;  opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { top: 92%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Blur mask
// ---------------------------------------------------------------------------

function ScanAreaBlurMask() {
  const cell = 'backdrop-blur-[6px] bg-[#050810]/40';
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 grid"
      style={{
        gridTemplateColumns: `1fr ${CARD_W} 1fr`,
        gridTemplateRows: `1fr ${CARD_H} 1fr`,
      }}
      aria-hidden
    >
      <div className={cell} />
      <div className={cell} />
      <div className={cell} />
      <div className={cell} />
      <div />
      <div className={cell} />
      <div className={cell} />
      <div className={cell} />
      <div className={cell} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status bar
// ---------------------------------------------------------------------------

type StatusBarState = 'idle' | 'scanning' | 'processing' | 'matched' | 'slow';

function StatusBar({ status }: { status: StatusBarState }) {
  const messages: Record<StatusBarState, string> = {
    idle: 'Inizializzazione fotocamera…',
    scanning: 'Punta la fotocamera verso una carta Magic',
    processing: 'Analisi in corso…',
    matched: 'Carta trovata!',
    slow: 'Analisi in corso… (qualche secondo in più)',
  };

  const dotColor =
    status === 'matched'
      ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]'
      : status === 'processing' || status === 'slow'
      ? 'bg-[#FF7300] shadow-[0_0_10px_rgba(255,115,0,0.55)]'
      : 'bg-white/70';

  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-10">
      <div className="flex max-w-lg items-center gap-3 rounded-2xl border border-white/20 bg-[#0a0f1a]/50 px-5 py-3.5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <span
          className={cn(
            'h-2 w-2 shrink-0 rounded-full',
            dotColor,
            status === 'processing' || status === 'slow'
              ? 'animate-[pulse_1s_ease-in-out_infinite]'
              : '',
          )}
          aria-hidden
        />
        <p className="text-center text-[13px] font-medium leading-snug tracking-wide text-white/95">
          {messages[status]}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Requesting camera loader
// ---------------------------------------------------------------------------

function RequestingCameraLoader() {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-[#050810]/80 backdrop-blur-md">
      <div className="rounded-3xl border border-white/12 bg-white/[0.06] px-10 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl ring-1 ring-white/10">
        <div className="mx-auto h-11 w-11 rounded-full border-2 border-white/20 border-t-[#FF7300] animate-spin" />
        <p className="mt-5 text-center font-display text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
          Apertura fotocamera…
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Torch toolbar
// ---------------------------------------------------------------------------

function TorchToolbar({
  torchOn,
  torchSupported,
  onToggle,
}: {
  torchOn: boolean;
  torchSupported: boolean;
  onToggle: () => void;
}) {
  if (!torchSupported) return null;
  return (
    <div className="absolute bottom-[max(5rem,calc(env(safe-area-inset-bottom)+4rem))] left-1/2 z-30 -translate-x-1/2">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          glassIconBtn,
          torchOn && 'border-[#FF7300]/50 bg-[#FF7300]/20 text-white shadow-[0_0_16px_rgba(255,115,0,0.35)]',
        )}
        aria-label={torchOn ? 'Spegni torcia' : 'Accendi torcia'}
        aria-pressed={torchOn}
      >
        <Lightbulb className="h-5 w-5" strokeWidth={2.2} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Match preview panel (no countdown, no auto-redirect)
// ---------------------------------------------------------------------------

function MatchPreview({
  cardName,
  setName,
  imageUri,
  confidence,
  onUseCard,
  onNotThisCard,
}: {
  cardName: string;
  setName: string;
  imageUri: string | null;
  confidence: number;
  onUseCard: () => void;
  onNotThisCard: () => void;
}) {
  const pct = Math.round(confidence * 100);
  const badgeColor = pct >= 90 ? 'bg-green-500' : pct >= 80 ? 'bg-amber-500' : 'bg-zinc-500';

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-30 overflow-hidden rounded-t-[2rem]"
      style={{ animation: 'slide-up 0.4s cubic-bezier(0.16,1,0.3,1) forwards' }}
      role="dialog"
      aria-label="Carta trovata"
      aria-live="polite"
    >
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
      `}</style>

      <div
        className="absolute inset-0 rounded-t-[2rem] border border-white/10 bg-gradient-to-b from-[#0d1528]/95 via-[#0a0f1a]/92 to-[#050810]/98 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_-12px_48px_rgba(0,0,0,0.55)]"
        aria-hidden
      />

      <div className="relative flex flex-col gap-5 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6">
        <div className="mx-auto h-1 w-12 rounded-full bg-white/25" aria-hidden />

        <div className="flex items-start gap-4">
          {imageUri && (
            <div className="w-[5.5rem] shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] shadow-lg ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUri}
                alt={cardName}
                className="aspect-[5/7] w-full object-cover"
                loading="eager"
              />
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
            <p className="font-display text-lg font-bold leading-tight tracking-wide text-white">{cardName}</p>
            <p className="text-sm text-white/50">{setName}</p>
            <span
              className={cn(
                'self-start rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white',
                badgeColor,
              )}
            >
              {pct}% match
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onUseCard}
            className="flex-1 rounded-2xl bg-[#FF7300] px-4 py-3.5 text-sm font-bold uppercase tracking-wide text-[#1a0f08] shadow-[0_6px_20px_rgba(255,115,0,0.35)] transition hover:brightness-110 active:scale-[0.98]"
          >
            Usa questa carta
          </button>
          <button
            type="button"
            onClick={onNotThisCard}
            className="flex-1 rounded-2xl border border-white/18 bg-white/[0.08] px-4 py-3.5 text-sm font-semibold text-white/85 backdrop-blur-md transition hover:bg-white/[0.12] active:scale-[0.98]"
          >
            Non è questa carta
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error panel
// ---------------------------------------------------------------------------

function ErrorPanel({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-8 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/10">
          <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <div className="mt-6 space-y-2">
          <p className="font-display text-xl font-bold tracking-wide text-white">Accesso fotocamera negato</p>
          <p className="text-sm leading-relaxed text-white/55">{message}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/[0.08] px-6 py-3.5 text-sm font-semibold text-white/90 backdrop-blur-xl transition hover:bg-white/[0.12]"
      >
        Chiudi
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Torch toggle helper (reused from scanner page logic)
// ---------------------------------------------------------------------------

async function applyTorch(videoRef: RefObject<HTMLVideoElement | null>, on: boolean): Promise<boolean> {
  const video = videoRef.current;
  const stream = video?.srcObject;
  if (!(stream instanceof MediaStream)) return false;
  const track = stream.getVideoTracks()[0];
  if (!track?.getCapabilities) return false;
  const caps = track.getCapabilities() as { torch?: boolean };
  if (!caps.torch) return false;
  try {
    await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// ScannerModal
// ---------------------------------------------------------------------------

export function ScannerModal({ onConfirm, onClose }: ScannerModalProps) {
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  const {
    state,
    result,
    errorMessage,
    modelStatus,
    modelProgress,
    modelError,
    videoRef,
    canvasRef,
    stopScanning,
    restartScanning,
    retryModelDownload,
    continueWithStandardMode,
    turboSkipped,
  } = useBrxScanner({
    autoOpenCamera: true,
    apiBaseUrl: '/brx-match',
    scanMode: 'auto',
  });

  const showModelGate =
    state === 'idle' &&
    (modelStatus === 'loading' || (modelStatus === 'failed' && !turboSkipped));

  const handleUseStandard = useCallback(() => {
    continueWithStandardMode();
  }, [continueWithStandardMode]);

  useEffect(() => {
    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const v = videoRef.current;
      const s = v?.srcObject;
      if (!(s instanceof MediaStream)) {
        setTorchSupported(false);
        return;
      }
      const tr = s.getVideoTracks()[0];
      const c = tr?.getCapabilities?.() as { torch?: boolean } | undefined;
      setTorchSupported(Boolean(c?.torch));
    }, 700);
    return () => clearInterval(id);
  }, [state, videoRef]);

  const toggleTorch = useCallback(async () => {
    const next = !torchOn;
    const ok = await applyTorch(videoRef, next);
    if (ok) setTorchOn(next);
    else setTorchSupported(false);
  }, [torchOn, videoRef]);

  const handleUseCard = useCallback(() => {
    if (!result) return;
    stopScanning();
    onConfirm(result.search_query);
    onClose();
  }, [result, stopScanning, onConfirm, onClose]);

  const handleNotThisCard = useCallback(() => {
    restartScanning();
  }, [restartScanning]);

  const handleCloseBtn = useCallback(() => {
    stopScanning();
    onClose();
  }, [stopScanning, onClose]);

  const bracketState: BracketState =
    state === 'matched' ? 'matched'
    : state === 'scanning' || state === 'processing' ? 'scanning'
    : 'idle';

  const statusBarState: StatusBarState =
    state === 'matched' ? 'matched'
    : state === 'processing' ? 'processing'
    : state === 'scanning' ? 'scanning'
    : 'idle';

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-black" aria-modal aria-label="Scanner Magic">
      <TopLoadingBar active={state === 'processing'} />

      {showModelGate && (
        <ScannerModelGate
          modelStatus={modelStatus}
          modelProgress={modelProgress}
          modelError={modelError}
          onRetry={retryModelDownload}
          onUseStandard={handleUseStandard}
        />
      )}

      {/* Header */}
      <header
        className={cn(
          'absolute left-0 right-0 top-0 z-40 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2.5 sm:px-4',
          glassHeader,
        )}
      >
        <div className="flex items-center gap-2 justify-self-start">
          <Camera className="h-6 w-6 text-[#FF7300]" strokeWidth={2} aria-hidden />
        </div>

        <div className="flex flex-col items-center justify-center px-1">
          <span className="font-display text-[1.05rem] font-bold uppercase tracking-[0.22em] text-white drop-shadow-sm sm:text-xl">
            Scan
          </span>
          <span className="mt-0.5 hidden text-[9px] font-semibold uppercase tracking-[0.28em] text-[#FF7300]/90 sm:block">
            Magic
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 justify-self-end">
          <button
            type="button"
            onClick={handleCloseBtn}
            className={glassIconBtn}
            aria-label="Chiudi scanner"
          >
            <X className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>
      </header>

      {/* Video feed */}
      {state !== 'error' && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />
      )}

      <canvas ref={canvasRef} className="hidden" aria-hidden />

      {state === 'requesting_camera' && <RequestingCameraLoader />}

      {state === 'error' && (
        <ErrorPanel message={errorMessage ?? 'Impossibile accedere alla fotocamera.'} onClose={handleCloseBtn} />
      )}

      {(state === 'scanning' || state === 'processing' || state === 'matched') && (
        <>
          <ScanAreaBlurMask />

          <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center">
            <ScanCorners bracketState={bracketState} />

            {state !== 'matched' && (
              <p className="mt-5 max-w-[min(92vw,22rem)] text-center text-[12px] font-medium leading-relaxed text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] sm:text-[13px]">
                {state === 'processing'
                  ? 'Analisi in corso… tieni ferma la carta.'
                  : 'Inquadra la carta Magic nel riquadro'}
              </p>
            )}
          </div>

          {state !== 'matched' && <StatusBar status={statusBarState} />}
        </>
      )}

      <TorchToolbar torchOn={torchOn} torchSupported={torchSupported} onToggle={toggleTorch} />

      {state === 'matched' && result && (
        <MatchPreview
          cardName={result.card_name}
          setName={result.set_name}
          imageUri={result.image_uri}
          confidence={result.confidence}
          onUseCard={handleUseCard}
          onNotThisCard={handleNotThisCard}
        />
      )}
    </div>
  );
}
