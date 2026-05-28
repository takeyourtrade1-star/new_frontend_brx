'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Search } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

type HeaderSearchHintProps = {
  variant?: 'default' | 'compact';
  /** Skip pulse animation (e.g. user already has q in URL). */
  skipAnimation?: boolean;
  className?: string;
};

function findGlobalSearchInput(): HTMLElement | null {
  const byLabel = document.querySelector('[aria-label="Cerca carte"]');
  if (byLabel instanceof HTMLElement) return byLabel;
  const header = document.querySelector('header');
  if (!header) return null;
  const input = header.querySelector('input[type="text"]');
  return input instanceof HTMLElement ? input : null;
}

export function HeaderSearchHint({
  variant = 'default',
  skipAnimation = false,
  className,
}: HeaderSearchHintProps) {
  const { t } = useTranslation();
  const [pulse, setPulse] = useState(!skipAnimation);
  const compact = variant === 'compact';

  useEffect(() => {
    if (skipAnimation) return;
    const t1 = window.setTimeout(() => setPulse(false), 3200);
    return () => window.clearTimeout(t1);
  }, [skipAnimation]);

  const focusHeaderSearch = () => {
    const el = findGlobalSearchInput();
    if (!el) return;
    el.focus();
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        compact ? 'gap-2 py-4' : 'gap-3 rounded-xl border border-[#FF7300]/20 bg-orange-50/60 px-4 py-5',
        className,
      )}
      role="status"
    >
      {pulse && !compact ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 1.2, repeat: 2, ease: 'easeInOut' }}
            className="flex items-center gap-2 text-[#FF7300]"
            aria-hidden
          >
            <ArrowUp className="h-6 w-6" strokeWidth={2.5} />
            <Search className="h-5 w-5" />
          </motion.div>
        </motion.div>
      ) : (
        <Search
          className={cn('text-[#FF7300]', compact ? 'h-5 w-5' : 'h-6 w-6')}
          aria-hidden
        />
      )}
      <p
        className={cn(
          'font-medium text-[#1D3160]',
          compact ? 'max-w-[240px] text-xs leading-relaxed' : 'max-w-md text-sm leading-snug',
        )}
      >
        {t('sellGuide.searchInHeader')}
      </p>
      {!compact ? (
        <button
          type="button"
          onClick={focusHeaderSearch}
          className="mt-1 rounded-full border border-[#FF7300]/40 bg-white px-4 py-1.5 text-xs font-bold text-[#FF7300] transition hover:bg-[#FF7300] hover:text-white"
        >
          {t('sellGuide.focusSearch')}
        </button>
      ) : null}
    </div>
  );
}
