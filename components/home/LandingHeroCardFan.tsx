'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Trophy, ArrowRight } from 'lucide-react';
import { AuctionGavelIcon } from '@/components/ui/AuctionGavelIcon';
import { ScambiIcon } from '@/components/ui/ScambiIcon';
import { SalesTagIcon } from '@/components/ui/SalesTagIcon';
import { BrxExpressIcon } from '@/components/ui/BrxExpressIcon';
import { getTournamentsPortalUrl, TOURNAMENTS_PORTAL_LINK_PROPS } from '@/lib/config/tournaments';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { motion } from 'framer-motion';
import { useReducedMotion, springSoft, LANDING_ROTATION_MS, LANDING_ROTATION_COLORS } from './landingMotion';

/* ═══════════════════════════════════════════════════════════
   LandingHeroCardFan
   Ventaglio di carte "brandizzate" (stile BRX/Ebartex) che ruota:
   la carta attiva si raddrizza in primo piano e "rivela" la parola.
   Sostituisce il vecchio carosello a 4 tab.
   ═══════════════════════════════════════════════════════════ */

type FeatureKey = 'vendi' | 'aste' | 'scambi' | 'tornei' | 'brx';

type FanCard = {
  key: FeatureKey;
  label: string;
  cta: string;
  href: string;
  external?: boolean;
  ariaLabel: string;
  hex: string;
  rgb: string;
};

/** Metadati statici (colore/rotta). Icona in FanIcon, testi da i18n. */
const CARD_META: {
  key: FeatureKey;
  href: string;
  external?: boolean;
  hex: string;
  rgb: string;
}[] = [
  { key: 'vendi', href: '/vendi', hex: LANDING_ROTATION_COLORS[0].hex, rgb: LANDING_ROTATION_COLORS[0].rgb },
  { key: 'aste', href: '/aste', hex: LANDING_ROTATION_COLORS[1].hex, rgb: LANDING_ROTATION_COLORS[1].rgb },
  { key: 'scambi', href: '/scambi', hex: LANDING_ROTATION_COLORS[2].hex, rgb: LANDING_ROTATION_COLORS[2].rgb },
  { key: 'tornei', href: getTournamentsPortalUrl('/'), external: true, hex: LANDING_ROTATION_COLORS[3].hex, rgb: LANDING_ROTATION_COLORS[3].rgb },
  { key: 'brx', href: '/brx-express', hex: LANDING_ROTATION_COLORS[4].hex, rgb: LANDING_ROTATION_COLORS[4].rgb },
];

/** Trofeo dei Tornei: nessuna animazione dedicata esiste nell'header (Tornei
 * lì è solo un link testuale), quindi qui ne creiamo una su misura — balzo +
 * lampo di luce dorata al culmine, in loop automatico. */
function TorneiTrophyLoop({ cls, delay }: { cls: string; delay: number }) {
  return (
    <span className="relative inline-flex items-center justify-center">
      <motion.span
        className="pointer-events-none absolute inset-0 -z-10 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(253,224,71,0.55) 0%, transparent 70%)' }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.6, 1.5, 1.5] }}
        transition={{ duration: 0.6, ease: 'easeOut', repeat: Infinity, repeatDelay: 2.7, delay }}
      />
      <motion.span
        className="inline-flex"
        animate={{ y: [0, -5, 0], scale: [1, 1.14, 1], rotate: [0, -5, 3, 0] }}
        transition={{ duration: 0.7, ease: 'easeOut', repeat: Infinity, repeatDelay: 2.6, delay }}
      >
        <Trophy className={cls} />
      </motion.span>
    </span>
  );
}

/** BRX Express: nessuna animazione dedicata esiste nell'header, quindi qui ne
 * creiamo una su misura — il fulmine "colpisce" davvero: doppio lampo di
 * luce (bright → dim → bright → fade, come un vero fulmine), un'onda d'urto
 * che si espande e un micro-jitter di rotazione, in loop automatico. */
