'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Play } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

/**
 * Intro full-screen per la sezione Scambi.
 * Riproduce il video muto e, al termine o su interazione, naviga a /scambi.
 */
export function ScambiVideoIntro({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const onCloseRef = useRef(onClose);
  const [needsUserPlay, setNeedsUserPlay] = useState(false);

  // Mantiene il riferimento aggiornato senza invalidare i callback.
  onCloseRef.current = onClose;

  const finish = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {
        // Ignora errori di uscita fullscreen.
      });
    }
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

    const handleEnded = () => finish();
    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [startPlayback, finish]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [finish]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={t('scambi.intro.dialogAria')}
      onClick={finish}
    >
      <button
        type="button"
        onClick={finish}
        className="absolute right-4 top-4 z-20 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-opacity hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        aria-label={t('scambi.intro.skipAria')}
      >
        <X className="h-6 w-6" />
      </button>

      <video
        ref={videoRef}
        src="/videos/scambi-opening.webm"
        autoPlay
        muted
        playsInline
        className="h-full w-full object-cover"
        onClick={(e) => e.stopPropagation()}
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
