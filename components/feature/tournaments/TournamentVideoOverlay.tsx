'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const VIDEO_PATH = '/videos/tournament-video-trial.webm?v=3';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasFinishedRef = useRef(false);

  const handleEnded = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

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
            onError={handleEnded}
            disablePictureInPicture
            disableRemotePlayback
            style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
          >
            <source src={VIDEO_PATH} type="video/webm" onError={handleEnded} />
          </video>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
