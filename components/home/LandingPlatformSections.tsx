'use client';

import Link from 'next/link';
import {
  Gavel,
  Search,
  HandCoins,
  PackageCheck,
  ArrowLeftRight,
  MessageSquare,
  ShieldCheck,
  Repeat,
  Trophy,
  Video,
  Users,
  Medal,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import {
  cardHover,
  cardHoverReduced,
  fadeFromLeft,
  fadeFromRight,
  fadeUp,
  fadeUpEmphasis,
  glowPulse,
  iconSpring,
  introStagger,
  motionVariants,
  MotionSection,
  staggerContainer,
  staggerFromLeft,
  staggerFromRight,
  staggerItem,
  useReducedMotion,
  VIEWPORT_CARDS,
  VIEWPORT_DEFAULT,
  VIEWPORT_SECTION,
} from './landingMotion';

type Accent = 'orange' | 'emerald' | 'violet';

type Step = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type PlatformSectionConfig = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  steps: Step[];
  cta: string;
  href: string;
  accent: Accent;
};

const ACCENT_STYLES: Record<
  Accent,
  {
    kicker: string;
    glow: string;
    iconBg: string;
    iconText: string;
    ctaBorder: string;
    ctaBg: string;
    ctaText: string;
    cardHover: string;
    glowRgb: string;
  }
> = {
  orange: {
    kicker: 'border-orange-400/40 bg-orange-500/15 text-orange-300',
    glow: 'from-orange-500/20 via-transparent to-transparent',
    iconBg: 'bg-orange-500/20',
    iconText: 'text-orange-400',
    ctaBorder: 'border-orange-400/50',
    ctaBg: 'bg-orange-500/20 hover:bg-orange-500/30',
    ctaText: 'text-orange-300',
    cardHover: 'hover:border-orange-400/35 hover:shadow-[0_12px_40px_rgba(251,146,60,0.12)]',
    glowRgb: '251, 146, 60',
  },
  emerald: {
    kicker: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300',
    glow: 'from-emerald-500/20 via-transparent to-transparent',
    iconBg: 'bg-emerald-500/20',
    iconText: 'text-emerald-400',
    ctaBorder: 'border-emerald-400/50',
    ctaBg: 'bg-emerald-500/20 hover:bg-emerald-500/30',
    ctaText: 'text-emerald-300',
    cardHover: 'hover:border-emerald-400/35 hover:shadow-[0_12px_40px_rgba(52,211,153,0.12)]',
    glowRgb: '52, 211, 153',
  },
  violet: {
    kicker: 'border-violet-400/40 bg-violet-500/15 text-violet-300',
    glow: 'from-violet-500/20 via-transparent to-transparent',
    iconBg: 'bg-violet-500/20',
    iconText: 'text-violet-400',
    ctaBorder: 'border-violet-400/50',
    ctaBg: 'bg-violet-500/20 hover:bg-violet-500/30',
    ctaText: 'text-violet-300',
    cardHover: 'hover:border-violet-400/35 hover:shadow-[0_12px_40px_rgba(167,139,250,0.12)]',
    glowRgb: '167, 139, 250',
  },
};

