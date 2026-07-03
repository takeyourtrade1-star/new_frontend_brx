'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { BrxExpressIcon } from '@/components/ui/BrxExpressIcon';

/**
 * Pillola promozionale contestuale per BRX Express.
 * Variante = contesto della pagina: il messaggio cambia (compra dal catalogo
 * vs. vendi in conto vendita). Sbuca da destra in alto (sotto l'header) da md
 * in su, resta qualche secondo e sparisce da sola (hover mette in pausa).
 * La X la nasconde per DISMISS_TTL_MS via localStorage.
 */
export type BrxExpressPromoVariant = 'product' | 'sell' | 'inventory' | 'trade' | 'auction';

type VariantConfig = {
  href: string;
  title: MessageKey;
  body: MessageKey;
};

const VARIANTS: Record<BrxExpressPromoVariant, VariantConfig> = {
  product: {
    href: '/brx-express/catalogo',
    title: 'brxPromo.product.title',
    body: 'brxPromo.product.body',
  },
  sell: {
    href: '/brx-express',
    title: 'brxPromo.sell.title',
    body: 'brxPromo.sell.body',
  },
  inventory: {
    href: '/brx-express',
    title: 'brxPromo.inventory.title',
    body: 'brxPromo.inventory.body',
  },
  trade: {
    href: '/brx-express',
    title: 'brxPromo.trade.title',
    body: 'brxPromo.trade.body',
  },
  auction: {
    href: '/brx-express',
    title: 'brxPromo.auction.title',
    body: 'brxPromo.auction.body',
  },
};

/** Dopo la chiusura con la X la variante resta nascosta per 7 giorni. */
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Ritardo prima dell'ingresso: lascia assestare la pagina, poi slide-in. */
const ENTER_DELAY_MS = 900;

/** La pillola sparisce da sola dopo questo tempo (hover mette in pausa). */
const AUTO_HIDE_MS = 7000;

/** Dopo un hover, tempo residuo prima della sparizione. */
const RESUME_HIDE_MS = 2500;

/** Durata della transizione di uscita (deve combaciare con duration-500). */
const EXIT_MS = 500;

const dismissStorageKey = (variant: BrxExpressPromoVariant) => `brx-express-promo:${variant}`;

type BrxExpressPromoProps = {
  variant: BrxExpressPromoVariant;
  className?: string;
};

export function BrxExpressPromo({ variant, className }: BrxExpressPromoProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const dismissedAt = Number(localStorage.getItem(dismissStorageKey(variant)));
      if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) return;
    } catch {
      // storage non disponibile (es. privacy mode): mostra comunque
    }
    const timer = setTimeout(() => setMounted(true), ENTER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [variant]);

  // Attiva la transizione di ingresso al frame successivo al mount.
  useEffect(() => {
    if (!mounted) return;
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [mounted]);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const hide = useCallback(
    (persist: boolean) => {
      clearHideTimer();
      setEntered(false);
      if (persist) {
        try {
          localStorage.setItem(dismissStorageKey(variant), String(Date.now()));
        } catch {
          // ignora: senza storage la pillola sparisce solo per la sessione
        }
      }
      // Smonta a fine transizione di uscita.
      setTimeout(() => setMounted(false), EXIT_MS);
    },
    [clearHideTimer, variant]
  );

  // Auto-hide: la pillola resta qualche secondo poi scivola via da sola.
  useEffect(() => {
    if (!entered) return;
    hideTimer.current = setTimeout(() => hide(false), AUTO_HIDE_MS);
    return clearHideTimer;
  }, [entered, hide, clearHideTimer]);

  const pauseAutoHide = () => clearHideTimer();
  const resumeAutoHide = () => {
    clearHideTimer();
    hideTimer.current = setTimeout(() => hide(false), RESUME_HIDE_MS);
  };

  if (!mounted) return null;

  const config = VARIANTS[variant];

  return (
    <aside
      className={cn(
        'fixed right-3 top-32 z-40 hidden md:block',
        // ingresso con leggero overshoot elastico, uscita sulla stessa curva
        'transition-[transform,opacity] duration-500 motion-reduce:transition-none',
        '[transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]',
        entered ? 'translate-x-0 opacity-100' : 'translate-x-[130%] opacity-0',
        className
      )}
      aria-label={t('brxPromo.badge')}
      onMouseEnter={pauseAutoHide}
      onMouseLeave={resumeAutoHide}
    >
      {/* Cornice: gradiente orange/amber animato spesso 1px attorno alla pillola */}
      <div className="brx-promo-border group relative overflow-hidden rounded-full p-px shadow-lg shadow-orange-500/25 transition-shadow duration-300 hover:shadow-xl hover:shadow-orange-500/40">
        <div className="relative flex items-center gap-0.5 rounded-full bg-white/95 py-1 pl-1 pr-1 backdrop-blur-md">
          <Link
            href={config.href}
            title={t(config.body)}
            className="flex items-center gap-2 pr-1"
          >
            <span className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-[0_1px_6px_rgba(249,115,22,0.45)]">
              <BrxExpressIcon size="sm" />
              <span
                className="brx-promo-spark absolute -right-1 -top-1 text-[9px] leading-none text-amber-300"
                aria-hidden
              >
                ✦
              </span>
            </span>
            <span className="whitespace-nowrap text-xs font-bold tracking-tight text-slate-800 transition-colors duration-300 group-hover:text-orange-600">
              {t(config.title)}
            </span>
            <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-orange-500 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            onClick={() => hide(true)}
            aria-label={t('brxPromo.close')}
            className="rounded-full p-1 text-slate-300 transition-colors hover:bg-orange-50 hover:text-slate-500"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        {/* Glint foil: lama di luce ambrata che attraversa la pillola a intervalli */}
        <span className="brx-promo-sheen pointer-events-none absolute inset-0 rounded-full" aria-hidden />
      </div>

      <style jsx>{`
        .brx-promo-border {
          background: linear-gradient(115deg, #fdba74, #fde68a, #fb923c, #fde68a, #fdba74);
          background-size: 250% 100%;
          animation: brxPromoBorder 7s ease-in-out infinite;
        }
        @keyframes brxPromoBorder {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .brx-promo-sheen {
          background: linear-gradient(
            105deg,
            transparent 40%,
            rgba(251, 191, 36, 0.22) 50%,
            transparent 60%
          );
          background-size: 250% 100%;
          background-position: 135% 0;
          animation: brxPromoSheen 3.6s ease-in-out infinite;
        }
        @keyframes brxPromoSheen {
          0%, 45% { background-position: 135% 0; }
          80%, 100% { background-position: -35% 0; }
        }
        .brx-promo-spark {
          animation: brxPromoSpark 2.6s ease-in-out infinite;
        }
        @keyframes brxPromoSpark {
          0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(90deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .brx-promo-border,
          .brx-promo-sheen,
          .brx-promo-spark {
            animation: none;
          }
          .brx-promo-sheen {
            opacity: 0;
          }
        }
      `}</style>
    </aside>
  );
}
