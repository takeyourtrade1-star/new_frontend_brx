'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Trophy, Zap } from 'lucide-react';
import { AuctionGavelIcon } from '@/components/ui/AuctionGavelIcon';
import { ScambiIcon } from '@/components/ui/ScambiIcon';
import { getTournamentsPortalUrl, TOURNAMENTS_PORTAL_LINK_PROPS } from '@/lib/config/tournaments';
import { AnimatePresence, motion } from 'framer-motion';
import {
  motionVariants,
  slideReducedVariants,
  slideVariants,
  useReducedMotion,
  springSoft,
  LANDING_EASE,
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
  external?: boolean;
  Icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
};

type Step = {
  title: string;
  description: string;
};

const SLIDES: SlideConfig[] = [
  {
    key: 'aste',
    tabLabel: 'Aste',
    headline: 'Aste live sulle carte',
    description:
      'Esplora annunci verificati, fai offerte in tempo reale e aggiudicati le carte che cerchi. Prezzi trasparenti, pagamenti protetti e spedizione integrata.',
    cta: 'Esplora le aste',
    href: '/aste',
    ariaLabel: 'Vai alle aste',
    Icon: AuctionGavelIcon,
    accentColor: '#FB923C',
  },
  {
    key: 'scambi',
    tabLabel: 'Scambi',
    headline: 'Scambia con la community',
    description:
      "Proponi scambi carta per carta, negozia in chat e chiudi l'accordo in sicurezza. Ideale per completare set e muovere collezione senza vendere.",
    cta: 'Vai agli scambi',
    href: '/scambi',
    ariaLabel: 'Vai agli scambi',
    Icon: ScambiIcon,
    accentColor: '#34D399',
  },
  {
    key: 'tornei',
    tabLabel: 'Tornei',
    headline: 'Competi in diretta',
    description:
      'Iscriviti ai tornei live, verifica la webcam e gioca round Swiss con tabellone live. Montepremi, classifiche e community attiva ogni settimana.',
    cta: 'Scopri i tornei',
    href: getTournamentsPortalUrl('/'),
    external: true,
    ariaLabel: 'Vai ai tornei live',
    Icon: Trophy,
    accentColor: '#A78BFA',
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
    Icon: Zap,
    accentColor: '#38BDF8',
  },
];

const STEPS: Record<HeroFeatureKey, Step[]> = {
  aste: [
    {
      title: 'Sfoglia e filtra',
      description: 'Cerca per gioco, rarità, condizione e prezzo.',
    },
    {
      title: 'Fai la tua offerta',
      description: 'Punta in tempo reale con incrementi chiari.',
    },
    {
      title: "Vinci l'asta",
      description: "L'offerta più alta si aggiudica la carta.",
    },
    {
      title: 'Ricevi in sicurezza',
      description: 'Spedizione tracciata e protezione acquirente.',
    },
  ],
  scambi: [
    {
      title: 'Proponi uno scambio',
      description: 'Seleziona le carte che offri e quelle che cerchi.',
    },
    {
      title: 'Negozia in chat',
      description: 'Allinea valori e condizioni con l\'altro utente.',
    },
    {
      title: 'Chiudi in sicurezza',
      description: 'Accordo tracciato con storico e reputazione.',
    },
    {
      title: 'Spedisci e completa',
      description: 'Invia, conferma la ricezione e valuta.',
    },
  ],
  tornei: [
    {
      title: 'Scegli il torneo',
      description: 'Formati Standard, Modern, Commander e altri.',
    },
    {
      title: 'Verifica e gioca live',
      description: 'Webcam, pairing live e supporto giudici.',
    },
    {
      title: 'Segui il tabellone',
      description: 'Round Swiss, top cut e classifiche.',
    },
    {
      title: 'Vinci premi',
      description: 'Montepremi, badge e visibilità.',
    },
  ],
  brx: [],
};

const SLIDE_BY_KEY = Object.fromEntries(
  SLIDES.map((s) => [s.key, s])
) as Record<HeroFeatureKey, SlideConfig>;

function getSlideDirection(
  from: HeroFeatureKey,
  to: HeroFeatureKey
): number {
  const fromIdx = FEATURE_ORDER.indexOf(from);
  const toIdx = FEATURE_ORDER.indexOf(to);
  if (fromIdx < 0 || toIdx < 0) return 1;
  return toIdx >= fromIdx ? 1 : -1;
}

/* ───────────────────────────────────────────────
   FeatureSlide
   ─────────────────────────────────────────────── */