const SECTIONS: PlatformSectionConfig[] = [
  {
    id: 'landing-aste',
    eyebrow: 'Aste',
    title: 'Come funzionano le aste',
    subtitle:
      "Dal primo sguardo all'aggiudicazione: un flusso pensato per collezionisti che vogliono prezzi di mercato, offerte in tempo reale e massima trasparenza.",
    steps: [
      {
        icon: Search,
        title: 'Sfoglia e filtra',
        description:
          'Cerca per gioco, rarità, condizione e prezzo. Salva le aste che ti interessano e ricevi aggiornamenti.',
      },
      {
        icon: HandCoins,
        title: 'Fai la tua offerta',
        description: 'Punta in tempo reale con incrementi chiari. Il sistema ti avvisa se vieni superato.',
      },
      {
        icon: Gavel,
        title: "Vinci l'asta",
        description:
          "Alla scadenza, l'offerta più alta si aggiudica la carta. Pagamento e conferma guidati sulla piattaforma.",
      },
      {
        icon: PackageCheck,
        title: 'Ricevi in sicurezza',
        description:
          'Spedizione tracciata e protezione acquirente. Venditori verificati e recensioni della community.',
      },
    ],
    cta: 'Vai alle aste',
    href: '/aste',
    accent: 'orange',
  },
  {
    id: 'landing-scambi',
    eyebrow: 'Scambi',
    title: 'Scambia carte in modo smart',
    subtitle:
      'Completa il binder, muovi doppioni o ottieni la carta mancante senza passare dal contante: scambi peer-to-peer con regole chiare.',
    steps: [
      {
        icon: ArrowLeftRight,
        title: 'Proponi uno scambio',
        description:
          'Seleziona le carte che offri e quelle che cerchi. Pubblica la proposta o rispondi a quelle degli altri.',
      },
      {
        icon: MessageSquare,
        title: 'Negozia in chat',
        description:
          "Allinea valori, condizioni e quantità direttamente con l'altro utente prima di confermare.",
      },
      {
        icon: ShieldCheck,
        title: 'Chiudi in sicurezza',
        description: 'Accordo tracciato sulla piattaforma, con storico e reputazione per ridurre i rischi.',
      },
      {
        icon: Repeat,
        title: 'Spedisci e completa',
        description: 'Invia le carte, conferma la ricezione e valuta l\'esperienza. Collezione sempre in movimento.',
      },
    ],
    cta: 'Esplora gli scambi',
    href: '/scambi',
    accent: 'emerald',
  },
  {
    id: 'landing-tornei',
    eyebrow: 'Tornei live',
    title: 'Tornei ufficiali, dal divano al tabellone',
    subtitle:
      'Partecipa a eventi settimanali con verifica webcam, pairing live e montepremi. Gioca, scala le classifiche e segui i match in diretta.',
    steps: [
      {
        icon: Trophy,
        title: 'Scegli il torneo',
        description:
          'Formati Standard, Modern, Commander e altri. Iscrizione rapida con decklist e regole anti-cheat.',
      },
      {
        icon: Video,
        title: 'Verifica e gioca live',
        description:
          "Webcam per l'identità, match center con pairing in tempo reale e supporto giudici verificati.",
      },
      {
        icon: Users,
        title: 'Segui il tabellone',
        description:
          'Round Swiss, top cut e classifiche aggiornate. Spettatori e streaming integrati per la community.',
      },
      {
        icon: Medal,
        title: 'Vinci premi',
        description:
          'Montepremi in denaro o crediti, badge profilo e visibilità tra i migliori giocatori Ebartex.',
      },
    ],
    cta: 'Vai ai tornei live',
    href: '/tornei-live',
    accent: 'violet',
  },
];

/** Text block enters from the side opposite the card grid */
function textBlockVariants(reverse: boolean, accent: Accent, reduced: boolean): Variants {
  if (reduced) return fadeUp;
  if (accent === 'violet') return fadeUpEmphasis;
  return reverse ? fadeFromRight : fadeFromLeft;
}

/** Card grid slides in from the opposite side, then staggers children */
function cardsBlockVariants(reverse: boolean, reduced: boolean): Variants {
  if (reduced) return staggerContainer;
  return reverse ? staggerFromLeft : staggerFromRight;
}

type PlatformSectionBlockProps = {
  config: PlatformSectionConfig;
  reverse?: boolean;
  sectionIndex: number;
};

