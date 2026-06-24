'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

const VIDEO_VERSION = 'v=3';
const VIDEO_WEBM = `/videos/tournament-video-trial.webm?${VIDEO_VERSION}`;
const VIDEO_MP4 = `/videos/tournament-video-trial.mp4?${VIDEO_VERSION}`;

type TournamentVideoOverlayProps = {
  onEnded: () => void;
  /** Evita il fade-out che mostra la pagina sotto prima del redirect. */
  redirectImmediately?: boolean;
};

export function TournamentVideoOverlay({
  onEnded,
  redirectImmediately = false,
}: TournamentVideoOverlayProps) {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const doneRef = useRef(false);
  const startedRef = useRef(false);
  const { t } = useTranslation();

  const handleEnded = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (redirectImmediately) {
      onEnded();
      return;
    }
    setFadingOut(true);
    setTimeout(() => {
      setVisible(false);
      onEnded();
    }, 800);
  }, [onEnded, redirectImmediately]);

  /** Se il video non c'è (404), il codec non è supportato o l'autoplay è
   * bloccato, NON restiamo bloccati sull'overlay nero: si va dritti al portale. */
  const handleSkip = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onEnded();
  }, [onEnded]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onPlaying = () => {
      startedRef.current = true;
      setCanSkip(true);
    };
    el.addEventListener('playing', onPlaying);

    // Fallback fine video: su alcuni browser l'evento `ended` non scatta in modo
    // affidabile e il video resta bloccato sull'ultimo frame senza redirect.
    // Quando siamo a ridosso della durata forziamo comunque la chiusura.
    const onTimeUpdate = () => {
      const d = el.duration;
      if (Number.isFinite(d) && d > 0 && el.currentTime >= d - 0.3) {
        handleEnded();
      }
    };
    el.addEventListener('timeupdate', onTimeUpdate);

    // Prova esplicita: se l'autoplay/caricamento fallisce, salta al portale.
    const p = el.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => handleSkip());
    }

    // Rete di sicurezza: se entro 8s il video non è mai partito, salta.
    const safety = window.setTimeout(() => {
      if (!startedRef.current) {
        handleSkip();
      } else {
        setCanSkip(true);
      }
    }, 8000);

    return () => {
      el.removeEventListener('playing', onPlaying);
      el.removeEventListener('timeupdate', onTimeUpdate);
      window.clearTimeout(safety);
    };
  }, [handleSkip, handleEnded]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: fadingOut ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className={cn(
            'fixed inset-0 z-[9999] flex items-center justify-center bg-black',
            'overflow-hidden'
          )}
          aria-hidden={fadingOut}
        >
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={handleEnded}
            onError={handleSkip}
            disablePictureInPicture
            disableRemotePlayback
            style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
          >
            <source src={VIDEO_WEBM} type="video/webm" />
            <source src={VIDEO_MP4} type="video/mp4" />
          </video>
          {canSkip && (
            <button
              type="button"
              onClick={handleSkip}
              aria-label={t('tournaments.videoOverlay.skip')}
              className={cn(
                'group absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full',
                'bg-white/10 py-2 pl-4 pr-3 text-sm font-medium text-white/90',
                'border border-white/20 shadow-lg ring-1 ring-black/5 backdrop-blur-md',
                'transition-all duration-200 hover:bg-white/20 hover:text-white',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                'animate-in fade-in slide-in-from-top-2',
                'md:right-6 md:top-6'
              )}
            >
              <span>{t('tournaments.videoOverlay.skip')}</span>
              <ChevronRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
