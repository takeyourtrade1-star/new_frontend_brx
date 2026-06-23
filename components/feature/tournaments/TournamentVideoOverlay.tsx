'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
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
      window.clearTimeout(safety);
    };
  }, [handleSkip]);

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
            className="h-full w-full object-cover"
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
                'absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full',
                'bg-black/60 px-4 py-2 text-sm font-medium text-white',
                'border border-white/20 backdrop-blur-sm',
                'transition hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white/50',
                'md:right-6 md:top-6 md:px-5 md:py-2.5 md:text-base'
              )}
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span>{t('tournaments.videoOverlay.skip')}</span>
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
