'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import { ScambiIcon } from '@/components/ui/ScambiIcon';
import { ASSO_FIGHT_STARTED_EVENT, dispatchPromoPopup } from '@/lib/asso-layout';
import { useTranslation } from '@/lib/i18n/useTranslation';

/** Non riproporre il popup nella stessa sessione dopo la chiusura. */
const DISMISS_KEY = 'ebx-live-features-popup-dismissed-v1';
/** Ritardo prima dell'ingresso: lascia respirare la landing. */
const SHOW_DELAY_MS = 2500;

const exchangeTransition = {
  duration: 3.2,
  ease: 'easeInOut' as const,
  repeat: Infinity,
  repeatDelay: 0.5,
  times: [0, 0.38, 0.62, 1],
};

/** Annuncio compatto per le due esperienze live: Scambi beta e Tornei. */
export function LiveFeaturesPopup() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    dispatchPromoPopup({ visible: true, height: rootRef.current?.offsetHeight });
    return () => dispatchPromoPopup({ visible: false });
  }, [visible]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch {
      // sessionStorage non disponibile: mostra comunque.
    }
    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // L'auto-scontro di Asso ha la priorità sull'angolo: chiudi il popup
  // quando sta per partire (l'arena della lotta occupa la stessa zona).
  useEffect(() => {
    const handleFight = () => setVisible(false);
    window.addEventListener(ASSO_FIGHT_STARTED_EVENT, handleFight);
    return () => window.removeEventListener(ASSO_FIGHT_STARTED_EVENT, handleFight);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Ignora: il popup resta comunque chiudibile.
    }
  };

  if (!visible) return null;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label={t('landing.livePopup.aria')}
      className="fixed bottom-4 right-4 z-50 w-[min(380px,calc(100vw-2rem))] animate-in slide-in-from-bottom-4 fade-in duration-500"
    >
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1D3160] shadow-[0_12px_40px_-8px_rgba(29,49,96,0.55)]">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-[#FF7300] to-violet-400" />

        <div className="relative p-4 sm:p-5">
          <button
            type="button"
            onClick={dismiss}
            aria-label={t('landing.livePopup.close')}
            className="absolute right-3 top-3 z-10 rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-4 pr-6">
            <div
              aria-hidden="true"
              className="relative h-16 w-24 shrink-0 rounded-2xl bg-white/[0.06]"
            >
              <motion.div
                animate={{ x: [0, 42, 42, 0], y: [0, -5, -5, 0], rotate: [-9, 7, 7, -9] }}
                transition={exchangeTransition}
                className="absolute left-2 top-3 flex h-10 w-8 items-center justify-center rounded-md border border-emerald-300/50 bg-emerald-400 text-[#1D3160] shadow-lg"
              >
                <ScambiIcon size={17} strokeWidth={2.7} />
              </motion.div>
              <motion.div
                animate={{ x: [0, -42, -42, 0], y: [0, 5, 5, 0], rotate: [9, -7, -7, 9] }}
                transition={exchangeTransition}
                className="absolute right-2 top-3 flex h-10 w-8 items-center justify-center rounded-md border border-violet-300/50 bg-violet-400 text-[#1D3160] shadow-lg"
              >
                <Trophy size={17} strokeWidth={2.7} />
              </motion.div>
            </div>

            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                {t('landing.livePopup.eyebrow')}
              </p>
              <h3 className="mt-0.5 text-lg font-black leading-tight text-white">
                {t('landing.livePopup.title')}
              </h3>
              <span className="mt-1.5 inline-flex rounded-full bg-emerald-400/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-300">
                {t('landing.livePopup.badge')}
              </span>
            </div>
          </div>

          <p className="mt-3 text-[13px] leading-snug text-white/70">
            {t('landing.livePopup.body')}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href="/scambi"
              onClick={dismiss}
              className="flex items-center justify-center gap-1.5 rounded-full bg-emerald-400 px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-[#132448] transition-colors hover:bg-emerald-300"
            >
              <ScambiIcon size={14} strokeWidth={2.7} />
              {t('landing.livePopup.tradesCta')}
            </Link>
            <Link
              href="/tornei"
              onClick={dismiss}
              className="flex items-center justify-center gap-1.5 rounded-full border border-violet-300/40 bg-violet-400/15 px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-violet-200 transition-colors hover:bg-violet-400/25"
            >
              <Trophy size={14} strokeWidth={2.7} />
              {t('landing.livePopup.tournamentsCta')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
