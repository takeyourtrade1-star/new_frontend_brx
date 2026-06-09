'use client';

import { HelpCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { ASSO_LAYOUT } from '@/lib/asso-layout';

type AssoMobileHelpButtonProps = {
  isStickyBarVisible: boolean;
  onClick: () => void;
};

/**
 * Su mobile sostituisce la mascotte Asso con un tastino "Aiuto" minimale,
 * poco invasivo, che apre lo stesso modale chat di Asso.
 */
export function AssoMobileHelpButton({ isStickyBarVisible, onClick }: AssoMobileHelpButtonProps) {
  const { t } = useTranslation();
  const bottom = isStickyBarVisible ? ASSO_LAYOUT.mascotBottomSticky : ASSO_LAYOUT.mascotBottom;

  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/95 px-2.5 py-1 text-[12px] font-medium text-zinc-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 active:scale-95"
      style={{
        zIndex: 9999,
        right: 12,
        bottom,
      }}
      aria-label={t('common.help')}
    >
      <HelpCircle className="h-3.5 w-3.5" aria-hidden />
      <span>{t('common.help')}</span>
    </button>
  );
}
