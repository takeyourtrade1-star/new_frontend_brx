'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  const cls = 'h-5 w-5 sm:h-6 sm:w-6';

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
      className="relative h-44 w-28 overflow-hidden rounded-2xl sm:h-52 sm:w-32 lg:h-56 lg:w-36"
      style={{
        borderWidth: 1,
        borderColor: `rgba(${card.rgb}, ${isActive ? 0.75 : 0.38})`,
        background:
          'linear-gradient(150deg, #1c1c22 0%, #0e0e12 35%, #16161b 70%, #1c1c22 100%)',
        boxShadow: isActive
          ? `0 20px 55px rgba(${card.rgb}, 0.4), 0 6px 18px rgba(0,0,0,0.6), inset 0 1px 0 rgba(${card.rgb}, 0.12)`
          : `0 10px 26px rgba(0,0,0,0.55), inset 0 1px 0 rgba(${card.rgb}, 0.06)`,
        filter: isActive ? 'none' : 'brightness(0.66) saturate(0.9)',
        transition: 'box-shadow 350ms ease, border-color 350ms ease, filter 350ms ease',
      }}
    >
      {/* bordo interno sottile */}
      <div className="pointer-events-none absolute inset-[1px] rounded-2xl border border-white/[0.05]" />

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
        className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle, rgba(${card.rgb}, 0.28) 0%, transparent 70%)`,
          opacity: isActive ? 1 : 0,
        }}
      />

      {/* linea alta / bassa */}
      <div
        className="absolute left-3.5 right-3.5 top-3.5 h-px"
        style={{ background: `linear-gradient(to right, transparent, rgba(${card.rgb}, 0.35), transparent)` }}
      />
      <div
        className="absolute bottom-3.5 left-3.5 right-3.5 h-px"
        style={{ background: `linear-gradient(to right, transparent, rgba(${card.rgb}, 0.35), transparent)` }}
      />

      {/* corner brackets */}
      {CORNERS.map(([pos, inner], ci) => (
        <div key={ci} className={`absolute ${pos} h-2.5 w-2.5`}>
          <div className={`absolute ${inner} h-[1.5px] w-2 rounded-full`} style={{ backgroundColor: `rgba(${card.rgb}, 0.55)` }} />
          <div className={`absolute ${inner} h-2 w-[1.5px] rounded-full`} style={{ backgroundColor: `rgba(${card.rgb}, 0.55)` }} />
        </div>
      ))}

      {/* contenuto */}
      <div className="relative z-[1] flex h-full w-full flex-col items-center justify-center gap-1.5 px-2 text-center">
        {/* icona (identità sempre visibile, loop automatico come nell'header) */}
        <span style={{ color: card.hex }} className="mb-0.5 opacity-90">
          <FanIcon featureKey={card.key} reduced={reduced} delay={iconDelay} />
        </span>

        {/* parola rivelata */}
        <motion.span
          className="font-display text-xl font-extrabold uppercase leading-none tracking-tight sm:text-2xl lg:text-[1.7rem]"
          style={{ color: card.hex }}
          animate={{
            opacity: isActive ? 1 : 0,
            y: isActive ? 0 : 6,
            filter: isActive
              ? `blur(0px) drop-shadow(0 2px 12px rgba(${card.rgb}, 0.55))`
              : 'blur(3px) drop-shadow(0 0 0 transparent)',
          }}
          transition={revealTransition}
        >
          {card.label}
        </motion.span>

        <span className="text-[0.5rem] font-medium uppercase tracking-[0.3em] text-zinc-500/80">
          Ebartex
        </span>

        {/* CTA rivelata */}
        <motion.span
          className="mt-1 inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider sm:text-[9px]"
          style={{ color: card.hex }}
          animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 6 }}
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
      <a {...TOURNAMENTS_PORTAL_LINK_PROPS} className="block rounded-2xl" aria-label={card.ariaLabel}>
        {face}
      </a>
    );
  }

  return (
    <Link href={card.href} className="block rounded-2xl" aria-label={card.ariaLabel}>
      {face}
    </Link>
  );
}

/* ───────────────────────────────────────────────
   Ventaglio
   ─────────────────────────────────────────────── */

export function LandingHeroCardFan() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();

  const cards = useMemo<FanCard[]>(
    () =>
      CARD_META.map((m) => ({
        key: m.key,
        // parola grande = prima parola del tab localizzato (Vendi, Aste, Scambi, Tornei, BRX)
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

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  /* Auto-rotazione */
  useEffect(() => {
    if (paused || reduced) return;
    const id = window.setInterval(() => {
      setActive((a) => (a + 1) % cards.length);
    }, LANDING_ROTATION_MS);
    return () => window.clearInterval(id);
  }, [paused, reduced, cards.length]);

  /* Larghezza reale → scala l'apertura del ventaglio per non sforare su mobile */
  const stageRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const spread = width ? Math.min(1, Math.max(0.55, width / 520)) : 1;

  const N = cards.length;
  const centerIdx = (N - 1) / 2;
  const activeCard = cards[active];

  /* Hit-test a colonne fisse sull'intero stage, non sulla card animata:
   * tutte le carte condividono la stessa cella (fan sovrapposto) e la carta
   * attiva si sposta al centro sotto il cursore fermo, quindi un
   * `onMouseEnter` per-carta genera un loop (la carta attivata si allontana
   * dal cursore, che finisce sopra un'altra carta, che si attiva a sua
   * volta, ecc.). Dividendo lo stage in N colonne statiche il calcolo non
   * dipende più da dove si trova visivamente la carta in un dato istante. */
  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const relX = (e.clientX - rect.left) / rect.width;
    const idx = Math.min(N - 1, Math.max(0, Math.floor(relX * N)));
    setPaused(true);
    setActive((prev) => (prev === idx ? prev : idx));
  };

  return (
    <div
      ref={stageRef}
      className="relative grid w-full min-h-[300px] place-items-center sm:min-h-[340px] lg:min-h-[380px]"
      style={{ perspective: 1200 }}
      onMouseMove={handlePointerMove}
      onMouseLeave={() => setPaused(false)}
    >
      {/* alone ambientale nel colore della carta attiva */}
      <div
        className="pointer-events-none h-56 w-56 rounded-full blur-[60px] transition-[background] duration-700 [grid-area:1/1]"
        style={{
          background: `radial-gradient(circle, rgba(${activeCard.rgb}, 0.22) 0%, transparent 70%)`,
          zIndex: 0,
        }}
        aria-hidden
      />

      {cards.map((card, i) => {
        const rel = i - centerIdx; // -2 .. 2 (5 carte)
        const isActive = i === active;

        const restRotate = rel * 13 * spread;
        const restY = Math.abs(rel) * 10 * spread;
        const restScale = 1 - Math.abs(rel) * 0.045;
        const lift = 32 * spread;

        const target = isActive
          ? { x: 0, y: -lift, rotate: 0, scale: 1.1 }
          : { x: 0, y: restY, rotate: restRotate, scale: restScale };

        return (
          <motion.div
            key={card.key}
            className="[grid-area:1/1] will-change-transform"
            style={{
              transformOrigin: '50% 150%',
              zIndex: isActive ? 50 : 30 - Math.round(Math.abs(rel) * 4),
            }}
            animate={target}
            transition={reduced ? { duration: 0.2 } : springSoft}
            onFocusCapture={() => {
              setActive(i);
              setPaused(true);
            }}
          >
            <FanCardFace card={card} isActive={isActive} reduced={reduced} iconDelay={i * 0.35} />
          </motion.div>
        );
      })}
    </div>
  );
}
