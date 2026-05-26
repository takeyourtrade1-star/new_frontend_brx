'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { getCdnVideoUrl } from '@/lib/config';

const LANDING_BG_VIDEO = 'videos/sfondo_carte.mp4';

/** Leggermente più rapido del sorgente se il file è lento; regolabile. */
const PLAYBACK_RATE = 1.12;

type LandingBackgroundVideoProps = {
  className?: string;
};

/**
 * Sfondo video landing: preload, fade-in su canplay, niente transform su scroll
 * (il parallax sulla <video> causava scatti e repaint continui).
 */
export function LandingBackgroundVideo({ className }: LandingBackgroundVideoProps) {
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
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'video';
    link.href = videoUrl;
    link.type = 'video/mp4';
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, [videoUrl]);

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
  }, [tryPlay, videoUrl]);

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
        'pointer-events-none fixed inset-0 z-0 h-[100dvh] w-full overflow-hidden',
        className
      )}
      aria-hidden
    >
      {/* Placeholder statico mentre bufferizza — stesso mood del video */}
      <div
        className={cn(
          'absolute inset-0 bg-[#0F172A] transition-opacity duration-700',
          ready && !failed ? 'opacity-0' : 'opacity-100'
        )}
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(61,101,198,0.35) 0%, rgba(15,23,42,0.95) 70%)',
        }}
      />

      {!failed && (
        <video
          ref={videoRef}
          src={videoUrl}
          className={cn(
            'absolute inset-0 h-full w-full object-cover object-center',
            'transition-opacity duration-700 ease-out',
            ready ? 'opacity-100' : 'opacity-0'
          )}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          // GPU layer dedicato, senza scale/parallax sul nodo video
          style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' as const }}
        />
      )}

      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(15,23,42,0.55) 0%, rgba(29,49,96,0.40) 50%, rgba(15,23,42,0.65) 100%)',
        }}
      />
    </div>
  );
}