function BrxLightningLoop({ cls, delay }: { cls: string; delay: number }) {
  const times = [0, 0.06, 0.14, 0.2, 0.34, 1];
  return (
    <span className="relative inline-flex items-center justify-center overflow-visible">
      {/* Onda d'urto al momento della scarica */}
      <motion.span
        className="pointer-events-none absolute inset-0 rounded-full border-2"
        style={{ borderColor: 'rgba(224,242,254,0.9)' }}
        animate={{ opacity: [0, 0, 0.9, 0, 0, 0], scale: [0.4, 0.4, 1, 1.9, 1.9, 1.9] }}
        transition={{ duration: 0.9, times, ease: 'easeOut', repeat: Infinity, repeatDelay: 2.4, delay }}
      />
      {/* Bagliore radiale: nucleo bianco-elettrico che sfuma nell'azzurro brand */}
      <motion.span
        className="pointer-events-none absolute -inset-2 rounded-full blur-[3px]"
        style={{
          background:
            'radial-gradient(circle, rgba(240,249,255,0.95) 0%, rgba(56,189,248,0.55) 45%, transparent 72%)',
        }}
        animate={{ opacity: [0.15, 1, 0.25, 1, 0.15, 0.15], scale: [0.7, 1.3, 0.9, 1.25, 0.9, 0.9] }}
        transition={{ duration: 0.9, times, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2.4, delay }}
      />
      {/* Il fulmine: doppio flicker come una vera scarica, con micro-jitter */}
      <motion.span
        className="relative inline-flex"
        animate={{
          scale: [1, 1.4, 1.05, 1.32, 1, 1],
          rotate: [0, -6, 4, -3, 0, 0],
          filter: [
            'brightness(1) drop-shadow(0 0 2px rgba(56,189,248,0.4))',
            'brightness(2.2) drop-shadow(0 0 14px rgba(224,242,254,0.95))',
            'brightness(1.1) drop-shadow(0 0 4px rgba(56,189,248,0.5))',
            'brightness(2) drop-shadow(0 0 12px rgba(224,242,254,0.9))',
            'brightness(1) drop-shadow(0 0 2px rgba(56,189,248,0.4))',
            'brightness(1) drop-shadow(0 0 2px rgba(56,189,248,0.4))',
          ],
        }}
        transition={{ duration: 0.9, times, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2.4, delay }}
      >
        <BrxExpressIcon className={cls} />
      </motion.span>
    </span>
  );
}

/** Icona per feature: per Vendi/Aste/Scambi riusa esattamente le stesse
 * animazioni dell'header (stessi valori di rotazione/scala/traslazione),
 * solo in auto-play a ciclo continuo invece che legate all'hover — vedi
 * il prop `loop` su AuctionGavelIcon/SalesTagIcon e `animate-scambi-swirl-loop`
 * in tailwind.config.ts. Tornei e BRX non hanno un'animazione nell'header:
 * qui ne creiamo di nuove (vedi sopra). `delay` sfalsa leggermente l'inizio
 * tra le carte così non partono tutte in sincrono. */
function FanIcon({
  featureKey,
  reduced,
  delay = 0,
}: {
  featureKey: FeatureKey;
  reduced: boolean;
  delay?: number;
}) {
  const cls = 'h-4 w-4 sm:h-5 sm:w-5';

  if (reduced) {
    switch (featureKey) {
      case 'vendi':
        return <SalesTagIcon className={cls} strokeWidth={2} />;
      case 'aste':
        return <AuctionGavelIcon className={cls} strokeWidth={2} />;
      case 'scambi':
        return <ScambiIcon className={cls} />;
      case 'tornei':
        return <Trophy className={cls} />;
      case 'brx':
        return <BrxExpressIcon className={cls} />;
    }
  }

  switch (featureKey) {
    case 'vendi':
      return <SalesTagIcon className={cls} strokeWidth={2} loop loopDelay={delay} />;
    case 'aste':
      return <AuctionGavelIcon className={cls} strokeWidth={2} loop loopDelay={delay} />;
    case 'scambi':
      return (
        <ScambiIcon className={`${cls} animate-scambi-swirl-loop`} style={{ animationDelay: `${delay}s` }} />
      );
    case 'tornei':
      return <TorneiTrophyLoop cls={cls} delay={delay} />;
    case 'brx':
      return <BrxLightningLoop cls={cls} delay={delay} />;
  }
}

