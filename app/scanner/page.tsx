'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useBrxScanner } from '@/hooks/useBrxScanner';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COUNTDOWN_SECONDS = 3;

// ---------------------------------------------------------------------------
// Top loading bar (GitHub / YouTube style)
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
          active ? 'animate-loading-bar opacity-100' : 'opacity-0 scale-x-0',
        ].join(' ')}
        style={
          active
            ? {
                animation: 'loading-bar 1.4s ease-in-out infinite',
              }
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
// Corner bracket overlay (animated)
// ---------------------------------------------------------------------------

type BracketState = 'idle' | 'scanning' | 'matched';

function ScanBrackets({ bracketState }: { bracketState: BracketState }) {
  const colorClass =
    bracketState === 'matched'
      ? 'border-green-400'
      : bracketState === 'scanning'
      ? 'border-white'
      : 'border-white/60';

  const pulseClass =
    bracketState === 'scanning'
      ? 'animate-[pulse_2s_ease-in-out_infinite]'
      : bracketState === 'matched'
      ? 'animate-[pulse_0.6s_ease-in-out_3]'
      : '';

  const bracketSize = 'w-8 h-8';

  return (
    <div
      className={`relative w-52 h-72 transition-all duration-300 ${pulseClass}`}
      aria-hidden
    >
      {/* Top-left */}
      <span
        className={`absolute top-0 left-0 ${bracketSize} border-t-2 border-l-2 rounded-tl-sm ${colorClass} transition-colors duration-500`}
      />
      {/* Top-right */}
      <span
        className={`absolute top-0 right-0 ${bracketSize} border-t-2 border-r-2 rounded-tr-sm ${colorClass} transition-colors duration-500`}
      />
      {/* Bottom-left */}
      <span
        className={`absolute bottom-0 left-0 ${bracketSize} border-b-2 border-l-2 rounded-bl-sm ${colorClass} transition-colors duration-500`}
      />
      {/* Bottom-right */}
      <span
        className={`absolute bottom-0 right-0 ${bracketSize} border-b-2 border-r-2 rounded-br-sm ${colorClass} transition-colors duration-500`}
      />

      {/* Green fill overlay when matched */}
      <div
        className={`absolute inset-0 rounded transition-all duration-500 ${
          bracketState === 'matched'
            ? 'bg-green-400/20 border border-green-400/30'
            : 'bg-transparent'
        }`}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status bar at the bottom
// ---------------------------------------------------------------------------

type StatusBarState = 'idle' | 'scanning' | 'processing' | 'matched' | 'slow';

function StatusBar({ status }: { status: StatusBarState }) {
  const messages: Record<StatusBarState, string> = {
    idle: 'Inizializzazione fotocamera…',
    scanning: 'Punta la fotocamera verso una carta Magic',
    processing: 'Analisi in corso…',
    matched: 'Carta trovata!',
    slow: 'Analisi in corso… (potrebbe richiedere qualche secondo)',
  };

  const dotColor =
    status === 'matched'
      ? 'bg-green-400'
      : status === 'processing' || status === 'slow'
      ? 'bg-[#FF7300]'
      : 'bg-white/60';

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-2 bg-gradient-to-t from-black/70 to-transparent px-4 py-5 pb-8">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${dotColor} ${
          status === 'processing' || status === 'slow'
            ? 'animate-[pulse_1s_ease-in-out_infinite]'
            : ''
        }`}
        aria-hidden
      />
      <p className="text-center text-sm font-medium text-white drop-shadow-lg">
        {messages[status]}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Permission denied / no-camera page
// ---------------------------------------------------------------------------

function CameraPermissionDenied({ noCamera }: { noCamera?: boolean }) {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-900/30">
        <svg
          className="h-12 w-12 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          {noCamera ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 3l18 18M10.5 10.5A3 3 0 0113.5 13.5M9 9a4 4 0 015.657 5.657M17 17H7a2 2 0 01-2-2V9a2 2 0 012-2h1M14 4l2 2h3a2 2 0 012 2v8"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          )}
        </svg>
      </div>

      <div className="space-y-2">
        <p className="text-xl font-bold text-white">
          {noCamera ? 'Camera non disponibile' : 'Accesso fotocamera negato'}
        </p>
        <p className="text-sm leading-relaxed text-zinc-400">
          {noCamera
            ? 'Questo dispositivo non sembra avere una fotocamera. Prova ad usare un dispositivo mobile.'
            : 'Consenti l\'accesso alla fotocamera nelle impostazioni del browser, poi ricarica la pagina.'}
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => window.location.reload()}
          className="w-full rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
        >
          Ricarica pagina
        </button>
        <button
          onClick={() => router.back()}
          className="w-full rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-white/80 transition-opacity hover:opacity-90"
        >
          Torna indietro
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Match preview panel (slides up from bottom)
// ---------------------------------------------------------------------------

function MatchPreview({
  cardName,
  setName,
  imageUri,
  confidence,
  countdown,
  onSearchNow,
  onNotThisCard,
}: {
  cardName: string;
  setName: string;
  imageUri: string | null;
  confidence: number;
  countdown: number;
  onSearchNow: () => void;
  onNotThisCard: () => void;
}) {
  const pct = Math.round(confidence * 100);
  const badgeColor = pct >= 90 ? 'bg-green-500' : pct >= 80 ? 'bg-amber-500' : 'bg-zinc-500';
  const progressPct = (countdown / COUNTDOWN_SECONDS) * 100;

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-30 animate-[slide-up_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards]"
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

      {/* Backdrop blur behind panel */}
      <div className="absolute inset-0 rounded-t-3xl bg-zinc-950/90 backdrop-blur-xl" aria-hidden />

      <div className="relative flex flex-col gap-4 px-5 pb-10 pt-5">
        {/* Drag handle */}
        <div className="mx-auto h-1 w-10 rounded-full bg-white/20" aria-hidden />

        {/* Card row */}
        <div className="flex items-start gap-4">
          {imageUri && (
            <div className="w-24 shrink-0 overflow-hidden rounded-lg border border-white/10 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUri}
                alt={cardName}
                className="w-full object-cover"
                loading="eager"
              />
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1">
            <p className="text-xl font-bold leading-tight text-white">{cardName}</p>
            <p className="text-sm text-zinc-400">{setName}</p>
            <span
              className={`self-start rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${badgeColor}`}
            >
              {pct}% Match
            </span>
          </div>
        </div>

        {/* Countdown progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full bg-green-400 animate-[pulse_1s_ease-in-out_infinite]"
                aria-hidden
              />
              Reindirizzo alla ricerca…
            </span>
            <span className="tabular-nums font-medium text-white">{countdown}s</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-green-400 transition-all duration-1000 ease-linear"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onSearchNow}
            className="flex-1 rounded-full bg-green-500 px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-95"
          >
            Cerca ora
          </button>
          <button
            onClick={onNotThisCard}
            className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-300 transition-opacity hover:opacity-90 active:scale-95"
          >
            Non è questa carta
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Requesting camera loader
// ---------------------------------------------------------------------------

function RequestingCameraLoader() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950">
      <div className="h-10 w-10 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
      <p className="text-sm text-zinc-400">Apertura fotocamera…</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main scanner page
// ---------------------------------------------------------------------------

export default function ScannerPage() {
  const router = useRouter();
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSlowRef = useRef(false);

  const {
    state,
    result,
    countdown,
    videoRef,
    canvasRef,
    openCamera,
    stopScanning,
    restartScanning,
  } = useBrxScanner({
    confidenceThreshold: 0.85,
    captureIntervalMs: 1000,
    countdownSeconds: COUNTDOWN_SECONDS,
    apiBaseUrl: '/brx-match',
    onMatch: (r) => {
      // Clear slow timer when matched
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
        slowTimerRef.current = null;
      }
      isSlowRef.current = false;

      // Auto-redirect when countdown hits 0
      const wait = COUNTDOWN_SECONDS * 1000;
      setTimeout(() => {
        router.push(r.search_url);
      }, wait);
    },
  });

  // Open camera on mount
  useEffect(() => {
    openCamera();
    return () => {
      stopScanning();
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track slow processing (> 2s)
  useEffect(() => {
    if (state === 'processing') {
      slowTimerRef.current = setTimeout(() => {
        isSlowRef.current = true;
      }, 2000);
    } else {
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
        slowTimerRef.current = null;
      }
      isSlowRef.current = false;
    }
  }, [state]);

  const handleClose = useCallback(() => {
    stopScanning();
    router.back();
  }, [stopScanning, router]);

  const handleSearchNow = useCallback(() => {
    if (result) {
      stopScanning();
      router.push(result.search_url);
    }
  }, [result, stopScanning, router]);

  const handleNotThisCard = useCallback(() => {
    restartScanning();
  }, [restartScanning]);

  // Derive status bar state
  const statusBarState: StatusBarState =
    state === 'matched'
      ? 'matched'
      : state === 'processing'
      ? isSlowRef.current
        ? 'slow'
        : 'processing'
      : state === 'scanning'
      ? 'scanning'
      : 'idle';

  const bracketState: BracketState =
    state === 'matched' ? 'matched' : state === 'scanning' || state === 'processing' ? 'scanning' : 'idle';

  const noCamera =
    state === 'error' &&
    typeof navigator !== 'undefined' &&
    !navigator.mediaDevices;

  return (
    <div
      className="relative w-full overflow-hidden bg-black"
      style={{ height: '100svh' }}
    >
      {/* ── Top loading bar ─────────────────────────────────────────── */}
      <TopLoadingBar active={state === 'processing'} />

      {/* ── Close button ─────────────────────────────────────────────── */}
      <button
        onClick={handleClose}
        aria-label="Chiudi scanner"
        className="absolute right-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* ── Video feed ──────────────────────────────────────────────── */}
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

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" aria-hidden />

      {/* ── Requesting camera ───────────────────────────────────────── */}
      {state === 'requesting_camera' && <RequestingCameraLoader />}

      {/* ── Camera error ────────────────────────────────────────────── */}
      {state === 'error' && <CameraPermissionDenied noCamera={noCamera} />}

      {/* ── Scan overlay (brackets + vignette) ─────────────────────── */}
      {(state === 'scanning' || state === 'processing' || state === 'matched') && (
        <>
          {/* Radial vignette */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at center, transparent 35%, rgba(0,0,0,0.72) 100%)',
            }}
            aria-hidden
          />

          {/* Center scan area */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
            <ScanBrackets bracketState={bracketState} />

            {/* Hint below brackets — only show when not matched */}
            {state !== 'matched' && (
              <p className="mt-5 text-center text-[13px] font-medium text-white/75 drop-shadow-lg px-8">
                {state === 'processing'
                  ? 'Analisi in corso…'
                  : 'Inquadra una carta Magic nell\'area'}
              </p>
            )}
          </div>

          {/* Status bar */}
          {state !== 'matched' && <StatusBar status={statusBarState} />}
        </>
      )}

      {/* ── Match preview panel ─────────────────────────────────────── */}
      {state === 'matched' && result && (
        <MatchPreview
          cardName={result.card_name}
          setName={result.set_name}
          imageUri={result.image_uri}
          confidence={result.confidence}
          countdown={countdown}
          onSearchNow={handleSearchNow}
          onNotThisCard={handleNotThisCard}
        />
      )}
    </div>
  );
}
