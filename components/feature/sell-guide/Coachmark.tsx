'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { cn } from '@/lib/utils';

export type CoachmarkProps = {
  anchor: string;
  messageKey: MessageKey;
  onNext?: () => void;
  onSkip: () => void;
  showNext?: boolean;
  placement?: 'bottom' | 'top';
};

type Rect = { top: number; left: number; width: number; height: number };

function findAnchor(anchor: string): HTMLElement | null {
  return (
    document.querySelector(`[data-sell-guide="${anchor}"]`) ??
    document.getElementById(anchor)
  );
}

export function Coachmark({
  anchor,
  messageKey,
  onNext,
  onSkip,
  showNext = true,
  placement = 'bottom',
}: CoachmarkProps) {
  const { t } = useTranslation();
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);

  const measure = useCallback(() => {
    const el = findAnchor(anchor);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setTargetRect({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    });
  }, [anchor]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    measure();
    const el = findAnchor(anchor);
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [anchor, measure]);

  if (!mounted || typeof document === 'undefined' || !targetRect) {
    return null;
  }

  const pad = 8;
  const spotlight = {
    top: targetRect.top - pad,
    left: targetRect.left - pad,
    width: targetRect.width + pad * 2,
    height: targetRect.height + pad * 2,
  };

  const tooltipTop =
    placement === 'bottom'
      ? spotlight.top + spotlight.height + 12
      : spotlight.top - 12;
  const tooltipLeft = Math.min(
    Math.max(spotlight.left, 16),
    window.innerWidth - 320,
  );

  return createPortal(
    <AnimatePresence>
      <motion.div
        key={anchor}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[1200] pointer-events-none"
        aria-live="polite"
      >
        <div
          className="absolute rounded-xl ring-2 ring-[#FF7300] ring-offset-2 ring-offset-transparent shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: placement === 'bottom' ? -6 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'pointer-events-auto absolute max-w-[min(300px,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white p-4 shadow-xl',
          )}
          style={{
            top: placement === 'bottom' ? tooltipTop : undefined,
            bottom: placement === 'top' ? window.innerHeight - tooltipTop : undefined,
            left: tooltipLeft,
          }}
        >
          <p className="text-sm leading-snug text-[#1D3160]">{t(messageKey)}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {showNext && onNext ? (
              <button
                type="button"
                onClick={onNext}
                className="rounded-full bg-[#FF7300] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#e86800]"
              >
                {t('sellGuide.next')}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onSkip}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            >
              {t('sellGuide.skip')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
