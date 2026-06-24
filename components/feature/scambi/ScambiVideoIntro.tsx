'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

/**
 * Intro full-screen per la sezione Scambi.
 * Riproduce il video muto e, al termine o su interazione, naviga a /scambi.
 */
export function ScambiVideoIntro({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const onCloseRef = useRef(onClose);
  const doneRef = useRef(false);
  const startedRef = useRef(false);
  const [needsUserPlay, setNeedsUserPlay] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  // Mantiene il riferimento aggiornato senza invalidare i callback.
  onCloseRef.current = onClose;

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {
        // Ignora errori di uscita fullscreen.
      });
    }
    onCloseRef.current?.();
    router.push('/scambi');
  }, [router]);

  const handleSkip = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onCloseRef.current?.();
    router.push('/scambi');
  }, [router]);

  const startPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    void video.play().catch(() => {
      // Se l'autoplay è bloccato, mostra il pulsante di avvio manuale.
      setNeedsUserPlay(true);
    });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    startPlayback();

    const handleVideoEnded = () => finish();
    const handlePlaying = () => {
      startedRef.current = true;
      setCanSkip(true);
    };
    const handleTimeUpdate = () => {
      const d = video.duration;
      if (Number.isFinite(d) && d > 0 && video.currentTime >= d - 0.3) {
        finish();
      }
    };

    video.addEventListener('ended', handleVideoEnded);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('ended', handleVideoEnded);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [startPlayback, finish]);

  useEffect(() => {
    // Rete di sicurezza: se entro 8s il video non è mai partito, salta.
    const safety = window.setTimeout(() => {
      if (!startedRef.current) {
        handleSkip();
      } else {
        setCanSkip(true);
      }
    }, 8000);
    return () => window.clearTimeout(safety);
  }, [handleSkip]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [finish]);

  return (
    <div
      className="fixed inset-0 z-[10002] flex items-center justify-center bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={t('scambi.intro.dialogAria')}
      onClick={finish}
    >
      {canSkip && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
          aria-label={t('scambi.intro.skipAria')}
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
          <span>{t('scambi.intro.skip')}</span>
          <ChevronRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </button>
      )}

      <video
        ref={videoRef}
        src="/videos/scambi-opening.webm"
        autoPlay
        muted
        playsInline
        className="h-full w-full object-cover"
        onClick={(e) => e.stopPropagation()}
        onError={handleSkip}
      />

      {needsUserPlay && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setNeedsUserPlay(false);
            startPlayback();
          }}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          aria-label={t('scambi.intro.skipAria')}
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform hover:scale-105">
            <Play className="h-10 w-10 fill-white" />
          </span>
        </button>
      )}
    </div>
  );
}
