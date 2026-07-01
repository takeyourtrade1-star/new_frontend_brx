'use client';

import React, { useEffect, useCallback, useMemo, useState } from 'react';
import type { LucideProps } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CircleDollarSign, ShieldCheck,
  ArrowRightLeft, Scale, Package, TrendingUp, X, Mail,
  CheckCircle2, ArrowLeft, BellRing, Users,
} from 'lucide-react';
import { getCdnImageUrl } from '@/lib/config';
import { useGame } from '@/lib/contexts/GameContext';
import type { GameSlug } from '@/lib/contexts/GameContext';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import { useTimeouts } from '@/lib/hooks/use-timeout-fn';
import { SignedAlteredShowcase } from './SignedAlteredShowcase';
import { motion, AnimatePresence } from 'framer-motion';
import { LandingHeroCardFan } from '@/components/home/LandingHeroCardFan';
import { LandingBackgroundVideo } from '@/components/feature/LandingBackgroundVideo';
import { LANDING_ROTATION_MS, LANDING_ROTATION_COLORS } from '@/components/home/landingMotion';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */

type LandingGameSlug = GameSlug | 'clear';

const FEATURE_ICONS: Record<string, React.FC<LucideProps>> = {
  prezzi: CircleDollarSign,
  sicuro: ShieldCheck,
  gestione: ArrowRightLeft,
  domanda: Scale,
  vendite: Package,
  commissioni: TrendingUp,
};

/* ─── Games ─── */
const getMainGames = (): {
  src: string;
  alt: string;
  homeHref: string;
  gameSlug: LandingGameSlug;
}[] => [
  {
    src: getCdnImageUrl('loghi-giochi/magic.png'),
    alt: 'Magic The Gathering',
    homeHref: '/home/magic',
    gameSlug: 'mtg',
  },
];

const GAME_FULLSCREEN_IMAGES: Record<string, string> = {
  'Pokémon Trading Card Game': '/landing-giochi-bg/pokemon.png',
  "Yu-Gi-Oh! Trading Card Game": '/landing-giochi-bg/yugioh.png',
  'One Piece Card Game': '/landing-giochi-bg/one-piece.png',
  'Disney Lorcana': '/landing-giochi-bg/disney.png',
  'Star Wars: Unlimited': '/landing-giochi-bg/starwars.png',
};

/** Sfondo gradiente leggero per ogni gioco, sui colori del brand:
 * Pokémon (giallo/blu), Yu-Gi-Oh! (viola/oro), One Piece (rosso/oro),
 * Lorcana (turchese/oro inchiostro), Star Wars (blu/ambra). */
const GAME_GRADIENTS: Record<string, string> = {
  'Pokémon Trading Card Game': 'from-[#FFCB05]/25 to-[#2A75BB]/25',
  'Yu-Gi-Oh! Trading Card Game': 'from-[#7A3FA0]/30 to-[#C9A227]/20',
  'One Piece Card Game': 'from-[#D8232A]/[28%] to-[#E0A23B]/20',
  'Disney Lorcana': 'from-[#15A6A6]/[28%] to-[#D4AF37]/20',
  'Star Wars: Unlimited': 'from-[#1E6FB8]/[26%] to-[#F2C200]/[18%]',
};

const getComingSoonGames = (): {
  src: string;
  alt: string;
  label: string;
  homeHref?: string;
  comingSoon?: boolean;
  gameSlug?: LandingGameSlug;
  waitlistCount: number;
}[] => [
  {
    src: getCdnImageUrl('loghi-giochi/pokèmon.png'),
    alt: 'Pokémon Trading Card Game',
    label: 'Pokémon',
    homeHref: '/home/pokemon',
    gameSlug: 'pokemon',
    comingSoon: true,
    waitlistCount: 1247,
  },
  {
    src: getCdnImageUrl('loghi-giochi/yu-gi-oh.png'),
    alt: 'Yu-Gi-Oh! Trading Card Game',
    label: 'Yu-Gi-Oh!',
    homeHref: '/home',
    gameSlug: 'clear',
    comingSoon: true,
    waitlistCount: 892,
  },
  {
    src: getCdnImageUrl('loghi-giochi/One_Piece_Card_Game_Logo%201.png'),
    alt: 'One Piece Card Game',
    label: 'One Piece',
    comingSoon: true,
    waitlistCount: 1563,
  },
  {
    src: getCdnImageUrl('loghi-giochi/Disney_Lorcana_480x480%201.png'),
    alt: 'Disney Lorcana',
    label: 'Lorcana',
    comingSoon: true,
    waitlistCount: 634,
  },
  {
    src: getCdnImageUrl('star_wars.jpg'),
    alt: 'Star Wars: Unlimited',
    label: 'Star Wars',
    comingSoon: true,
    waitlistCount: 2105,
  },
];