function PlatformSectionBlock({ config, reverse, sectionIndex }: PlatformSectionBlockProps) {
  const reduced = useReducedMotion();
  const styles = ACCENT_STYLES[config.accent];
  const textVariants = motionVariants(textBlockVariants(!!reverse, config.accent, reduced), reduced);
  const cardsVariants = motionVariants(cardsBlockVariants(!!reverse, reduced), reduced);
  const hoverProps = reduced ? cardHoverReduced : cardHover;

  return (
    <MotionSection
      id={config.id}
      className="relative scroll-mt-24 py-10 sm:py-14 md:py-16"
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_SECTION}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.14, delayChildren: 0.06 } } }}
    >
      {/* Ambient glow — pulses on scroll into view */}
      <motion.div
        className={`pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br blur-3xl ${styles.glow}`}
        variants={reduced ? fadeUp : glowPulse}
        aria-hidden
      />

      {/* Accent rim on section enter */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0"
        initial={{ opacity: 0 }}
        whileInView={{
          opacity: [0, 0.15, 0.08],
          transition: reduced ? { duration: 0.2 } : { duration: 1.2, delay: sectionIndex * 0.05 },
        }}
        viewport={VIEWPORT_SECTION}
        style={{
          boxShadow: `inset 0 0 80px rgba(${styles.glowRgb}, 0.08)`,
        }}
        aria-hidden
      />

      <motion.div
        className={`relative grid gap-8 lg:gap-12 lg:items-center ${reverse ? 'lg:grid-cols-[1.1fr_0.9fr]' : 'lg:grid-cols-[0.9fr_1.1fr]'}`}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
      >
        {/* Copy column — eyebrow → title → subtitle → CTA stagger */}
        <motion.div
          className={reverse ? 'lg:order-2' : ''}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1, delayChildren: 0.04 } },
          }}
        >
          <motion.span
            variants={textVariants}
            custom={0}
            className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${styles.kicker}`}
          >
            {config.eyebrow}
          </motion.span>

          <motion.h2
            variants={textVariants}
            custom={0.06}
            className="font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl md:text-4xl"
          >
            {config.title}
          </motion.h2>

          <motion.p
            variants={textVariants}
            custom={0.12}
            className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base"
          >
            {config.subtitle}
          </motion.p>

          <motion.div variants={textVariants} custom={0.2}>
            <Link
              href={config.href}
              className={`group mt-6 inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${styles.ctaBorder} ${styles.ctaBg} ${styles.ctaText}`}
            >
              <motion.span
                className="inline-flex"
                whileHover={reduced ? undefined : { scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {config.cta}
              </motion.span>
              <motion.span className="inline-flex" whileHover={reduced ? undefined : { x: 5 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
                <ArrowRight className="h-4 w-4" />
              </motion.span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Step cards — staggered grid with glass hover */}
        <motion.div
          className={`grid gap-3 sm:grid-cols-2 sm:gap-4 ${reverse ? 'lg:order-1' : ''}`}
          variants={cardsVariants}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_CARDS}
        >
            {config.steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  variants={staggerItem}
                  whileHover={hoverProps}
                  className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md transition-[border-color,box-shadow] duration-300 sm:p-5 ${styles.cardHover}`}
                >
                  {/* Border glow on hover */}
                  <motion.div
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(ellipse at 30% 0%, rgba(${styles.glowRgb}, 0.12) 0%, transparent 70%)`,
                    }}
                    aria-hidden
                  />

                  <motion.div
                    className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${styles.iconBg}`}
                    whileHover={reduced ? undefined : iconSpring}
                  >
                    <Icon className={`h-5 w-5 ${styles.iconText}`} strokeWidth={1.75} />
                  </motion.div>

                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Passo {index + 1}
                  </span>
                  <h3 className="mt-1 text-sm font-bold text-white sm:text-base">{step.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/65 sm:text-sm">{step.description}</p>
                </motion.div>
              );
            })}
        </motion.div>
      </motion.div>
    </MotionSection>
  );
}

export function LandingPlatformSections() {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="relative mt-4 sm:mt-6"
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_DEFAULT}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
    >
      {/* Section intro — orchestrated stagger */}
      <motion.div
        className="mb-10 text-center sm:mb-12"
        variants={introStagger}
      >
        <motion.p
          variants={motionVariants(fadeUp, reduced)}
          custom={0}
          className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF7300]"
        >
          La piattaforma Ebartex
        </motion.p>
        <motion.h2
          variants={motionVariants(fadeUp, reduced)}
          custom={0.1}
          className="mt-2 text-lg font-semibold text-white sm:text-xl md:text-2xl"
        >
          Tutto ciò che puoi fare, in un solo posto
        </motion.h2>
        <motion.div
          variants={motionVariants(fadeUp, reduced)}
          custom={0.18}
          className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-transparent via-[#f97316]/60 to-transparent"
          aria-hidden
        />
      </motion.div>

      {SECTIONS.map((section, index) => (
        <PlatformSectionBlock key={section.id} config={section} reverse={index % 2 === 1} sectionIndex={index} />
      ))}
    </motion.div>
  );
}
