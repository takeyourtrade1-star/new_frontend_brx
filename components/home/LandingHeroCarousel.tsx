'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Gavel, ArrowLeftRight, Trophy, Zap } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import {
  arrowNudge,
  ctaHover,
  ctaTap,
  motionVariants,
  slideReducedVariants,
  slideVariants,
  springUnderline,
  staggerContainerFast,
  staggerItem,
  tabIconPulse,
  useReducedMotion,
} from './landingMotion';

export type HeroFeatureKey = 'aste' | 'scambi' | 'tornei' | 'brx';

const FEATURE_ORDER: HeroFeatureKey[] = ['aste', 'scambi', 'tornei', 'brx'];

const ROTATE_MS = 7000;

type SlideConfig = {
  key: HeroFeatureKey;
  tabLabel: string;
  headline: string;
  description: string;
  cta: string;
  href: string;
  ariaLabel: string;
  accent: string;
  accentMuted: string;
  border: string;
  borderActive: string;
  gradient: string;
  progressClass: string;
  Icon: typeof Gavel;
};

const SLIDES: SlideConfig[] = [
  {
    key: 'aste',
    tabLabel: 'Scopri le aste',
    headline: 'Aste live sulle carte',
    description:
      'Esplora annunci verificati, fai offerte in tempo reale e aggiudicati le carte che cerchi. Prezzi trasparenti, pagamenti protetti e spedizione integrata.',
    cta: 'Esplora le aste',
    href: '/aste',
    ariaLabel: 'Vai alle aste',
    accent: '#FB923C',
    accentMuted: 'text-[#FB923C]',
    border: 'border-orange-400/40',
    borderActive: 'border-orange-400/70',
    gradient: 'linear-gradient(135deg, rgba(251,146,60,0.14) 0%, rgba(15,23,42,0.4) 100%)',
    progressClass: 'bg-orange-400',
    Icon: Gavel,
  },
  {
    key: 'scambi',
    tabLabel: 'Scopri gli scambi',
    headline: 'Scambia con la community',
    description:
      "Proponi scambi carta per carta, negozia in chat e chiudi l'accordo in sicurezza. Ideale per completare set e muovere collezione senza vendere.",
    cta: 'Vai agli scambi',
    href: '/scambi',
    ariaLabel: 'Vai agli scambi',
    accent: '#34D399',
    accentMuted: 'text-emerald-400',
    border: 'border-emerald-400/40',
    borderActive: 'border-emerald-400/70',
    gradient: 'linear-gradient(135deg, rgba(52,211,153,0.14) 0%, rgba(15,23,42,0.4) 100%)',
    progressClass: 'bg-emerald-400',
    Icon: ArrowLeftRight,
  },
  {
    key: 'tornei',
    tabLabel: 'Tornei live',
    headline: 'Competi in diretta',
    description:
      'Iscriviti ai tornei ufficiali, verifica la webcam e gioca round Swiss con tabellone live. Montepremi, classifiche e community attiva ogni settimana.',
    cta: 'Scopri i tornei',
    href: '/tornei-live',
    ariaLabel: 'Vai ai tornei live',
    accent: '#A78BFA',
    accentMuted: 'text-[#A78BFA]',
    border: 'border-violet-400/40',
    borderActive: 'border-violet-400/70',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.14) 0%, rgba(15,23,42,0.4) 100%)',
    progressClass: 'bg-violet-400',
    Icon: Trophy,
  },
  {
    key: 'brx',
    tabLabel: 'BRX Express',
    headline: 'Spedizione in 24 ore',
    description:
      'Logistica decentralizzata per carte TCG: consegna rapida, tracciamento e rete di hub verificati. Il modo più veloce per ricevere o inviare le tue carte.',
    cta: 'Scopri BRX Express',
    href: '/brx-express',
    ariaLabel: 'Vai a BRX Express',
    accent: '#38BDF8',
    accentMuted: 'text-[#38BDF8]',
    border: 'border-sky-400/40',
    borderActive: 'border-sky-400/70',
    gradient: 'linear-gradient(135deg, rgba(56,189,248,0.14) 0%, rgba(15,23,42,0.4) 100%)',
    progressClass: 'bg-sky-400',
    Icon: Zap,
  },
];