/** Giochi TCG presenti sul catalogo Cardmarket ma non ancora mostrati qui singolarmente
 * (Magic + i 5 di COMING_SOON_GAMES sono già visibili): mostrato come tile "+N" in stile Cardmarket. */
const EXTRA_COMING_SOON_GAMES_COUNT = 10;

/* ─── Boutique ─── */
const BOUTIQUE_GLOW_COLORS: Record<string, string> = {
  dadi: '251, 191, 36',
  buste: '167, 139, 250',
  tappetini: '56, 189, 248',
  memorabilia: '251, 146, 60',
  albums: '251, 113, 133',
  'game-kits': '255, 115, 0',
};

// Tutte le card rimandano alla pagina Boutique standard (non a categorie filtrate).
const BOUTIQUE_CATEGORIES = [
  { id: 'dadi', label: 'Dadi', href: '/products/boutique',
    imageUrl: '/ebartex-boutique/dadi-boutique.webp',
    imageSet: { sm: '/ebartex-boutique/dadi-boutique-sm.webp', md: '/ebartex-boutique/dadi-boutique-md.webp', lg: '/ebartex-boutique/dadi-boutique-lg.webp' }
  },
  { id: 'buste', label: 'Buste', href: '/products/boutique',
    imageUrl: '/ebartex-boutique/buste-boutique.webp',
    imageSet: { sm: '/ebartex-boutique/buste-boutique-sm.webp', md: '/ebartex-boutique/buste-boutique-md.webp', lg: '/ebartex-boutique/buste-boutique-lg.webp' }
  },
  { id: 'tappetini', label: 'Tappetini', href: '/products/boutique',
    imageUrl: '/ebartex-boutique/tappetini-boutique.webp',
    imageSet: { sm: '/ebartex-boutique/tappetini-boutique-sm.webp', md: '/ebartex-boutique/tappetini-boutique-md.webp', lg: '/ebartex-boutique/tappetini-boutique-lg.webp' }
  },
  { id: 'memorabilia', label: 'Memorabilia', href: '/products/boutique',
    imageUrl: '/ebartex-boutique/memorabilia-boutique.webp',
    imageSet: { sm: '/ebartex-boutique/memorabilia-boutique-sm.webp', md: '/ebartex-boutique/memorabilia-boutique-md.webp', lg: '/ebartex-boutique/memorabilia-boutique-lg.webp' }
  },
  { id: 'albums', label: 'Albums', href: '/products/boutique',
    imageUrl: '/ebartex-boutique/albums-boutique.webp',
    imageSet: { sm: '/ebartex-boutique/albums-boutique-sm.webp', md: '/ebartex-boutique/albums-boutique-md.webp', lg: '/ebartex-boutique/albums-boutique-lg.webp' }
  },
  { id: 'game-kits', label: 'Game kits', href: '/products/boutique',
    imageUrl: '/ebartex-boutique/gamekits-boutique.webp',
    imageSet: { sm: '/ebartex-boutique/gamekits-boutique-sm.webp', md: '/ebartex-boutique/gamekits-boutique-md.webp', lg: '/ebartex-boutique/gamekits-boutique-lg.webp' }
  },
];

/* ═══════════════════════════════════════════════════════════
   ROTATING TAGLINE — sub-claim che ruota con animazione
   ═══════════════════════════════════════════════════════════ */

const ROTATE_KEYS = [
  'landing.hero.tagline.rotate1',
  'landing.hero.tagline.rotate2',
  'landing.hero.tagline.rotate3',
  'landing.hero.tagline.rotate4',
] as const;

/** Lettere in entrata/uscita con flip 3D scaglionato lettera per lettera (orchestrazione via variants). */
const TAGLINE_CONTAINER_VARIANTS = {
  hidden: {},
  show: { transition: { staggerChildren: 0.018, delayChildren: 0.02 } },
  exit: { transition: { staggerChildren: 0.01, staggerDirection: -1 } },
};

const TAGLINE_LETTER_VARIANTS = {
  hidden: { opacity: 0, y: 8, rotateX: -80, filter: 'blur(3px)' },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    rotateX: 80,
    filter: 'blur(3px)',
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] as const },
  },
};

/** Colore finale + glow di riposo + "flare" (bagliore intenso al momento
 * dell'accensione) per ogni parola. Ogni lettera entra come brace incandescente
 * (HOT_CORE) e "raffredda" verso il colore finale → effetto fuoco/ember.
 * Palette condivisa con il ventaglio hero (LANDING_ROTATION_COLORS): stesso
 * ordine — Vendi, Aste, Scambi, Tornei, BRX — così la parola e la card attiva
 * si accendono sempre con lo stesso colore. */
const HOT_CORE = '#FFF1CC'; // bianco-caldo della brace all'accensione

const WORD_STYLES = LANDING_ROTATION_COLORS.map((c) => ({
  color: c.hex,
  light: c.light, // stessa tinta, più chiara — per la tagline abbinata
  glow: c.glow,
  flare: c.flare,
  caret: c.hex,
}));

