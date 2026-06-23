'use client';

import { useRef, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import styles from './AsteScreen.module.css';

type AsteScreenProps = {
  onClose?: () => void;
};

export function AsteScreen({ onClose }: AsteScreenProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.85;
    }
  }, []);

  return (
    <div className={styles.asteContainer}>
      <div className={styles.asteFullscreenVideoWrapper}>
        <video
          ref={videoRef}
          className={styles.asteVideoBg}
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/maincard_bg.mp4" type="video/mp4" />
        </video>
        <div className={styles.asteFullscreenVideoOverlay} />
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={styles.asteCloseBtn}
          aria-label={t('common.close')}
        >
          ✕
        </button>
      )}

      <div className={styles.asteVideoHero}>
        <div className={styles.asteHeroContent}>
          <h1 className={styles.heroMainText}>{t('scambi.heroTitle')}</h1>
          <p className={styles.heroSubText}>
            {t('scambi.heroSubtitle')}
          </p>
        </div>
      </div>
    </div>
  );
}
