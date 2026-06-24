'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

/**
 * Intro full-screen per la sezione Scambi.
 * Riproduce il video muto e, al termine o su interazione, naviga a /scambi.
 */
export function ScambiVideoIntro({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);

  const finish = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {
        // Ignora errori di uscita fullscreen.
      });
    }
    onClose?.();
    router.push('/scambi');
  }, [onClose, router]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Riproduzione automatica robusta: il browser richiede muted per autoplay.
    video.muted = true;
    void video.play().catch(() => {
      // Fallback silenzioso: se autoplay viene bloccato, l'utente può cliccare.
    });

    // Tenta il fullscreen nativo; se non supportato resta l'overlay a schermo intero.
    const container = video.parentElement;
    if (container && document.fullscreenEnabled) {
      void container.requestFullscreen().catch(() => {
        // Fullscreen non consentito: prosegui in overlay.
      });
    }

    const handleEnded = () => finish();
    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [finish]);

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
        className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-opacity hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
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
    </div>
  );
}
