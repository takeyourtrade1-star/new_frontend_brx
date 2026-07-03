'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { HelpCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  ASSO_HELP_BOTTOM_ABOVE_BID_DOCK,
  ASSO_LAYOUT,
  STICKY_BOTTOM_BAR_EVENT,
  isAuctionDetailPath,
  isMobileAuctionDockViewport,
  type StickyBottomBarDetail,
} from '@/lib/asso-layout';

type AssoMobileHelpButtonProps = {
  isStickyBarVisible: boolean;
  onClick: () => void;
};

/**
 * Su mobile sostituisce la mascotte Asso con un tastino "Aiuto" minimale.
 * Si solleva sopra barre fisse in basso (hub aste, dock offerta dettaglio asta).
 */
export function AssoMobileHelpButton({ isStickyBarVisible, onClick }: AssoMobileHelpButtonProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [barLift, setBarLift] = useState<StickyBottomBarDetail['kind'] | null>(null);
  const [auctionDockViewport, setAuctionDockViewport] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<StickyBottomBarDetail>).detail;
      if (detail?.visible) {
        setBarLift(detail.kind ?? 'hub');
      } else {
        setBarLift(null);
      }
    };
    window.addEventListener(STICKY_BOTTOM_BAR_EVENT, handler);
    return () => window.removeEventListener(STICKY_BOTTOM_BAR_EVENT, handler);
  }, []);

  useEffect(() => {
    const syncViewport = () => setAuctionDockViewport(isMobileAuctionDockViewport());
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  const onAuctionDetailMobile =
    isAuctionDetailPath(pathname) && auctionDockViewport;

  const bottom = useMemo(() => {
    if (barLift === 'bidDock' || onAuctionDetailMobile) {
      return ASSO_HELP_BOTTOM_ABOVE_BID_DOCK;
    }
    if (barLift === 'hub' || isStickyBarVisible) {
      return `${ASSO_LAYOUT.mascotBottomSticky}px`;
    }
    return `${ASSO_LAYOUT.mascotBottom}px`;
  }, [barLift, isStickyBarVisible, onAuctionDetailMobile]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed flex items-center gap-1 rounded-full border border-white/60 bg-white/70 px-2 py-0.5 text-[11px] font-medium text-zinc-600 shadow-[0_8px_20px_rgba(29,49,96,0.12)] backdrop-blur-xl backdrop-saturate-150 transition-[bottom] duration-200 hover:bg-white/85 hover:text-zinc-900 active:scale-95"
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
