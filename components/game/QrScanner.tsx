'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CameraOff, Loader2, ScanLine, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ═══════════════════════════════════════════════════════════════════════
   QrScanner — lightweight native QR reader (BarcodeDetector API).
   Zero dependencies. Falls back gracefully when unsupported.
   ═══════════════════════════════════════════════════════════════════════ */

/* Minimal ambient types for the non-standard BarcodeDetector API. */
type DetectedBarcode = { rawValue: string; format: string };
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
};
type BarcodeDetectorAPI = BarcodeDetectorCtor & {
  getSupportedFormats?: () => Promise<string[]>;
};

type ScannerState = 'init' | 'scanning' | 'error' | 'unsupported';

interface QrScannerProps {
  open: boolean;
  onScan: (value: string) => void;
  onClose: () => void;
  title?: string;
  hint?: string;
}

export function QrScanner({ open, onScan, onClose, title = 'Scansiona invito', hint }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cancelledRef = useRef(false);

  const [state, setState] = useState<ScannerState>('init');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const stopEverything = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    cancelledRef.current = true;
    stopEverything();
    onClose();
  }, [onClose, stopEverything]);

  useEffect(() => {
    if (!open) return;

    cancelledRef.current = false;
    setState('init');
    setErrorMsg(null);

    const BD = (typeof window !== 'undefined'
      ? (window as unknown as { BarcodeDetector?: BarcodeDetectorAPI }).BarcodeDetector
      : undefined);

    if (!BD) {
      setState('unsupported');
      return;
    }

    const boot = async () => {
      try {
        if (typeof BD.getSupportedFormats === 'function') {
          const formats = await BD.getSupportedFormats();
          if (cancelledRef.current) return;
          if (!formats.includes('qr_code')) {
            setState('unsupported');
            return;
          }
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelledRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        await video.play();

        const detector = new BD({ formats: ['qr_code'] });
        setState('scanning');

        const tick = async () => {
          if (cancelledRef.current || !videoRef.current) return;
          try {
            const results = await detector.detect(videoRef.current);
            const first = results?.[0];
            if (first?.rawValue) {
              cancelledRef.current = true;
              stopEverything();
              onScan(first.rawValue);
              return;
            }
          } catch {
            /* swallow one-frame decode errors, keep trying */
          }
          rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
      } catch (err) {
        if (cancelledRef.current) return;
        const e = err as { name?: string; message?: string };
        let msg = 'Impossibile avviare la fotocamera.';
        if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
          msg = 'Permesso fotocamera negato. Consentilo nelle impostazioni del browser e riprova.';
        } else if (e?.name === 'NotFoundError') {
          msg = 'Nessuna fotocamera disponibile su questo dispositivo.';
        } else if (e?.name === 'NotReadableError') {
          msg = 'La fotocamera è già in uso da un\'altra app. Chiudila e riprova.';
        } else if (e?.message) {
          msg = e.message;
        }
        setErrorMsg(msg);
        setState('error');
      }
    };

    void boot();

    return () => {
      cancelledRef.current = true;
      stopEverything();
    };
  }, [open, onScan, stopEverything]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[10040] flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Card */}
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-[#1D3160]/85 via-[#2a4080]/65 to-[#1D3160]/90 shadow-[0_30px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Ambient glow */}
            <div className="pointer-events-none absolute -top-20 -left-12 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-20 -right-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl" aria-hidden />

            <div className="relative p-4 sm:p-5">

              {/* ── Header ── */}
              <header className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-400/40 bg-cyan-500/15 text-cyan-300">
                    <ScanLine className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-display text-sm uppercase tracking-wider text-white">{title}</h2>
                    {hint && <p className="text-[11px] text-white/55">{hint}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                  aria-label="Chiudi scanner"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              {/* ── Viewport ── */}
              <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-2xl border border-white/15 bg-black/60">

                {/* Video */}
                <video
                  ref={videoRef}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${state === 'scanning' ? 'opacity-100' : 'opacity-0'}`}
                  muted
                  playsInline
                />

                {/* Init / loading */}
                {state === 'init' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70">
                    <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
                    <p className="text-xs">Avvio fotocamera&hellip;</p>
                  </div>
                )}

                {/* Unsupported */}
                {state === 'unsupported' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center">
                    <div className="grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-white/5">
                      <CameraOff className="h-5 w-5 text-white/60" />
                    </div>
                    <h3 className="font-display text-sm uppercase tracking-wider text-white">Scansione non supportata</h3>
                    <p className="max-w-xs text-[11px] leading-relaxed text-white/60">
                      Questo browser non supporta la scansione QR nativa. Apri il sito su un telefono con Chrome, Edge o Safari&nbsp;17+, oppure incolla il codice manualmente.
                    </p>
                  </div>
                )}

                {/* Error */}
                {state === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center">
                    <div className="grid h-12 w-12 place-items-center rounded-full border border-red-400/40 bg-red-500/15">
                      <AlertTriangle className="h-5 w-5 text-red-300" />
                    </div>
                    <h3 className="font-display text-sm uppercase tracking-wider text-white">Fotocamera non disponibile</h3>
                    <p className="max-w-xs text-[11px] leading-relaxed text-white/60">{errorMsg}</p>
                  </div>
                )}

                {/* Reticle overlay when scanning */}
                {state === 'scanning' && (
                  <>
                    {/* Dim corners */}
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.55)_85%)]" />

                    {/* Viewfinder frame */}
                    <div className="pointer-events-none absolute inset-6 sm:inset-8">
                      <span className="absolute left-0 top-0 h-6 w-6 border-l-[3px] border-t-[3px] border-cyan-300 rounded-tl-md" />
                      <span className="absolute right-0 top-0 h-6 w-6 border-r-[3px] border-t-[3px] border-cyan-300 rounded-tr-md" />
                      <span className="absolute bottom-0 left-0 h-6 w-6 border-b-[3px] border-l-[3px] border-cyan-300 rounded-bl-md" />
                      <span className="absolute bottom-0 right-0 h-6 w-6 border-b-[3px] border-r-[3px] border-cyan-300 rounded-br-md" />

                      {/* Scanning line */}
                      <motion.span
                        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_14px_rgba(34,211,238,0.7)]"
                        initial={{ top: 0 }}
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>

                    {/* Status pill */}
                    <div className="absolute left-1/2 bottom-3 -translate-x-1/2 rounded-full border border-white/20 bg-black/55 px-3 py-1 backdrop-blur-sm">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/85">Inquadra il QR</p>
                    </div>
                  </>
                )}
              </div>

              {/* ── Footer actions ── */}
              <div className="mt-4 flex items-center justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="h-9 border-white/20 bg-white/5 text-white hover:bg-white/15 hover:text-white"
                >
                  {state === 'scanning' ? 'Annulla' : 'Chiudi'}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