/** Angoli L dei 4 corner-brackets (posizione esterna + allineamento interno). */
const CORNERS: [string, string][] = [
  ['left-2 top-2', 'left-0 top-0'],
  ['right-2 top-2', 'right-0 top-0'],
  ['bottom-2 left-2', 'bottom-0 left-0'],
  ['bottom-2 right-2', 'bottom-0 right-0'],
];

/* ───────────────────────────────────────────────
   Faccia della carta (frame BRX + parola rivelata)
   ─────────────────────────────────────────────── */

function FanCardFace({
  card,
  isActive,
  reduced,
  iconDelay,
}: {
  card: FanCard;
  isActive: boolean;
  reduced: boolean;
  iconDelay: number;
}) {
  const revealTransition = reduced
    ? { duration: 0.15 }
    : { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const };

  const face = (
    <div
      className="relative h-36 w-24 overflow-hidden rounded-xl sm:h-44 sm:w-28"
      style={{
        borderWidth: 1,
        borderColor: `rgba(${card.rgb}, ${isActive ? 0.75 : 0.38})`,
        background:
          'linear-gradient(150deg, #1c1c22 0%, #0e0e12 35%, #16161b 70%, #1c1c22 100%)',
        boxShadow: isActive
          ? `0 15px 40px rgba(${card.rgb}, 0.12), 0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(${card.rgb}, 0.08)`
          : `0 8px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(${card.rgb}, 0.04)`,
        filter: isActive ? 'none' : 'brightness(0.66) saturate(0.9)',
        transition: 'box-shadow 350ms ease, border-color 350ms ease, filter 350ms ease',
      }}
    >
      {/* bordo interno sottile */}
      <div className="pointer-events-none absolute inset-[1px] rounded-xl border border-white/[0.05]" />

      {/* riflesso diagonale */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(115deg, transparent 32%, rgba(255,255,255,0.07) 46%, transparent 62%)',
        }}
      />

      {/* radial glow dietro il testo (solo attiva) */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-500 sm:h-28 sm:w-28"
        style={{
          background: `radial-gradient(circle, rgba(${card.rgb}, 0.1) 0%, transparent 70%)`,
          opacity: isActive ? 1 : 0,
        }}
      />

      {/* linea alta / bassa */}
      <div
        className="absolute left-2.5 right-2.5 top-2.5 h-px"
        style={{ background: `linear-gradient(to right, transparent, rgba(${card.rgb}, 0.35), transparent)` }}
      />
      <div
        className="absolute bottom-2.5 left-2.5 right-2.5 h-px"
        style={{ background: `linear-gradient(to right, transparent, rgba(${card.rgb}, 0.35), transparent)` }}
      />

      {/* corner brackets */}
      {CORNERS.map(([pos, inner], ci) => (
        <div key={ci} className={`absolute ${pos} h-2 w-2`}>
          <div className={`absolute ${inner} h-[1.5px] w-1.5 rounded-full`} style={{ backgroundColor: `rgba(${card.rgb}, 0.55)` }} />
          <div className={`absolute ${inner} h-1.5 w-[1.5px] rounded-full`} style={{ backgroundColor: `rgba(${card.rgb}, 0.55)` }} />
        </div>
      ))}

      {/* contenuto */}
      <div className="relative z-[1] flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center sm:gap-1.5">
        {/* icona: animata solo sulla carta attiva — 5 loop infiniti simultanei
            (framer-motion + CSS) laggano sui PC lenti, quindi le carte dietro
            restano statiche */}
        <span style={{ color: card.hex }} className="mb-0.5 opacity-90">
          <FanIcon featureKey={card.key} reduced={reduced || !isActive} delay={iconDelay} />
        </span>

        {/* parola rivelata */}
        <motion.span
          className="font-display text-sm font-black uppercase leading-none tracking-tight sm:text-base"
          style={{ color: card.hex }}
          animate={{
            opacity: isActive ? 1 : 0,
            y: isActive ? 0 : 4,
            filter: isActive
              ? `blur(0px) drop-shadow(0 1px 8px rgba(${card.rgb}, 0.25))`
              : 'blur(2px) drop-shadow(0 0 0 transparent)',
          }}
          transition={revealTransition}
        >
          {card.label}
        </motion.span>

        <span className="text-[0.42rem] font-bold uppercase tracking-[0.2em] text-zinc-500/70 sm:text-[0.5rem]">
          Ebartex
        </span>

        {/* CTA rivelata */}
        <motion.span
          className="mt-0.5 inline-flex items-center gap-0.5 text-[7.5px] font-bold uppercase tracking-wider sm:text-[9px]"
          style={{ color: card.hex }}
          animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 4 }}
          transition={revealTransition}
        >
          {card.cta}
          <ArrowRight className="h-2.5 w-2.5" />
        </motion.span>
      </div>
    </div>
  );

  if (card.external) {
    return (
      <a {...TOURNAMENTS_PORTAL_LINK_PROPS} className="block rounded-xl" aria-label={card.ariaLabel}>
        {face}
      </a>
    );
  }

  return (
    <Link href={card.href} className="block rounded-xl" aria-label={card.ariaLabel}>
      {face}
    </Link>
  );
}