function DynamicTaglineHeader() {
  const { t } = useTranslation();

  // Unify the word index
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Track the phrase index (0 or 1) for each delle 5 parole
  const [phraseOffsets, setPhraseOffsets] = useState<number[]>([0, 0, 0, 0, 0]);

  // Ordine allineato al ventaglio hero (Vendi, Aste, Scambi, Tornei, BRX) — stesso indice, stesso colore.
  const words = useMemo(() => [
    t('landing.hero.tagline.typewriter.1'), // Vendi
    t('landing.hero.tagline.typewriter.3'), // Metti all'Asta — Aste
    t('landing.hero.tagline.typewriter.2'), // Scambia — Scambi
    t('landing.hero.tagline.typewriter.4'), // Gioca i tornei — Tornei
    t('landing.hero.tagline.typewriter.5'), // Spedisci — BRX
  ], [t]);

  const subPhrases = useMemo(() => [
    [
      t('landing.hero.tagline.typewriter.1.phrase.1'),
      t('landing.hero.tagline.typewriter.1.phrase.2')
    ],
    [
      t('landing.hero.tagline.typewriter.3.phrase.1'),
      t('landing.hero.tagline.typewriter.3.phrase.2')
    ],
    [
      t('landing.hero.tagline.typewriter.2.phrase.1'),
      t('landing.hero.tagline.typewriter.2.phrase.2')
    ],
    [
      t('landing.hero.tagline.typewriter.4.phrase.1'),
      t('landing.hero.tagline.typewriter.4.phrase.2')
    ],
    [
      t('landing.hero.tagline.typewriter.5.phrase.1'),
      t('landing.hero.tagline.typewriter.5.phrase.2')
    ],
  ], [t]);

  // Timer for typewriter — il ciclo completo (scrittura + pausa + cancellazione) dura
  // sempre esattamente LANDING_ROTATION_MS, qualunque sia la lunghezza della parola,
  // così il cambio di parola resta a tempo con il ventaglio di carte nella hero.
  useEffect(() => {
    const fullWord = words[currentWordIdx];
    if (!fullWord) return;

    const wordLen = Math.max(fullWord.length, 1);
    const typeMs = (LANDING_ROTATION_MS * 0.4) / wordLen;
    const deleteMs = (LANDING_ROTATION_MS * 0.25) / wordLen;
    const pauseMs = LANDING_ROTATION_MS * 0.35;
    const speed = isDeleting ? deleteMs : typeMs;

    if (!isDeleting && currentText === fullWord) {
      const timeout = setTimeout(() => setIsDeleting(true), pauseMs);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && currentText === '') {
      setIsDeleting(false);
      setCurrentWordIdx((prev) => {
        const nextIdx = (prev + 1) % words.length;
        // Toggle the phrase offset for the word we just finished
        setPhraseOffsets((prevOffsets) => {
          const nextOffsets = [...prevOffsets];
          nextOffsets[prev] = nextOffsets[prev] === 0 ? 1 : 0;
          return nextOffsets;
        });
        return nextIdx;
      });
      return;
    }

    const timeout = setTimeout(() => {
      setCurrentText((prev) =>
        isDeleting ? prev.slice(0, -1) : fullWord.slice(0, prev.length + 1)
      );
    }, speed);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIdx, words]);

  const activeStyle = WORD_STYLES[currentWordIdx] || WORD_STYLES[0];
  const activePhrases = subPhrases[currentWordIdx] || subPhrases[0];
  const subPhraseIdx = phraseOffsets[currentWordIdx] || 0;
  const displayPhrase = activePhrases[subPhraseIdx];
  const letters = useMemo(() => Array.from(displayPhrase || ''), [displayPhrase]);

  return (
    <h1 className="text-center leading-tight sm:max-w-xl sm:text-left md:max-w-2xl flex flex-col py-1 sm:py-1.5 sm:pl-1">
      {/* Element A: Typewriter Word */}
      <span className="block text-xl font-extrabold uppercase tracking-tight text-white sm:text-2xl md:text-3xl lg:text-4xl min-h-[1.75em] sm:min-h-[1.5em] select-none text-center sm:text-left">
        <span className="inline-flex flex-wrap justify-center sm:justify-start">
          {currentText.split('').map((char, i) => (
            <motion.span
              key={i}
              initial={{
                opacity: 0,
                y: 14,
                scale: 0.72,
                color: HOT_CORE,
                filter: `blur(6px) drop-shadow(0 0 22px ${activeStyle.flare})`,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                color: activeStyle.color,
                filter: `blur(0px) drop-shadow(0 0 9px ${activeStyle.glow})`,
              }}
              className="inline-block"
              style={{
                whiteSpace: char === ' ' ? 'pre' : 'normal',
                transformOrigin: 'center bottom',
                willChange: 'transform, filter',
              }}
              transition={{
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
                color: { duration: 0.6, ease: 'easeOut' },
                filter: { duration: 0.45, ease: 'easeOut' },
              }}
            >
              {char}
            </motion.span>
          ))}
        </span>
        <span
          className="animate-pulse ml-0.5 font-normal select-none"
          style={{ color: activeStyle.caret, textShadow: `0 0 10px ${activeStyle.glow}, 0 0 20px ${activeStyle.flare}` }}
        >
          |
        </span>
      </span>

      {/* Element B: Fixed Statement */}
      <span className="mt-1 block text-sm font-semibold normal-case tracking-normal text-white/80 sm:text-base md:text-lg text-center sm:text-left">
        {t('landing.hero.tagline.statement')}
      </span>

      {/* Element C: Coordinated Rotating Tagline (staggered 3D letter flip).
          Colore abbinato alla parola sopra (WORD_STYLES) ma più chiaro, per
          segnalare visivamente che le due righe sono collegate. */}
      <span
        className="relative mt-2 block min-h-[1.9rem] leading-snug text-center text-sm font-semibold uppercase tracking-[0.06em] transition-colors duration-500 sm:min-h-[2.2rem] sm:text-left sm:text-base md:min-h-[2.6rem] md:text-lg whitespace-nowrap"
        style={{ color: activeStyle.light }}
      >
        <span className="absolute inset-x-0 top-0">
          <AnimatePresence mode="wait">
            <motion.span
              key={`${currentWordIdx}-${subPhraseIdx}`}
              variants={TAGLINE_CONTAINER_VARIANTS}
              initial="hidden"
              animate="show"
              exit="exit"
              style={{ perspective: 500 }}
              className="inline-block"
            >
              {letters.map((letter, i) => (
                <motion.span
                  key={i}
                  variants={TAGLINE_LETTER_VARIANTS}
                  className="inline-block"
                  style={{ transformOrigin: 'center bottom', whiteSpace: letter === ' ' ? 'pre' : 'normal' }}
                >
                  {letter}
                </motion.span>
              ))}
            </motion.span>
          </AnimatePresence>
        </span>
      </span>
    </h1>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function LandingWelcome() {
  const { t } = useTranslation();
  const intlLocale = useIntlLocale();
  const { setSelectedGame } = useGame();

  /* ─── state ─── */
  const [notifyGame, setNotifyGame] = useState<{ src: string; alt: string; waitlistCount: number } | null>(null);
  const [fullscreenGame, setFullscreenGame] = useState<{ src: string; alt: string; bgImage: string; waitlistCount: number } | null>(null);
  const [isFullscreenClosing, setIsFullscreenClosing] = useState(false);
  const [email, setEmail] = useState('');
  const [isNotifySuccess, setIsNotifySuccess] = useState(false);
  const [waitlistCounts, setWaitlistCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(getComingSoonGames().map((g) => [g.alt, g.waitlistCount]))
  );

  /* ─── handlers ─── */
  const schedule = useTimeouts();

  const handleCloseFullscreen = useCallback(() => {
    setIsFullscreenClosing(true);
    schedule(() => {
      setFullscreenGame(null);
      setIsFullscreenClosing(false);
      setIsNotifySuccess(false);
      setEmail('');
    }, 400);
  }, [schedule]);

  const handleNotifySubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    schedule(() => {
      setIsNotifySuccess(true);
      if (notifyGame) {
        setWaitlistCounts((prev) => ({
          ...prev,
          [notifyGame.alt]: (prev[notifyGame.alt] ?? notifyGame.waitlistCount) + 1,
        }));
      }
      schedule(() => {
        setNotifyGame(null);
        setIsNotifySuccess(false);
        setEmail('');
      }, 2000);
    }, 800);
  }, [email, notifyGame, schedule]);

  const handleFullscreenNotifySubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    schedule(() => {
      setIsNotifySuccess(true);
      if (fullscreenGame) {
        setWaitlistCounts((prev) => ({
          ...prev,
          [fullscreenGame.alt]: (prev[fullscreenGame.alt] ?? fullscreenGame.waitlistCount) + 1,
        }));
      }
      schedule(() => {
        handleCloseFullscreen();
      }, 2000);
    }, 800);
  }, [email, handleCloseFullscreen, fullscreenGame, schedule]);

  /* ─── memoised data ─── */
  const FEATURES = useMemo(
    () => [
      { iconKey: 'prezzi' as const, title: t('landing.feat.prezzi.title'), description: t('landing.feat.prezzi.desc') },
      { iconKey: 'sicuro' as const, title: t('landing.feat.sicuro.title'), description: t('landing.feat.sicuro.desc') },
      { iconKey: 'gestione' as const, title: t('landing.feat.gestione.title'), description: t('landing.feat.gestione.desc') },
      { iconKey: 'domanda' as const, title: t('landing.feat.domanda.title'), description: t('landing.feat.domanda.desc') },
      { iconKey: 'vendite' as const, title: t('landing.feat.vendite.title'), description: t('landing.feat.vendite.desc') },
      { iconKey: 'commissioni' as const, title: t('landing.feat.commissioni.title'), description: t('landing.feat.commissioni.desc') },
    ],
    [t]
  );

  const MAIN_GAMES = getMainGames();
  const COMING_SOON_GAMES = getComingSoonGames();

  /* ─── render ─── */
  return (
    <div className="relative w-full overflow-x-hidden text-white bg-[#0F172A]">

      <LandingBackgroundVideo />

      {/* ══════ CONTENT LAYER ══════ */}
      <div className="relative z-[2] flex flex-col">

        {/* ────── LOGO + TAGLINE — same row ────── */}
        <header className="bento-entry flex items-center justify-center px-4 pt-12 pb-10 sm:pt-14 sm:pb-12 md:pt-14 md:pb-11" style={{ animationDelay: '0ms' }}>
          <div className="flex w-full max-w-6xl flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6 md:gap-7">
            <Image
              src={getCdnImageUrl('Logo%20Principale%20EBARTEX.png')}
              alt="Ebartex"
              width={700}
              height={263}
              className="h-[4.25rem] w-auto shrink-0 object-contain sm:h-24 md:h-[7.5rem] lg:h-[8.5rem]"
              sizes="(max-width: 640px) 170px, (max-width: 1024px) 240px, 340px"
              priority
              unoptimized
            />
            <div className="flex items-center gap-4 sm:gap-6 md:gap-7">
              <div className="h-14 w-px bg-white/20 hidden sm:block md:h-20" />
              <DynamicTaglineHeader />
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════
            HERO — Card Magic (left) + Feature Carousel (right)
            ═══════════════════════════════════════════════ */}
        <section className="px-4 pt-4 pb-8 sm:px-5 sm:pt-5 sm:pb-10 md:px-6 md:pt-4 md:pb-8">
          <div className="mx-auto grid w-full max-w-6xl gap-5 sm:gap-6 md:gap-5 grid-cols-1 lg:grid-cols-2">

            {/* ──── LEFT: MAGIC CARD ──── */}
            <div
              className="bento-entry group relative flex flex-col min-h-[180px] sm:min-h-[200px] md:min-h-[220px] lg:min-h-[260px] rounded-2xl border border-white/10 bg-[#0F172A]/50 backdrop-blur-md overflow-hidden"
              style={{ animationDelay: '180ms' }}
            >
              <Link
                href="/home/magic"
                id="hero-magic-card"
                className="relative flex flex-col flex-1 rounded-2xl p-5 sm:p-6 md:p-7 lg:p-8 transition-all duration-500 hover:bg-white/[0.03]"
                aria-label={t('landing.gameAria.goHome', { name: 'Magic The Gathering' })}
                onClick={() => setSelectedGame('mtg')}
              >
                {/* Badge "Disponibile subito" — centered pill */}
                <span className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-white">
                  Disponibile subito!
                </span>

                {/* Top row: Text + Logo */}
                <div className="flex flex-1 items-center justify-between gap-4">
                  <div className="flex flex-col gap-1 sm:gap-1.5">
                    <h2 className="font-display text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold uppercase tracking-tight text-white drop-shadow-lg">
                      Magic: The Gathering
                    </h2>
                    <p className="max-w-md text-[11px] sm:text-xs md:text-sm text-white/50">
                      Compra, vendi e metti all&apos;asta le tue carte. Inizia subito.
                    </p>
                  </div>

                  <div className="relative flex shrink-0 items-center justify-center">
                    <div className="relative h-20 w-36 sm:h-24 sm:w-44 md:h-28 md:w-52 lg:h-36 lg:w-64 transition-transform duration-500 group-hover:scale-105">
                      <Image
                        src={MAIN_GAMES[0].src}
                        alt={MAIN_GAMES[0].alt}
                        fill
                        sizes="(max-width: 640px) 144px, (max-width: 768px) 176px, (max-width: 1024px) 208px, 256px"
                        className="object-contain drop-shadow-[0_0_16px_rgba(239,68,68,0.15)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom: Coming soon games */}
                <div className="mt-auto pt-3 border-t border-white/10">
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 text-center">
                    Presto in arrivo
                  </p>
                  <div className="grid grid-cols-6 gap-2">
                    {COMING_SOON_GAMES.map((game) => (
                      <button
                        key={game.alt}
                        type="button"
                        aria-label={game.alt}
                        className="group/game relative flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg overflow-hidden bg-white/10 border border-white/15 px-1 py-1.5 transition-all duration-300 hover:bg-white/15 hover:border-white/25 hover:scale-105"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const bgImage = GAME_FULLSCREEN_IMAGES[game.alt];
                          const count = waitlistCounts[game.alt] ?? game.waitlistCount;
                          if (bgImage) {
                            setFullscreenGame({ src: game.src, alt: game.alt, bgImage, waitlistCount: count });
                          } else {
                            setNotifyGame({ src: game.src, alt: game.alt, waitlistCount: count });
                          }
                        }}
                      >
                        {/* Sfondo gradiente sui colori del brand del gioco */}
                        <span
                          aria-hidden
                          className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70 transition-opacity duration-300 group-hover/game:opacity-100 ${GAME_GRADIENTS[game.alt] ?? ''}`}
                        />
                        <div className="relative z-10 flex flex-1 min-h-0 w-full items-center justify-center">
                          <div className="relative h-full max-h-[52%] w-full max-w-[58%]">
                            <Image
                              src={game.src}
                              alt=""
                              fill
                              sizes="(max-width: 640px) 18vw, 100px"
                              className="object-contain"
                            />
                          </div>
                        </div>
                        <span className="relative z-10 shrink-0 text-center text-[8px] font-medium leading-tight text-white/80 sm:text-[9px]">
                          {game.label}
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      aria-label={`+${EXTRA_COMING_SOON_GAMES_COUNT} altri giochi in arrivo`}
                      className="group/game relative flex aspect-square w-full flex-col items-center justify-center gap-0.5 rounded-lg overflow-hidden bg-white/5 border border-dashed border-white/20 px-1 py-1.5 transition-all duration-300 hover:bg-white/10 hover:border-white/30 hover:scale-105"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <span className="relative z-10 text-sm font-extrabold text-white/90 sm:text-base">
                        +{EXTRA_COMING_SOON_GAMES_COUNT}
                      </span>
                      <span className="relative z-10 shrink-0 text-center text-[8px] font-medium leading-tight text-white/50 sm:text-[9px]">
                        altri giochi
                      </span>
                    </button>
                  </div>
                </div>
              </Link>
            </div>

            {/* ──── RIGHT: VENTAGLIO DI CARTE (4 feature brandizzate) ──── */}
            <LandingHeroCardFan />

          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            FEATURES + BOUTIQUE (below the fold) — video shows through
            ═══════════════════════════════════════════════ */}
        <section className="relative w-full overflow-hidden px-4 pt-12 pb-12 sm:px-5 sm:pt-14 sm:pb-14 md:pt-12 md:pb-10 z-[2]">
          <div className="relative z-10 mx-auto max-w-4xl">

            {/* ─── KPI / Features grid ─── */}
            <div className="mb-5 sm:mb-6 md:mb-7" aria-labelledby="landing-features-heading">
              <div className="mb-3 sm:mb-4 md:mb-6 text-center">
                <h2
                  id="landing-features-heading"
                  className="text-sm font-normal leading-tight tracking-wide text-white sm:text-base md:text-lg lg:text-xl"
                >
                  {t('landing.feat.sectionTitle')}
                </h2>
              </div>

              <div className="grid w-full grid-cols-2 md:grid-cols-3 gap-x-4 sm:gap-x-5 md:gap-x-6 gap-y-6 sm:gap-y-7 md:gap-y-8">
                {FEATURES.map((f) => {
                  const IconComponent = FEATURE_ICONS[f.iconKey];
                  return (
                    <div key={f.title} className="flex flex-col items-center text-center">
                      <div className="mb-1.5 sm:mb-2 flex shrink-0 items-center justify-center">
                        {IconComponent ? <IconComponent className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#FF7300]" strokeWidth={1.5} /> : null}
                      </div>
                      <h3 className="text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase leading-tight tracking-[0.06em] text-white mb-0.5 sm:mb-1">
                        {f.title}
                      </h3>
                      <p className="hidden md:block text-[10px] sm:text-[11px] leading-relaxed text-white/70">
                        {f.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-auto my-8 sm:my-10 md:my-10 h-px w-2/3 max-w-lg bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            {/* ─── Boutique Cards ─── */}
            <div className="mt-10 sm:mt-12 md:mt-14 text-center">
              <h3 className="mb-5 sm:mb-6 md:mb-8 text-xs sm:text-sm md:text-base font-semibold uppercase tracking-widest text-white/90">
                <Link
                  href="/products/boutique"
                  className="transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  La Nostra Boutique
                </Link>
              </h3>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-4 md:gap-5 max-w-5xl mx-auto px-2 sm:px-3">
                {BOUTIQUE_CATEGORIES.map((cat, index) => {
                  const glowColor = BOUTIQUE_GLOW_COLORS[cat.id] || '255,255,255';
                  return (
                    <Link
                      key={cat.id}
                      href={cat.href}
                      className="group relative aspect-square overflow-hidden rounded-full border border-white/10 transition-all duration-300 hover:border-white/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
                      style={{ animation: `categoryEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 120}ms both` }}
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{
                          backgroundImage: `image-set(
                            url(${cat.imageSet?.sm || cat.imageUrl}) 1x,
                            url(${cat.imageSet?.md || cat.imageUrl}) 2x,
                            url(${cat.imageSet?.lg || cat.imageUrl}) 3x
                          )`,
                        }}
                        aria-hidden
                      />
                      <div className="absolute inset-0 bg-black/40 transition-all duration-300 group-hover:bg-black/10 group-hover:backdrop-blur-[2px]" aria-hidden />
                      <span
                        className="absolute inset-0 flex items-center justify-center text-center px-1 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-white drop-shadow-lg transition-all duration-300 group-hover:scale-110"
                        style={{
                          ['--glow-color' as string]: glowColor,
                          textShadow: '0 2px 12px rgba(0,0,0,0.45)',
                        }}
                      >
                        <span className="transition-all duration-300 group-hover:[text-shadow:0_0_20px_rgba(var(--glow-color),0.9),0_0_40px_rgba(var(--glow-color),0.6),0_2px_12px_rgba(0,0,0,0.45)]">
                          {cat.label}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

          </div>

          <div className="relative z-10 mx-auto max-w-4xl">
            {/* ─── Signed & Altered Collections Showcase ─── */}
            <div className="mt-12 sm:mt-14 md:mt-16">
              <SignedAlteredShowcase />
            </div>
          </div>
        </section>

        {/* ─── Transition zone before footer ─── */}
        <div className="relative z-[2] w-full h-20 sm:h-28 bg-gradient-to-b from-transparent via-[#0F172A]/80 to-[#1D3160]" />

      </div>

      {/* ══════ MODAL: Notify (small glass) ══════ */}
      {notifyGame && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/40 animate-in fade-in duration-300">
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-[32px] border border-white/25 bg-white/10 p-8 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-300"
            style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.05)' }}
          >
            <button
              onClick={() => setNotifyGame(null)}
              className="absolute right-6 top-6 rounded-full bg-white/5 p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {!isNotifySuccess ? (
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FF7300]/20 text-[#FF7300] shadow-[0_0_20px_rgba(255,115,0,0.2)]">
                  <Image src={notifyGame.src} alt="" width={40} height={40} className="object-contain" />
                </div>

                <div className="mb-3 flex items-center gap-2 rounded-full bg-[#FF7300]/90 px-4 py-2 text-white shadow-lg">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-semibold">{notifyGame.waitlistCount.toLocaleString(intlLocale)} in lista d&apos;attesa</span>
                </div>

                <h3 className="mb-3 text-lg font-bold uppercase tracking-tight text-white sm:text-xl">
                  Ti interessa {notifyGame.alt}?
                </h3>

                <p className="mb-8 text-sm leading-relaxed text-white/70">
                  Siamo quasi pronti! Inserisci la tua email e ti avviseremo appena il gioco sarà disponibile sul marketplace.
                </p>

                <form onSubmit={handleNotifySubmit} className="w-full space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-[#FF7300]" />
                    <input
                      type="email"
                      required
                      placeholder="La tua email..."
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-[#FF7300]/50 focus:bg-white/10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-[#FF7300] py-4 text-sm font-bold uppercase tracking-widest text-white shadow-[0_4px_20px_rgba(255,115,0,0.4)] transition-all hover:bg-[#e66700] hover:shadow-[0_6px_28px_rgba(255,115,0,0.5)] active:scale-95"
                  >
                    AVVISAMI
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-center animate-in zoom-in-95 duration-500">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-green-500">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">GRAZIE!</h3>
                <p className="text-sm text-white/70">
                  Abbiamo registrato la tua email. <br/>A presto!
                </p>
                <p className="mt-4 text-sm text-white/60">
                  Ora ci sono <span className="text-[#FF7300] font-bold">{(notifyGame.waitlistCount + 1).toLocaleString(intlLocale)}</span> utenti in lista!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════ FULLSCREEN GAME PAGE ══════ */}
      {fullscreenGame && (
        <div
          className={`fixed inset-0 z-[9999] flex flex-col ${isFullscreenClosing ? 'animate-landing-exit' : ''}`}
          style={{ willChange: 'opacity' }}
        >
          <div
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat ${isFullscreenClosing ? 'animate-landing-bg-exit' : 'animate-landing-bg'}`}
            style={{ backgroundImage: `url(${fullscreenGame.bgImage})`, willChange: 'transform, opacity' }}
          />
          <div
            className={`absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 ${isFullscreenClosing ? 'animate-landing-fade-exit' : 'animate-landing-fade'}`}
            style={{ willChange: 'opacity' }}
          />

          {/* Back button */}
          <button
            type="button"
            onClick={handleCloseFullscreen}
            className={`absolute left-6 top-6 z-50 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-white/80 transition-all duration-300 hover:bg-white/20 hover:text-white backdrop-blur-md border border-white/20 ${isFullscreenClosing ? 'animate-landing-slide-up-exit' : 'animate-landing-slide-down'}`}
            style={{ willChange: 'transform, opacity' }}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Torna indietro</span>
          </button>

          {/* Social proof */}
          <div
            className={`absolute right-6 top-6 z-10 flex items-center gap-2 rounded-full bg-[#FF7300]/90 px-4 py-2 text-white shadow-lg ${isFullscreenClosing ? 'animate-landing-slide-up-exit' : 'animate-landing-slide-down'}`}
            style={{ willChange: 'transform, opacity', animationDelay: isFullscreenClosing ? '0ms' : '100ms' }}
          >
            <Users className="h-4 w-4" />
            <span className="text-sm font-semibold">{fullscreenGame.waitlistCount.toLocaleString(intlLocale)} in lista d&apos;attesa</span>
          </div>

          {/* Content area */}
          <div className="relative z-10 flex flex-1 items-center justify-center p-4" style={{ willChange: 'opacity' }}>
            {!isNotifySuccess ? (
              <div
                className={`w-full max-w-md text-center ${isFullscreenClosing ? 'animate-landing-content-down-exit' : 'animate-landing-content-up'}`}
                style={{ willChange: 'transform, opacity' }}
              >
                <h2
                  className={`mb-4 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl ${isFullscreenClosing ? 'animate-landing-fade-exit' : 'animate-landing-fade-in'}`}
                  style={{ willChange: 'opacity', animationDelay: isFullscreenClosing ? '0ms' : '150ms' }}
                >
                  Ti interessa<br/>{fullscreenGame.alt}?
                </h2>
                <p
                  className={`mb-8 text-base text-white/80 ${isFullscreenClosing ? 'animate-landing-fade-exit' : 'animate-landing-fade-in'}`}
                  style={{ willChange: 'opacity', animationDelay: isFullscreenClosing ? '50ms' : '250ms' }}
                >
                  Siamo quasi pronti! Inserisci la tua email e ti avviseremo appena il gioco sarà disponibile sul marketplace.
                </p>
                <form
                  onSubmit={handleFullscreenNotifySubmit}
                  className={`space-y-4 ${isFullscreenClosing ? 'animate-landing-fade-exit' : 'animate-landing-fade-in'}`}
                  style={{ willChange: 'opacity', animationDelay: isFullscreenClosing ? '100ms' : '350ms' }}
                >
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-white/50" />
                    <input
                      type="email"
                      required
                      placeholder="La tua email..."
                      className="relative w-full rounded-xl border border-white/20 bg-white/10 py-4 pl-12 pr-4 text-white placeholder:text-white/40 outline-none backdrop-blur-md transition-all focus:border-[#FF7300] focus:bg-white/15"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="group relative w-full overflow-hidden rounded-xl border border-white/30 bg-white/10 py-4 text-sm font-bold uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-[1.02] active:scale-95"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <BellRing className="h-4 w-4" />
                      AVVISAMI
                    </span>
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center" style={{ willChange: 'transform, opacity' }}>
                <div
                  className={`mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500/20 text-green-400 mx-auto ${isFullscreenClosing ? 'animate-landing-scale-down-exit' : 'animate-landing-success-bounce'}`}
                  style={{ willChange: 'transform' }}
                >
                  <CheckCircle2 className="h-14 w-14" />
                </div>
                <h3 className={`mb-2 text-3xl font-black text-white ${isFullscreenClosing ? 'animate-landing-fade-exit' : 'animate-landing-fade-in'}`}>GRAZIE!</h3>
                <p className={`text-lg text-white/80 ${isFullscreenClosing ? 'animate-landing-fade-exit' : 'animate-landing-fade-in'}`} style={{ animationDelay: isFullscreenClosing ? '0ms' : '100ms' }}>
                  Abbiamo registrato la tua email.<br/>A presto!
                </p>
                <p className={`mt-4 text-sm text-white/60 ${isFullscreenClosing ? 'animate-landing-fade-exit' : 'animate-landing-fade-in'}`} style={{ animationDelay: isFullscreenClosing ? '50ms' : '200ms' }}>
                  Ora ci sono <span className="text-[#FF7300] font-bold">{(fullscreenGame.waitlistCount + 1).toLocaleString(intlLocale)}</span> utenti in lista!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline keyframes for boutique entry + hero gradient headline */}
      <style>{`
        @keyframes categoryEnter {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          60% {
            opacity: 0.8;
            transform: translateY(-5px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .hero-gradient-text {
          background-image: linear-gradient(90deg, #FF7300, #FFC24B, #FF7300, #FF9A3D, #FF7300);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: heroGradientShift 5s linear infinite;
        }
        @keyframes heroGradientShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-gradient-text {
            animation: none;
            background-position: 0% 50%;
          }
        }
      `}</style>

    </div>
  );
}
