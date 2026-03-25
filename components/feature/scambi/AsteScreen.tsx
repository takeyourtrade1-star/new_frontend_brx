'use client';

import { useRef, useEffect, useState } from 'react';
import { HitCard, type HitCardData } from './HitCard';
import styles from './AsteScreen.module.css';

const EXCHANGES_DATA: HitCardData[] = [
  {
    name: 'MARCO',
    action: 'SCAMBIA',
    item: 'IPHONE 12',
    condition: 'DISCRETE CONDIZIONI',
    details: '128 GB',
    image: 'https://picsum.photos/seed/iphone/600/600',
    gradient: 'linear-gradient(to left, #fdedd6, #35170c)',
  },
  {
    name: 'GIULIA',
    action: 'SCAMBIA',
    item: 'VINTAGE JACKET',
    condition: 'OTTIME CONDIZIONI',
    details: 'TAGLIA M',
    image: 'https://picsum.photos/seed/jacket/600/600',
    gradient: 'linear-gradient(to left, #1a1a2e, #16213e)',
  },
  {
    name: 'LUCA',
    action: 'BARATTA',
    item: 'CARTE COLLEZIONABILI',
    condition: 'NUOVE',
    details: 'SERIE LIMITATA',
    image: 'https://picsum.photos/seed/cards/600/600',
    gradient: 'linear-gradient(to left, #0f3460, #533483)',
  },
];

const CATEGORY_DATA = [
  { name: 'ABBIGLIAMENTO', img: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=600&auto=format&fit=crop' },
  { name: 'ELETTRONICA', img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=600&auto=format&fit=crop' },
  { name: 'SPORT', img: 'https://images.unsplash.com/photo-1461896836934-562f891dc89a?q=80&w=600&auto=format&fit=crop' },
  { name: 'CASA', img: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=600&auto=format&fit=crop' },
  { name: 'GIOCHI', img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop' },
];

const mod = (n: number, m: number) => ((n % m) + m) % m;

type AsteScreenProps = {
  showAll: boolean;
  setShowAll: (v: boolean) => void;
  onNavigate?: (view: string) => void;
  onClose?: () => void;
};

export function AsteScreen({ showAll, setShowAll, onNavigate, onClose }: AsteScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [virtualActiveIndex, setVirtualActiveIndex] = useState(2);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.85;
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (showAll) {
      timer = setTimeout(() => setIsScrolling(true), 850);
    } else {
      setIsScrolling(false);
    }
    return () => clearTimeout(timer);
  }, [showAll]);

  const cardsToRender: (HitCardData & { offset: number; vIndex: number })[] = [];
  for (let i = -5; i <= 10; i++) {
    const vIndex = virtualActiveIndex + i;
    const dataIndex = mod(vIndex, EXCHANGES_DATA.length);
    cardsToRender.push({
      ...EXCHANGES_DATA[dataIndex],
      offset: i,
      vIndex,
    });
  }

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
          aria-label="Chiudi"
        >
          ✕
        </button>
      )}

      <div className={`${styles.asteVideoHero} ${showAll ? styles.modeAll : ''}`}>
        <div className={styles.asteHeroContent}>
          <h1 className={styles.heroMainText}>SCAMBIA, CONTRATTA, BARATTA.</h1>
          <p className={styles.heroSubText}>
            C&apos;è qualcosa che ti piace? Proponi il tuo scambio e ottieni quello che vuoi senza spendere nulla.
          </p>
        </div>
      </div>

      <section className={`${styles.asteHits} ${showAll ? `${styles.modeAll} aste-hits-mode-all` : ''}`}>
        <div className={styles.asteHitsHeader}>
          <h2 className={styles.asteHitsTitle}>SPONSORIZZATI</h2>
          {!showAll && (
            <span
              className={styles.asteViewAll}
              onClick={() => setShowAll(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setShowAll(true)}
            >
              VEDI TUTTI GLI SCAMBI →
            </span>
          )}
        </div>

        <div className={styles.asteHitsStackContainer}>
          <div className={`${styles.asteHitsInner} ${isScrolling ? styles.scrolling : ''}`}>
            {cardsToRender.map((card) => {
              const isExpanded = card.offset === 0;
              let xPos = 0;
              let yPos = 0;
              let scale = 1;
              let opacity = 1;
              let zIndex = 10;

              if (card.offset === -2) {
                xPos = -420;
                scale = 0.75;
                yPos = 20;
                opacity = 0.2;
                zIndex = 1;
              } else if (card.offset === -1) {
                xPos = -240;
                scale = 0.88;
                yPos = 10;
                opacity = 0.7;
                zIndex = 5;
              } else if (card.offset === 0) {
                xPos = 0;
                scale = 1.05;
                yPos = 0;
                opacity = 1;
                zIndex = 10;
              } else if (card.offset === 1) {
                xPos = 240;
                scale = 0.88;
                yPos = 10;
                opacity = 0.7;
                zIndex = 5;
              } else if (card.offset === 2) {
                xPos = 420;
                scale = 0.75;
                yPos = 20;
                opacity = 0.2;
                zIndex = 1;
              } else {
                xPos = card.offset < 0 ? -600 : 600;
                scale = 0.5;
                yPos = 40;
                opacity = 0;
                zIndex = 0;
              }

              if (showAll) {
                xPos = card.offset * 460;
                scale = 1;
                yPos = -10;
                opacity = 1;
                zIndex = 10;
              }

              return (
                <div
                  key={`card-${card.vIndex}`}
                  className={`${styles.stackCard} ${isExpanded && !showAll ? styles.stackCardActive : ''}`}
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) translateX(${xPos}px) translateY(${yPos}px) scale(${scale})`,
                    opacity,
                    zIndex,
                    pointerEvents: opacity === 0 ? 'none' : 'auto',
                  }}
                  onClick={() => {
                    if (showAll) {
                      setShowAll(false);
                    } else if (card.offset !== 0) {
                      setVirtualActiveIndex(virtualActiveIndex + card.offset);
                    } else if (card.offset === 0 && onNavigate) {
                      onNavigate('asta-detail');
                    }
                  }}
                  role="button"
                  tabIndex={opacity === 0 ? -1 : 0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (showAll) setShowAll(false);
                      else if (card.offset !== 0) setVirtualActiveIndex(virtualActiveIndex + card.offset);
                      else if (card.offset === 0 && onNavigate) onNavigate('asta-detail');
                    }
                  }}
                >
                  <HitCard {...card} isActive={isExpanded && !showAll} />
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.categoriesSection}>
          <h2 className={styles.categoriesTitle}>TUTTE LE CATEGORIE</h2>
          <div className={styles.categoriesGrid}>
            {CATEGORY_DATA.map((cat, idx) => (
              <div key={idx} className={styles.categoryCard}>
                <div className={styles.categoryImgWrapper}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cat.img} alt={cat.name} className={styles.categoryImg} />
                </div>
                <div className={styles.categoryNameWrapper}>
                  <span className={styles.categoryName}>{cat.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
