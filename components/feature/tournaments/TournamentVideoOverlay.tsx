'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const VIDEO_PATH = '/videos/tournament-video-trial.webm';

export function TournamentVideoOverlay({ onEnded }: { onEnded: () => void }) {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleEnded = useCallback(() => {
    setFadingOut(true);
    setTimeout(() => {
      setVisible(false);
      onEnded();
    }, 800);
  }, [onEnded]);

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
            disablePictureInPicture
            disableRemotePlayback
            style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
          >
            <source src={VIDEO_PATH} type="video/webm" />
          </video>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
