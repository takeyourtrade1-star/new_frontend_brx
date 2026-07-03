'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { getCdnVideoUrl } from '@/lib/config';

const LANDING_BG_VIDEO = 'videos/sfondo_carte.webm';

/** Leggermente più rapido del sorgente se il file è lento; regolabile. */
const PLAYBACK_RATE = 1.12;

type LandingBackgroundVideoProps = {
  className?: string;
  /** Sfondo solo sulla metà sinistra su desktop (layout auth split). */
  splitLeft?: boolean;
};

/**
 * Sfondo video landing: preload, fade-in su canplay, niente transform su scroll
 * (il parallax sulla <video> causava scatti e repaint continui).
 */
export function LandingBackgroundVideo({
  className,
  splitLeft = false,
}: LandingBackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const videoUrl = getCdnVideoUrl(LANDING_BG_VIDEO);

  const tryPlay = useCallback(() => {
    const el = videoRef.current;
    if (!el || failed) return;
    el.playbackRate = PLAYBACK_RATE;
    const p = el.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {});
    }
  }, [failed]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onReady = () => {
      setReady(true);
      tryPlay();
    };

    const onError = () => setFailed(true);

    el.addEventListener('canplaythrough', onReady, { once: true });
    el.addEventListener('loadeddata', tryPlay);
    el.addEventListener('error', onError);

    if (el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      onReady();
    } else {
      el.load();
    }

    return () => {
      el.removeEventListener('loadeddata', tryPlay);
      el.removeEventListener('error', onError);
    };
  }, [videoUrl, tryPlay]);

  useEffect(() => {
    const onVisibility = () => {
      const el = videoRef.current;
      if (!el || failed) return;
      if (document.hidden) {
        el.pause();
      } else if (ready) {
        tryPlay();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [failed, ready, tryPlay]);

  return (
    <div
      className={cn(
        'pointer-events-none overflow-hidden',
        splitLeft
          ? 'absolute inset-0 z-0 lg:right-1/2'
          : 'fixed inset-0 z-0 h-[100dvh] w-full',
        className
      )}
      aria-hidden
    >
      {/* Sfondo blu azzurrino: stessa palette ma "mesh gradient" — blob radiali
          morbidi che si fondono sulla base lineare, niente banding diagonale */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: [
            'radial-gradient(ellipse 90% 70% at 88% 105%, rgba(144,224,239,0.85) 0%, rgba(144,224,239,0) 62%)',
            'radial-gradient(ellipse 80% 65% at 72% 78%, rgba(0,180,216,0.75) 0%, rgba(0,180,216,0) 65%)',
            'radial-gradient(ellipse 95% 80% at 45% 55%, rgba(0,119,182,0.6) 0%, rgba(0,119,182,0) 70%)',
            'radial-gradient(ellipse 100% 90% at 8% -5%, rgba(10,25,47,0.9) 0%, rgba(10,25,47,0) 72%)',
            'linear-gradient(160deg, #0A192F 0%, #0F3460 48%, #0077B6 100%)',
          ].join(', '),
        }}
      />

      {/* Pattern BRX 5 volte più grosso (300px invece di 60px) che si ripete, con drop shadow per risaltare */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: "url('/brx-sfondo-logo-tile.svg')",
          backgroundSize: '300px 300px',
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center',
          filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.15))',
        }}
      />

      {/* Video nascosto per il test ma non eliminato */}
      {!failed && (
        <video
          ref={videoRef}
          className={cn(
            'absolute inset-0 h-full w-full object-cover object-center',
            'transition-opacity duration-700 ease-out',
            'hidden' // Nascondilo solo per il test
          )}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          disablePictureInPicture
          disableRemotePlayback
          // GPU layer dedicato, senza scale/parallax sul nodo video
          style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' as const }}
        >
          <source src={videoUrl} type="video/webm" />
          <source src={videoUrl.replace('.webm', '.mp4')} type="video/mp4" />
        </video>
      )}

      {/* Overlay gradiente per garantire la leggibilità dei testi bianchi della landing */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,25,47,0.5) 0%, rgba(10,25,47,0.1) 50%, rgba(15,23,42,0.85) 100%)',
        }}
      />
    </div>
  );
}
