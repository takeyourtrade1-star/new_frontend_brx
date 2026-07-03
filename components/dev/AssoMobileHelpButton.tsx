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
      className="fixed flex items-center gap-1 rounded-full border border-white/60 bg-white/70 px-2 py-0.5 text-[11px] font-medium text-zinc-600 shadow-[0_8px_20px_rgba(29,49,96,0.12)] backdrop-blur-xl backdrop-saturate-150 transition-colors hover:bg-white/85 hover:text-zinc-900 active:scale-95"
      style={{
        zIndex: 9999,
        left: 12,
        bottom,
      }}
      aria-label={t('common.help')}
    >
      <HelpCircle className="h-3.5 w-3.5" aria-hidden />
      <span>{t('common.help')}</span>
    </button>
  );
}