/* ───────────────────────────────────────────────
   Focus + peek: una sola carta in primo piano al
   centro e la successiva "che sbircia" a destra,
   entrambe dritte (niente ventaglio ruotato).
   ─────────────────────────────────────────────── */

export function LandingHeroCardFan({
  active,
  setActive,
  paused,
  setPaused,
}: {
  active: number;
  setActive: React.Dispatch<React.SetStateAction<number>>;
  paused: boolean;
  setPaused: (paused: boolean) => void;
}) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();

  const cards = useMemo<FanCard[]>(
    () =>
      CARD_META.map((m) => ({
        key: m.key,
        label: t(`landing.carousel.${m.key}.tab` as MessageKey).split(' ')[0],
        cta: t(`landing.carousel.${m.key}.cta` as MessageKey),
        href: m.href,
        external: m.external,
        ariaLabel: t(`landing.carousel.${m.key}.aria` as MessageKey),
        hex: m.hex,
        rgb: m.rgb,
      })),
    [t]
  );

  const N = cards.length;
  const activeCard = cards[active];

  return (
    <div
      className="relative flex items-center justify-center w-full max-w-[260px] sm:max-w-[300px] h-48 sm:h-52 overflow-hidden"
      onMouseLeave={() => setPaused(false)}
    >
      {/* alone ambientale nel colore della carta attiva */}
      <div
        className="pointer-events-none absolute h-44 w-44 rounded-full blur-[48px] transition-[background] duration-700 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 sm:h-52 sm:w-52"
        style={{
          background: `radial-gradient(circle, rgba(${activeCard.rgb}, 0.12) 0%, transparent 70%)`,
          zIndex: 0,
        }}
        aria-hidden
      />

      {cards.map((card, i) => {
        const diff = (i - active + N) % N;
        let offset = diff;
        if (offset > 2) offset -= N;

        const isActive = i === active;
        const isPeek = offset === 1;

        // Solo attiva (centro) + successiva (peek a destra), entrambe dritte;
        // le altre scivolano fuori invisibili per dare direzione al cambio.
        const target = {
          x: offset === 0 ? 0 : offset === 1 ? 88 : offset > 1 ? 150 : -80,
          scale: offset === 0 ? 1 : 0.85,
          opacity: offset === 0 ? 1 : offset === 1 ? 0.45 : 0,
          rotate: 0,
        };

        return (
          <motion.div
            key={card.key}
            className="absolute will-change-transform"
            style={{
              zIndex: isActive ? 50 : isPeek ? 40 : 20,
              pointerEvents: isActive || isPeek ? 'auto' : 'none',
            }}
            animate={target}
            transition={reduced ? { duration: 0.2 } : springSoft}
            onMouseEnter={() => {
              setPaused(true);
              if (isPeek) setActive(i);
            }}
            onFocusCapture={() => {
              setActive(i);
              setPaused(true);
            }}
          >
            <FanCardFace card={card} isActive={isActive} reduced={reduced} iconDelay={0.2} />
          </motion.div>
        );
      })}
    </div>
  );
}
