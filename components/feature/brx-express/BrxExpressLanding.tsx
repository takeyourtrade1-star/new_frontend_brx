'use client';

import {
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
} from 'framer-motion';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Zap, ArrowRight, FileText, LayoutGrid } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

import { BrxExpressLandingScene } from '@/components/feature/brx-express/landing/BrxExpressLandingScene';
import landingStyles from '@/components/feature/brx-express/landing/brx-express-landing.module.css';
import { useBrxExpressLandingPath } from '@/hooks/brx-express/useBrxExpressLandingPath';

const REVEALED_CARD_SURFACE =
  'bg-gradient-to-br from-slate-800/80 via-slate-900/75 to-orange-950/40 backdrop-blur-md shadow-[0_25px_70px_-20px_rgba(249,115,22,0.4)]';

export default function BrxExpressLanding() {
  const { t } = useTranslation();
  const {
    containerRef,
    heroStartRef,
    cardRefs,
    termsTextRef,
    pathD,
    glyphMarks,
    cardMarks,
    mounted,
  } = useBrxExpressLandingPath();

  const [revealed, setRevealed] = useState<boolean[]>([false, false, false, false]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const pathLength = useSpring(scrollYProgress, {
    stiffness: 64,
    damping: 30,
    restDelta: 0.0001,
  });

  const finaleOpacity = useTransform(pathLength, [0.9, 0.985], [0, 1]);

  const [finaleOn, setFinaleOn] = useState(false);
  useMotionValueEvent(pathLength, 'change', (v) => {
    if (v >= 0.98) setFinaleOn(true);
    setRevealed((prev) => {
      if (cardMarks.length === 0) return prev;
      let changed = false;
      const next = prev.map((r, i) => {
        const m = cardMarks[i];
        if (!m) return r;
        const nr = v >= m.end - 0.002 ? true : v < m.end - 0.014 ? false : r;
        if (nr !== r) changed = true;
        return nr;
      });
      return changed ? next : prev;
    });
  });

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-[#0F172A] text-slate-100 overflow-hidden font-sans pb-24"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />

      <BrxExpressLandingScene
        mounted={mounted}
        pathD={pathD}
        pathLength={pathLength}
        glyphMarks={glyphMarks}
        cardMarks={cardMarks}
        finaleOpacity={finaleOpacity}
        finaleOn={finaleOn}
        moonDisclaimer={t('brxExpress.moonDisclaimer')}
      />

      <section className="relative z-20 max-w-4xl mx-auto px-6 pt-28 pb-14 text-center">
        <div className="flex justify-center mb-5">
          <span
            ref={heroStartRef}
            className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 px-3 py-0.5 text-[10px] font-bold tracking-wider text-orange-400 uppercase"
          >
            <Zap className="h-3 w-3 text-orange-400" />
            {t('brxExpress.shippingBadge')}
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none text-white">
          BRX Express
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {t('brxExpress.heroDescription')}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button className="relative group overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-orange-500/20">
            <span className="relative z-10 flex items-center gap-1.5">
              {t('brxExpress.cta')}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </button>

          <Link
            href="/brx-express/catalogo"
            className="group inline-flex items-center gap-1.5 rounded-xl border border-orange-500/40 bg-white/5 px-5 py-3 text-xs font-bold text-orange-300 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-400/70 hover:text-orange-200"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            {t('brxExpress.catalogCta')}
          </Link>
        </div>
      </section>

      <section className="relative z-20 max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h2 className="text-2xl font-extrabold text-white tracking-tight sm:text-3xl">
            {t('brxExpress.howItWorksTitle')}
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto">
            {t('brxExpress.howItWorksSubtitle')}
          </p>
        </div>

        <div className="space-y-24 md:space-y-36">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex justify-start">
              <div
                ref={cardRefs[0]}
                className={`relative z-20 w-full max-w-[440px] p-8 md:p-10 text-slate-100 flex flex-col items-start justify-center min-h-[280px] border border-transparent transition-all duration-700 ${
                  revealed[0]
                    ? `${REVEALED_CARD_SURFACE} ${landingStyles.cardBirth}`
                    : 'bg-transparent shadow-none'
                }`}
                style={{
                  borderRadius: '52% 48% 68% 32% / 45% 42% 58% 55%',
                }}
              >
                <h3 className="text-xl font-bold text-white tracking-tight">{t('brxExpress.card1.title')}</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  {t('brxExpress.card1.description')}
                </p>
              </div>
            </div>
            <div className="hidden md:block" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="hidden md:block" />
            <div className="flex justify-end">
              <div
                ref={cardRefs[1]}
                className={`relative z-20 w-full max-w-[440px] p-8 md:p-10 rounded-2xl text-slate-100 flex flex-col items-start justify-center min-h-[280px] border border-transparent transition-all duration-700 ${
                  revealed[1]
                    ? `${REVEALED_CARD_SURFACE} ${landingStyles.cardBirth}`
                    : 'bg-transparent shadow-none'
                }`}
              >
                <h3 className="text-xl font-bold text-white tracking-tight">{t('brxExpress.card2.title')}</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  {t('brxExpress.card2.description')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex justify-start">
              <div
                ref={cardRefs[2]}
                className={`relative z-20 w-full max-w-[440px] p-8 md:p-10 rounded-[50px] text-slate-100 flex flex-col items-start justify-center min-h-[280px] border border-transparent transition-all duration-700 ${
                  revealed[2]
                    ? `${REVEALED_CARD_SURFACE} ${landingStyles.cardBirth}`
                    : 'bg-transparent shadow-none'
                }`}
              >
                <h3 className="text-xl font-bold text-white tracking-tight">{t('brxExpress.card3.title')}</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  {t('brxExpress.card3.description')}
                </p>
              </div>
            </div>
            <div className="hidden md:block" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="hidden md:block" />
            <div className="flex justify-end">
              <div className="w-full max-w-[440px] flex justify-center items-center relative z-20">
                <div
                  ref={cardRefs[3]}
                  className={`relative z-20 w-[340px] aspect-square flex items-center justify-center p-8 border border-transparent transition-all duration-700 [clip-path:polygon(50%_0%,_100%_50%,_50%_100%,_0%_50%)] ${
                    revealed[3]
                      ? `${REVEALED_CARD_SURFACE} ${landingStyles.cardBirth}`
                      : 'bg-transparent shadow-none'
                  }`}
                >
                  <div className="text-center max-w-[210px] flex flex-col items-center">
                    <h3 className="text-base font-bold text-white tracking-tight">{t('brxExpress.card4.title')}</h3>
                    <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                      {t('brxExpress.card4.description')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-[5] max-w-4xl mx-auto px-6 mt-32">
        <div
          className={`relative rounded-3xl border backdrop-blur-md p-8 md:p-12 shadow-2xl transition-colors duration-1000 ${
            finaleOn ? 'border-slate-700 bg-slate-950/85' : 'border-slate-800/60 bg-slate-950/40'
          }`}
        >
          <div
            ref={termsTextRef}
            className={`relative z-[5] p-6 md:p-8 rounded-2xl border transition-colors duration-1000 ${
              finaleOn ? 'border-slate-700/80 bg-slate-950/70' : 'border-slate-800/80 bg-slate-900/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-6 justify-center">
              <FileText className="h-5 w-5 text-orange-500" />
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {t('brxExpress.termsTitle')}
              </h3>
            </div>

            <ul
              className={`space-y-4 text-xs sm:text-sm leading-relaxed transition-colors duration-1000 ${
                finaleOn ? 'text-white' : 'text-slate-400'
              }`}
            >
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 mt-1 select-none">•</span>
                <span>
                  <strong>Accettazione Valutazione:</strong> L&apos;invio delle carte all&apos;hub implica l&apos;accettazione insindacabile del grading e della digitalizzazione operati dal team tecnico di BRX.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 mt-1 select-none">•</span>
                <span>
                  <strong>Tariffa Upload:</strong> Si applica un costo fisso di 0,30€ per ciascuna carta inserita a catalogo a titolo di costi di inbound, ispezione e digitalizzazione.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 mt-1 select-none">•</span>
                <span>
                  <strong>Commissioni:</strong> Al completamento di ogni transazione di vendita viene applicata una trattenuta del 10% sul prezzo dell&apos;asset, fino ad un massimale di 100€ per singola carta.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 mt-1 select-none">•</span>
                <span>
                  <strong>Tempistiche Spedizione:</strong> La spedizione 24h è garantita nei giorni lavorativi ed è soggetta alla stabilità operativa dei corrieri espressi designati da BRX Express.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 mt-1 select-none">•</span>
                <span>
                  <strong>Riconsegna Stock:</strong> Il venditore può revocare il mandato di vendita e richiedere il rientro fisico delle proprie carte in qualsiasi momento, facendosi carico delle spese di spedizione.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
