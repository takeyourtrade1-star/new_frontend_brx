'use client';

import { Suspense, useEffect, useRef, useCallback, useState, type RefObject } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Home, Search, Lightbulb, X } from 'lucide-react';
import { useBrxScanner, type DebugInfo, type ModelStatus } from '@/hooks/useBrxScanner';
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
// Model status badge (V3 edge pipeline indicator)
// ---------------------------------------------------------------------------

function ModelStatusBadge({ status }: { status: ModelStatus }) {
  if (status === 'ready') {
    return (
      <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-500/30">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" aria-hidden />
        Turbo
      </span>
    );
  }
  if (status === 'loading') {
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300 ring-1 ring-amber-500/30">
        <span className="h-1.5 w-1.5 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-amber-400" aria-hidden />
        Caricamento…
      </span>
    );
  }
  // failed — show Standard mode indicator
  return (
    <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50 ring-1 ring-white/10">
      <span className="h-1.5 w-1.5 rounded-full bg-white/40" aria-hidden />
      Standard
    </span>
  );
}

// ---------------------------------------------------------------------------
// Scan area overlay
// ---------------------------------------------------------------------------

type BracketState = 'idle' | 'scanning' | 'matched';

// Card area sizing — usato sia da ScanCorners sia dalla blur mask, deve
// matchare per avere l'allineamento perfetto fra cornice e finestra clear.
const CARD_W = 'min(78vw, 290px)';
const CARD_H = 'calc(min(78vw, 290px) * 7 / 5)';

/**
 * 4 angoli a L che delimitano l'area di scan. Nessun overlay sul centro:
 * la carta dietro resta perfettamente nitida e visibile.
 */
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

  // Lunghezza dei "tick" agli angoli (px responsive)
  const cornerLen = 'clamp(22px, 6vw, 32px)';
  const cornerThickness = '3px';
  const radius = '12px';

  const baseCorner = cn(
    'pointer-events-none absolute transition-all duration-300',
    color,
    pulse
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
          top: 0,
          left: 0,
          width: cornerLen,
          height: cornerLen,
          borderTop: `${cornerThickness} solid currentColor`,
          borderLeft: `${cornerThickness} solid currentColor`,
          borderTopLeftRadius: radius,
        }}
      />
      {/* Top-right */}
      <span
        className={baseCorner}
        style={{
          top: 0,
          right: 0,
          width: cornerLen,
          height: cornerLen,
          borderTop: `${cornerThickness} solid currentColor`,
          borderRight: `${cornerThickness} solid currentColor`,
          borderTopRightRadius: radius,
        }}
      />
      {/* Bottom-left */}
      <span
        className={baseCorner}
        style={{
          bottom: 0,
          left: 0,
          width: cornerLen,
          height: cornerLen,
          borderBottom: `${cornerThickness} solid currentColor`,
          borderLeft: `${cornerThickness} solid currentColor`,
          borderBottomLeftRadius: radius,
        }}
      />
      {/* Bottom-right */}
      <span
        className={baseCorner}
        style={{
          bottom: 0,
          right: 0,
          width: cornerLen,
          height: cornerLen,
          borderBottom: `${cornerThickness} solid currentColor`,
          borderRight: `${cornerThickness} solid currentColor`,
          borderBottomRightRadius: radius,
        }}
      />

      {/* Linea di scansione che attraversa l'area (solo quando si scansiona) */}
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

/**
 * Maschera grid 3×3: cella centrale completamente trasparente (carta visibile
 * nitida), 8 celle esterne con backdrop-blur leggero per concentrare lo sguardo.
 */
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
      {/* Cella centrale: NESSUN blur — la carta deve essere perfettamente nitida */}
      <div />
      <div className={cell} />
      <div className={cell} />
      <div className={cell} />
      <div className={cell} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status bar at the bottom
// ---------------------------------------------------------------------------

type StatusBarState = 'idle' | 'scanning' | 'processing' | 'matched' | 'slow' | 'hint';

