'use client';

import { useEffect, useRef, useCallback, useState, type RefObject } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Search, Lightbulb, X } from 'lucide-react';
import { useBrxScanner } from '@/hooks/useBrxScanner';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COUNTDOWN_SECONDS = 3;

// ---------------------------------------------------------------------------
// Glass UI tokens (Ebartex + Apple-style)
// ---------------------------------------------------------------------------

const glassHeader =
  'border-b border-white/[0.12] bg-[#0a0f1a]/55 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_4px_24px_rgba(0,0,0,0.35)]';
const glassIconBtn =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/18 bg-white/[0.1] text-[#FF7300] backdrop-blur-md transition hover:border-[#FF7300]/40 hover:bg-white/[0.16] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7300]/50';

// ---------------------------------------------------------------------------
// Top loading bar (accent Ebartex)
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

/** Cornice carta MTG con effetto glass (ispirazione scanner premium). */
function GlassCardFrame({ bracketState }: { bracketState: BracketState }) {
  const ringGlow =
    bracketState === 'matched'
      ? 'shadow-[0_0_0_1px_rgba(74,222,128,0.5),0_0_48px_rgba(74,222,128,0.25)]'
      : bracketState === 'scanning'
      ? 'shadow-[0_0_0_1px_rgba(255,115,0,0.35),0_0_40px_rgba(255,115,0,0.12)]'
      : 'shadow-[0_0_0_1px_rgba(255,255,255,0.12)]';

  const pulse =
    bracketState === 'scanning'
      ? 'animate-[scanner-glass-pulse_2.8s_ease-in-out_infinite]'
      : bracketState === 'matched'
      ? 'animate-[scanner-match-pop_0.6s_ease-out]'
      : '';

  return (
    <div
      className={cn(
        'relative w-[min(88vw,300px)] overflow-hidden rounded-[1.75rem] border border-white/25 bg-gradient-to-b from-white/[0.18] to-white/[0.06] p-3 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-2xl ring-1 ring-white/10 transition-all duration-500',
        ringGlow,
        pulse
      )}
      aria-hidden
    >
      <style>{`
        @keyframes scanner-glass-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.92; transform: scale(1.01); }
        }
        @keyframes scanner-match-pop {
          0% { transform: scale(1); }
          40% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Silhouette carta Magic */}
      <div className="relative flex aspect-[5/7] w-full flex-col overflow-hidden rounded-2xl border border-white/35 bg-black/10">
        {/* Nome */}
        <div className="h-[11%] shrink-0 rounded-t-2xl border-b border-white/30 bg-white/[0.07]" />
        {/* Arte */}
        <div className="min-h-0 flex-[1.15] border-b border-white/25 bg-white/[0.04]" />
        {/* Type line */}
        <div className="h-[7%] shrink-0 border-b border-white/20 bg-white/[0.05]" />
        {/* Testo / P/T */}
        <div className="min-h-0 flex-1 rounded-b-2xl bg-white/[0.03]" />
        {/* Match wash */}
        <div
          className={cn(
            'pointer-events-none absolute inset-0 rounded-2xl transition-all duration-500',
            bracketState === 'matched' ? 'bg-emerald-400/15' : 'bg-transparent'
          )}
        />
      </div>
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
      <div
        className={cn(
          'flex max-w-lg items-center gap-3 rounded-2xl border border-white/20 bg-[#0a0f1a]/50 px-5 py-3.5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
        )}
      >
        <span
          className={cn(
            'h-2 w-2 shrink-0 rounded-full',
            dotColor,
            status === 'processing' || status === 'slow'
              ? 'animate-[pulse_1s_ease-in-out_infinite]'
              : ''
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
// Glass header (home, torcia, titolo, ricerca, chiudi)
// ---------------------------------------------------------------------------

function ScannerToolbar({
  videoRef,
  torchOn,
  torchSupported,
  onToggleTorch,
  onGoHome,
  onClose,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  torchOn: boolean;
  torchSupported: boolean;
  onToggleTorch: () => void;
  onGoHome: () => void;
  onClose: () => void;
}) {
  return (
    <header
      className={cn(
        'absolute left-0 right-0 top-0 z-40 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2.5 sm:px-4',
        glassHeader
      )}
    >
      <div className="flex items-center gap-2 justify-self-start">
        <button type="button" onClick={onGoHome} className={glassIconBtn} aria-label="Torna alla home">
          <Home className="h-5 w-5" strokeWidth={2.2} />
        </button>
        {torchSupported ? (
          <button
            type="button"
            onClick={onToggleTorch}
            className={cn(
              glassIconBtn,
              torchOn && 'border-[#FF7300]/50 bg-[#FF7300]/20 text-white shadow-[0_0_16px_rgba(255,115,0,0.35)]'
            )}
            aria-label={torchOn ? 'Spegni torcia' : 'Accendi torcia'}
            aria-pressed={torchOn}
          >
            <Lightbulb className="h-5 w-5" strokeWidth={2.2} />
          </button>
        ) : (
          <span className="hidden sm:block w-11" aria-hidden />
        )}
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
        <Link href="/search" className={glassIconBtn} aria-label="Apri ricerca marketplace">
          <Search className="h-5 w-5" strokeWidth={2.2} />
        </Link>
        <button type="button" onClick={onClose} className={glassIconBtn} aria-label="Chiudi scanner">
          <X className="h-5 w-5" strokeWidth={2.2} />
        </button>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Permission denied / no-camera page
// ---------------------------------------------------------------------------

function CameraPermissionDenied({ noCamera }: { noCamera?: boolean }) {

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-8 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/10">
          <svg
            className="h-10 w-10 text-red-400"
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

        <div className="mt-6 space-y-2">
          <p className="font-display text-xl font-bold tracking-wide text-white">
            {noCamera ? 'Camera non disponibile' : 'Accesso fotocamera negato'}
          </p>
          <p className="text-sm leading-relaxed text-white/55">
            {noCamera
              ? 'Questo dispositivo non sembra avere una fotocamera. Usa uno smartphone.'
              : "Consenti l'accesso alla fotocamera nelle impostazioni del browser, poi ricarica."}
          </p>
        </div>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full rounded-2xl bg-[#FF7300] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-[#1a0f08] shadow-[0_8px_24px_rgba(255,115,0,0.35)] transition hover:brightness-110 active:scale-[0.98]"
        >
          Ricarica pagina
        </button>
        <Link
          href="/"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[0.08] px-6 py-3.5 text-sm font-semibold text-white/90 backdrop-blur-xl transition hover:bg-white/[0.12]"
        >
          <Home className="h-4 w-4 text-[#FF7300]" aria-hidden />
          Torna alla home
        </Link>
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
      className="absolute inset-x-0 bottom-0 z-30 overflow-hidden rounded-t-[2rem] animate-[slide-up_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards]"
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

      {/* Backdrop */}
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
                badgeColor
              )}
            >
              {pct}% match
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-white/45">
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-[pulse_1s_ease-in-out_infinite]"
                aria-hidden
              />
              Reindirizzo alla ricerca…
            </span>
            <span className="tabular-nums font-semibold text-[#FF7300]">{countdown}s</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10 ring-1 ring-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF7300] to-amber-400 transition-all duration-1000 ease-linear shadow-[0_0_12px_rgba(255,115,0,0.45)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onSearchNow}
            className="flex-1 rounded-2xl bg-[#FF7300] px-4 py-3.5 text-sm font-bold uppercase tracking-wide text-[#1a0f08] shadow-[0_6px_20px_rgba(255,115,0,0.35)] transition hover:brightness-110 active:scale-[0.98]"
          >
            Cerca ora
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
// Main scanner page
// ---------------------------------------------------------------------------

export default function ScannerPage() {
  const router = useRouter();
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSlowRef = useRef(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

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
    const video = videoRef.current;
    const stream = video?.srcObject;
    if (!(stream instanceof MediaStream)) return;
    const track = stream.getVideoTracks()[0];
    if (!track?.getCapabilities) return;
    const caps = track.getCapabilities() as { torch?: boolean };
    if (!caps.torch) return;
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn } as MediaTrackConstraintSet],
      });
      setTorchOn((o) => !o);
    } catch {
      setTorchSupported(false);
    }
  }, [torchOn, videoRef]);

  const handleClose = useCallback(() => {
    setTorchOn(false);
    stopScanning();
    router.back();
  }, [stopScanning, router]);

  const handleGoHome = useCallback(() => {
    setTorchOn(false);
    stopScanning();
    router.push('/');
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

      <ScannerToolbar
        videoRef={videoRef}
        torchOn={torchOn}
        torchSupported={torchSupported}
        onToggleTorch={toggleTorch}
        onGoHome={handleGoHome}
        onClose={handleClose}
      />

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
                'radial-gradient(ellipse 72% 62% at center, transparent 30%, rgba(29,49,96,0.35) 58%, rgba(5,8,16,0.82) 100%)',
            }}
            aria-hidden
          />

          {/* Area guida — sotto header glass */}
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center pt-[4.5rem] sm:pt-[5rem]">
            <GlassCardFrame bracketState={bracketState} />

            {state !== 'matched' && (
              <div className="mt-6 max-w-[min(92vw,22rem)] rounded-2xl border border-white/18 bg-[#0a0f1a]/40 px-5 py-3 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl ring-1 ring-white/10">
                <p className="text-center text-[12px] font-medium leading-relaxed text-white/90 sm:text-[13px]">
                  {state === 'processing'
                    ? 'Analisi in corso… tieni ferma la carta.'
                    : 'Inquadra una carta Magic nel riquadro — luce uniforme, carta intera visibile.'}
                </p>
              </div>
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