const SLIDE_BY_KEY = Object.fromEntries(SLIDES.map((s) => [s.key, s])) as Record<HeroFeatureKey, SlideConfig>;

function getSlideDirection(from: HeroFeatureKey, to: HeroFeatureKey): number {
  const fromIdx = FEATURE_ORDER.indexOf(from);
  const toIdx = FEATURE_ORDER.indexOf(to);
  if (fromIdx < 0 || toIdx < 0) return 1;
  return toIdx >= fromIdx ? 1 : -1;
}

type FeatureSlideProps = {
  slide: SlideConfig;
  direction: number;
  reduced: boolean;
};

function FeatureSlide({ slide, direction, reduced }: FeatureSlideProps) {
  const { Icon } = slide;
  const variants = reduced ? slideReducedVariants : slideVariants;

  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      className="absolute inset-0 flex flex-col p-4 sm:p-5 group/card"
    >
      <Link href={slide.href} className="absolute inset-0 z-10 rounded-2xl" aria-label={slide.ariaLabel} />

      <motion.div
        className="pointer-events-none absolute -right-6 -top-6 opacity-[0.12]"
        animate={reduced ? undefined : { rotate: [0, 6, 0], scale: [1, 1.05, 1] }}
        transition={reduced ? undefined : { repeat: Infinity, duration: 6, ease: 'easeInOut' }}
      >
        <Icon className="h-28 w-28 sm:h-32 sm:w-32" style={{ color: slide.accent }} strokeWidth={1} />
      </motion.div>

      <motion.span
        className="relative z-20 mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest pointer-events-none"
        style={{
          borderColor: `${slide.accent}55`,
          backgroundColor: `${slide.accent}18`,
          color: slide.accent,
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.08, ...springUnderline }}
      >
        <Icon className="h-3 w-3" />
        {slide.tabLabel}
      </motion.span>

      <motion.h3
        className="relative z-20 text-lg sm:text-xl md:text-2xl lg:text-[1.65rem] font-black uppercase tracking-tight text-white pointer-events-none"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <span
          className="transition-colors duration-300 group-hover/card:text-[color:var(--hover-accent)]"
          style={{ ['--hover-accent' as string]: slide.accent }}
        >
          {slide.headline}
        </span>
      </motion.h3>

      <motion.p
        className="relative z-20 mt-2 flex-1 text-xs sm:text-sm md:text-[0.95rem] leading-relaxed text-white/80 pointer-events-none pr-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {slide.description}
      </motion.p>

      <motion.div
        className="relative z-20 mt-3 flex items-center justify-between rounded-xl border px-4 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider pointer-events-none sm:flex"
        style={{
          borderColor: `${slide.accent}66`,
          backgroundColor: `${slide.accent}22`,
          color: slide.accent,
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        whileHover={reduced ? undefined : ctaHover}
        whileTap={ctaTap}
      >
        <span>{slide.cta}</span>
        <motion.span
          className="inline-flex items-center gap-0.5 text-sm sm:ml-2"
          animate={reduced ? undefined : { x: [0, 4, 0] }}
          transition={reduced ? undefined : { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          whileHover={reduced ? undefined : arrowNudge}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </motion.span>
      </motion.div>
    </motion.div>
  );
}

type HeroTabProps = {
  slide: SlideConfig;
  isActive: boolean;
  onSelect: () => void;
  reduced: boolean;
  progressKey: number;
};

function HeroTab({ slide, isActive, onSelect, reduced, progressKey }: HeroTabProps) {
  const { Icon } = slide;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      layout
      variants={staggerItem}
      className={`bento-entry relative overflow-hidden rounded-xl border px-2.5 py-2.5 sm:px-3 sm:py-3 text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-white transition-colors duration-300 ${isActive ? slide.borderActive : slide.border} ${isActive ? 'bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.08)]' : 'bg-white/5 hover:bg-white/[0.08]'}`}
      style={{
        background: isActive ? slide.gradient : undefined,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      whileHover={reduced ? undefined : { scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      aria-pressed={isActive}
    >
      {/* Timed progress fill on active tab (synced to ROTATE_MS) */}
      {isActive && (
        <motion.span
          key={`progress-${slide.key}-${progressKey}`}
          className={`absolute inset-x-2 bottom-1 h-0.5 rounded-full origin-left ${slide.progressClass}`}
          initial={{ scaleX: 0, opacity: reduced ? 0.6 : 0.5 }}
          animate={{ scaleX: 1, opacity: reduced ? 0.85 : 0.95 }}
          transition={
            reduced
              ? { scaleX: { duration: ROTATE_MS / 1000, ease: 'linear' }, opacity: { duration: 0.2 } }
              : { scaleX: { duration: ROTATE_MS / 1000, ease: 'linear' }, opacity: { duration: 0.3 } }
          }
          style={{ transformOrigin: 'left center' }}
        />
      )}

      <span className="relative z-[1] flex items-center gap-1.5 line-clamp-2 text-left leading-tight">
        <motion.span
          animate={isActive && !reduced ? tabIconPulse : { scale: 1 }}
          className="inline-flex shrink-0"
        >
          <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" style={{ color: isActive ? slide.accent : undefined }} />
        </motion.span>
        {slide.tabLabel}
      </span>
    </motion.button>
  );
}

export function LandingHeroCarousel() {
  const reduced = useReducedMotion();
  const [activeFeature, setActiveFeature] = useState<HeroFeatureKey>('aste');
  const [progressKey, setProgressKey] = useState(0);
  const prevFeatureRef = useRef<HeroFeatureKey>('aste');
  const [slideDirection, setSlideDirection] = useState(1);

  // Always auto-advance; timer resets whenever the active slide changes (manual or auto).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActiveFeature((prev) => {
        const i = FEATURE_ORDER.indexOf(prev);
        return FEATURE_ORDER[(i + 1) % FEATURE_ORDER.length];
      });
    }, ROTATE_MS);
    return () => window.clearTimeout(timer);
  }, [activeFeature]);

  useEffect(() => {
    setSlideDirection(getSlideDirection(prevFeatureRef.current, activeFeature));
    prevFeatureRef.current = activeFeature;
    setProgressKey((k) => k + 1);
  }, [activeFeature]);

  const activeSlide = SLIDE_BY_KEY[activeFeature];
  const rootVariants = motionVariants(
    {
      hidden: { opacity: 0, x: 20 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.55, delay: 0.15, ease: [0.16, 1, 0.3, 1] } },
    },
    reduced,
  );

  return (
    <motion.div
      className="relative flex flex-col gap-3 sm:gap-4 min-h-[180px] sm:min-h-[200px] md:min-h-[220px] lg:min-h-[260px]"
      initial="hidden"
      animate="visible"
      variants={rootVariants}
    >
      <LayoutGroup>
        <motion.div
          className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-4"
          variants={motionVariants(staggerContainerFast, reduced)}
          initial="hidden"
          animate="visible"
        >
          {SLIDES.map((slide) => (
            <HeroTab
              key={slide.key}
              slide={slide}
              isActive={activeFeature === slide.key}
              onSelect={() => setActiveFeature(slide.key)}
              reduced={reduced}
              progressKey={progressKey}
            />
          ))}
        </motion.div>
      </LayoutGroup>

      <motion.div
        className="relative flex-1 overflow-hidden rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md"
        whileHover={reduced ? undefined : { boxShadow: '0 12px 48px rgba(0,0,0,0.28)' }}
        transition={{ duration: 0.4 }}
      >
        <AnimatePresence mode="wait" custom={slideDirection}>
          <FeatureSlide
            key={activeSlide.key}
            slide={activeSlide}
            direction={slideDirection}
            reduced={reduced}
          />
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