function FeatureSlide({
  slide,
  direction,
  reduced,
}: {
  slide: SlideConfig;
  direction: number;
  reduced: boolean;
}) {
  const variants = reduced ? slideReducedVariants : slideVariants;
  const { Icon } = slide;

  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      className="absolute inset-0 flex flex-col p-4 sm:p-5 md:p-6 group/card"
    >
      {slide.external ? (
        <a
          {...TOURNAMENTS_PORTAL_LINK_PROPS}
          className="absolute inset-0 z-10 rounded-2xl"
          aria-label={slide.ariaLabel}
        />
      ) : (
        <Link
          href={slide.href}
          className="absolute inset-0 z-10 rounded-2xl"
          aria-label={slide.ariaLabel}
        />
      )}

      <h3 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-tight text-white mb-2">
        {slide.headline}
      </h3>

      <p className="text-xs sm:text-sm leading-relaxed text-white/70 mb-4 flex-1">
        {slide.description}
      </p>

      <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: slide.accentColor }}>
        <span>{slide.cta}</span>
        <ArrowRight className="h-3 w-3" />
      </div>
    </motion.div>
  );
}

/* ───────────────────────────────────────────────
   StepsRow
   ─────────────────────────────────────────────── */

function StepsRow({
  steps,
  reduced,
}: {
  steps: Step[];
  reduced: boolean;
}) {
  if (steps.length === 0) return null;

  return (
    <motion.div
      className="grid grid-cols-4 gap-2 sm:gap-3"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.06,
            delayChildren: 0.1,
          },
        },
      }}
    >
      {steps.map((step) => (
        <motion.div
          key={step.title}
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.4,
                ease: LANDING_EASE,
              },
            },
          }}
          className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-2.5 sm:p-3 backdrop-blur-sm transition-colors duration-300 hover:bg-white/[0.08] hover:border-white/20"
        >
          <h4 className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white/90 mb-1 leading-tight">
            {step.title}
          </h4>
          <p className="text-[9px] sm:text-[10px] leading-relaxed text-white/50 line-clamp-3 sm:line-clamp-none">
            {step.description}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ───────────────────────────────────────────────
   HeroTab
   ─────────────────────────────────────────────── */

function HeroTab({
  slide,
  isActive,
  onSelect,
  reduced,
}: {
  slide: SlideConfig;
  isActive: boolean;
  onSelect: () => void;
  reduced: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      className={`relative overflow-hidden rounded-lg border px-2 py-2 sm:px-3 sm:py-2.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
        isActive
          ? 'bg-white/10 text-white'
          : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/[0.08] hover:text-white/70'
      }`}
      style={{
        backdropFilter: 'blur(12px)',
        borderColor: isActive ? slide.accentColor : undefined,
      }}
      whileHover={reduced ? undefined : { y: -1 }}
      whileTap={{ scale: 0.98 }}
      aria-pressed={isActive}
    >
      <span className="relative z-[1] flex items-center justify-center gap-1.5">
        {slide.tabLabel}
      </span>
    </motion.button>
  );
}

/* ───────────────────────────────────────────────
   LandingHeroCarousel
   ─────────────────────────────────────────────── */

export function LandingHeroCarousel() {
  const reduced = useReducedMotion();
  const [activeFeature, setActiveFeature] =
    useState<HeroFeatureKey>('aste');
  const [progressKey, setProgressKey] = useState(0);
  const prevFeatureRef = useRef<HeroFeatureKey>('aste');
  const [slideDirection, setSlideDirection] = useState(1);

  /* Auto-advance */
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
    setSlideDirection(
      getSlideDirection(prevFeatureRef.current, activeFeature)
    );
    prevFeatureRef.current = activeFeature;
    setProgressKey((k) => k + 1);
  }, [activeFeature]);

  const activeSlide = SLIDE_BY_KEY[activeFeature];
  const activeSteps = STEPS[activeFeature];

  const rootVariants = motionVariants(
    {
      hidden: { opacity: 0, x: 20 },
      visible: {
        opacity: 1,
        x: 0,
        transition: {
          duration: 0.55,
          delay: 0.15,
          ease: LANDING_EASE,
        },
      },
    },
    reduced
  );

  return (
    <motion.div
      className="relative flex flex-col gap-3 sm:gap-4 min-h-0 sm:min-h-[200px] md:min-h-[220px] lg:min-h-[260px]"
      initial="hidden"
      animate="visible"
      variants={rootVariants}
    >
      {/* Tabs */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 shrink-0">
        {SLIDES.map((slide) => (
          <HeroTab
            key={slide.key}
            slide={slide}
            isActive={activeFeature === slide.key}
            onSelect={() => setActiveFeature(slide.key)}
            reduced={reduced}
          />
        ))}
      </div>

      {/* Unified Card + Steps */}
      <motion.div
        className="relative flex-1 overflow-hidden rounded-2xl border border-white/15 bg-[#0F172A]/50 backdrop-blur-md flex flex-col"
      >
        {/* Slide content */}
        <div className="relative min-h-[10rem] sm:min-h-[9rem] md:min-h-[10rem] flex-1">
          <AnimatePresence mode="wait" custom={slideDirection}>
            <FeatureSlide
              key={activeSlide.key}
              slide={activeSlide}
              direction={slideDirection}
              reduced={reduced}
            />
          </AnimatePresence>
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFeature}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
              duration: 0.3,
              ease: LANDING_EASE,
            }}
            className="px-4 pb-4 sm:px-5 sm:pb-5 md:px-6 md:pb-6"
          >
            <StepsRow
              steps={activeSteps}
              reduced={reduced}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