function StatusBar({
  status,
  hintName,
}: {
  status: StatusBarState;
  hintName?: string | null;
}) {
  const messages: Record<StatusBarState, string> = {
    idle: 'Inizializzazione fotocamera…',
    scanning: 'Inquadra la carta nel riquadro',
    processing: 'Analisi in corso…',
    matched: 'Carta trovata!',
    slow: 'Analisi in corso… (rete lenta)',
    hint: hintName ? `Riconosco: ${hintName}` : 'Riconoscimento…',
  };

  const dotColor =
    status === 'matched'
      ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]'
      : status === 'hint'
      ? 'bg-[#FF7300] shadow-[0_0_12px_rgba(255,115,0,0.7)]'
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
            status === 'processing' || status === 'slow' || status === 'hint'
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
  modelStatus,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  torchOn: boolean;
  torchSupported: boolean;
  onToggleTorch: () => void;
  onGoHome: () => void;
  onClose: () => void;
  modelStatus: ModelStatus;
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
        <ModelStatusBadge status={modelStatus} />
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
// Debug overlay (mobile-friendly diagnostics — toggle with ?debug=1)
// ---------------------------------------------------------------------------

/** Live guess chip — appears before full match commit. */
function LiveHintChip({
  hint,
  latencyMs,
}: {
  hint: { card_name: string; set_name: string; image_uri: string | null; confidence: number };
  latencyMs: number;
}) {
  return (
    <div
      className="pointer-events-none mt-4 flex max-w-[min(92vw,20rem)] items-center gap-3 rounded-2xl border border-[#FF7300]/35 bg-[#0a0f1a]/65 px-3.5 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl"
    >
      {hint.image_uri ? (
        <img
          src={hint.image_uri}
          alt=""
          className="h-12 w-8 shrink-0 rounded-md object-cover ring-1 ring-white/20"
        />
      ) : (
        <div className="h-12 w-8 shrink-0 rounded-md bg-white/10" aria-hidden />
      )}
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-[13px] font-semibold text-white">{hint.card_name}</p>
        <p className="truncate text-[11px] text-white/65">{hint.set_name}</p>
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[#FF7300]/90">
          Conferma… {Math.round(hint.confidence * 100)}%
          {latencyMs > 0 ? ` · ${latencyMs}ms` : ''}
        </p>
      </div>
    </div>
  );
}

function DebugOverlay({ debug, state }: { debug: DebugInfo; state: string }) {
  const statusColor =
    debug.lastStatus === '200'
      ? 'text-emerald-300'
      : debug.lastStatus === 'TIMEOUT' || debug.lastStatus === 'NETWORK_ERROR'
      ? 'text-red-300'
      : debug.lastStatus
      ? 'text-amber-300'
      : 'text-white/60';

  return (
    <div className="pointer-events-none absolute left-2 right-2 top-[max(4.5rem,calc(env(safe-area-inset-top)+4rem))] z-50 mx-auto max-w-md rounded-xl border border-white/15 bg-black/75 px-3 py-2 font-mono text-[10px] leading-relaxed text-white/90 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
        <span>state: <b className="text-white">{state}</b></span>
        <span>frames: <b className="text-white">{debug.framesSent}</b></span>
        <span>http: <b className={statusColor}>{debug.lastStatus ?? '—'}</b></span>
        <span>rtt: <b className="text-white">{debug.lastLatencyMs >= 0 ? `${debug.lastLatencyMs}ms` : '—'}</b></span>
        <span>last: <b className="text-white">{debug.lastOutcome ?? '—'}</b></span>
        <span>method: <b className="text-white">{debug.lastMethod ?? '—'}</b></span>
      </div>
      {debug.lastError && (
        <div className="mt-1 truncate text-red-300">err: {debug.lastError}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main scanner page
// ---------------------------------------------------------------------------

function ScannerPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showDebug =
    process.env.NODE_ENV !== 'production' || searchParams?.get('debug') === '1';
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSlowRef = useRef(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  const cancelRedirect = useCallback(() => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
  }, []);

  const {
    state,
    result,
    hint,
    isBusy,
    countdown,
    debug,
    videoRef,
    canvasRef,
    openCamera,
    stopScanning,
    restartScanning,
    modelStatus,
  } = useBrxScanner({
    confidenceThreshold: 0.78,
    captureIntervalMs: 320,
    countdownSeconds: COUNTDOWN_SECONDS,
    apiBaseUrl: '/brx-match',
    requestTimeoutMs: 4500,
    scanMode: 'fast',
    voteWindow: 3,
    voteRequired: 2,
    onMatch: (r) => {
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
        slowTimerRef.current = null;
      }
      isSlowRef.current = false;

      // Auto-redirect when countdown hits 0 (cancellabile dai bottoni)
      cancelRedirect();
      redirectTimerRef.current = setTimeout(() => {
        redirectTimerRef.current = null;
        router.push(r.search_url);
      }, COUNTDOWN_SECONDS * 1000);
    },
  });

  // Open camera on mount
  useEffect(() => {
    openCamera();
    return () => {
      stopScanning();
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      cancelRedirect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track slow processing (> 2s)
  useEffect(() => {
    if (isBusy && state === 'scanning') {
      slowTimerRef.current = setTimeout(() => {
        isSlowRef.current = true;
      }, 2500);
    } else {
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
        slowTimerRef.current = null;
      }
      isSlowRef.current = false;
    }
  }, [isBusy, state]);

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
    cancelRedirect();
    setTorchOn(false);
    stopScanning();
    router.back();
  }, [cancelRedirect, stopScanning, router]);

  const handleGoHome = useCallback(() => {
    cancelRedirect();
    setTorchOn(false);
    stopScanning();
    router.push('/');
  }, [cancelRedirect, stopScanning, router]);

  const handleSearchNow = useCallback(() => {
    if (result) {
      cancelRedirect();
      stopScanning();
      router.push(result.search_url);
    }
  }, [cancelRedirect, result, stopScanning, router]);

  const handleNotThisCard = useCallback(() => {
    cancelRedirect();
    restartScanning();
  }, [cancelRedirect, restartScanning]);

  // Derive status bar state
  const statusBarState: StatusBarState =
    state === 'matched'
      ? 'matched'
      : hint
      ? 'hint'
      : isBusy
      ? isSlowRef.current
        ? 'slow'
        : 'processing'
      : state === 'scanning'
      ? 'scanning'
      : 'idle';

  const bracketState: BracketState =
    state === 'matched' ? 'matched' : hint ? 'scanning' : state === 'scanning' || isBusy ? 'scanning' : 'idle';

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
      <TopLoadingBar active={isBusy && state !== 'matched'} />

      <ScannerToolbar
        videoRef={videoRef}
        torchOn={torchOn}
        torchSupported={torchSupported}
        onToggleTorch={toggleTorch}
        onGoHome={handleGoHome}
        onClose={handleClose}
        modelStatus={modelStatus}
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

      {/* ── Scan overlay (clear center + soft blurred surroundings) ─── */}
      {(state === 'scanning' || state === 'matched') && (
        <>
          {/* Maschera blur attorno all'area di scan (centro NITIDO) */}
          <ScanAreaBlurMask />

          {/* Cornice ad angoli + hint */}
          <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center">
            <ScanCorners bracketState={bracketState} />

            {state !== 'matched' && !hint && (
              <p className="mt-5 max-w-[min(92vw,22rem)] text-center text-[12px] font-medium leading-relaxed text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] sm:text-[13px]">
                Inquadra la carta Magic nel riquadro
              </p>
            )}
            {hint && state !== 'matched' && (
              <LiveHintChip hint={hint} latencyMs={debug.lastLatencyMs} />
            )}
          </div>

          {/* Status bar */}
          {state !== 'matched' && (
            <StatusBar status={statusBarState} hintName={hint?.card_name} />
          )}
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

      {/* ── Debug overlay (dev mode o ?debug=1) ─────────────────────── */}
      {showDebug && <DebugOverlay debug={debug} state={state} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default export wrapped in Suspense
// ---------------------------------------------------------------------------
// `useSearchParams` impone una Suspense boundary lato Next.js App Router,
// altrimenti il prerender statico fallisce con "missing-suspense-with-csr-bailout".
// Il fallback usa lo stesso fondo nero della pagina per evitare flash visivi.

export default function ScannerPage() {
  return (
    <Suspense
      fallback={
        <div
          className="relative w-full overflow-hidden bg-black"
          style={{ height: '100svh' }}
          aria-hidden
        />
      }
    >
      <ScannerPageInner />
    </Suspense>
  );
}
