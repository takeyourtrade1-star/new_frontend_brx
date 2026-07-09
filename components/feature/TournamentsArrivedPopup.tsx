'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Trophy, X } from 'lucide-react';
import { dispatchPromoPopup } from '@/lib/asso-layout';

/** Non riproporre il popup nella stessa sessione dopo la chiusura. */
const DISMISS_KEY = 'ebx-tournaments-popup-dismissed';
/** Ritardo prima dell'ingresso: lascia respirare la landing. */
const SHOW_DELAY_MS = 2500;

/**
 * Popup promozionale sulla landing: annuncia l'arrivo dei Tornei (Pre-beta)
 * con CTA verso /tornei. Chiudibile, una volta per sessione.
 */
export function TournamentsArrivedPopup() {
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Avvisa Asso: finché il popup è visibile la mascotte va in mini sopra di esso.
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

  const dismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignora
    }
  };

  if (!visible) return null;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label="I Tornei sono arrivati"
      className="fixed bottom-4 right-4 z-50 w-[min(340px,calc(100vw-2rem))] animate-in slide-in-from-bottom-4 fade-in duration-500"
    >
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1D3160] shadow-[0_12px_40px_-8px_rgba(29,49,96,0.55)]">
        {/* Riga accento */}
        <div className="h-1 w-full bg-gradient-to-r from-[#FF7300] via-amber-400 to-[#FF7300]" />

        <div className="relative p-4 sm:p-5">
          <button
            type="button"
            onClick={dismiss}
            aria-label="Chiudi"
            className="absolute right-3 top-3 rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FF7300]/15 text-[#FF7300]">
              <Trophy size={22} />
            </div>
            <div className="pr-5">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="text-base font-black leading-tight text-white">
                  I Tornei sono arrivati!
                </h3>
                <span className="rounded-full bg-violet-400/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-violet-300">
                  Beta
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-snug text-white/70">
                Sfide 1v1 in webcam contro avversari reali. Entra e gioca subito.
              </p>
            </div>
          </div>

          <Link
            href="/tornei"
            onClick={dismiss}
            className="mt-4 flex w-full items-center justify-center rounded-full bg-[#FF7300] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-[#e56700]"
          >
            Entra e gioca subito
          </Link>
        </div>
      </div>
    </div>
  );
}
