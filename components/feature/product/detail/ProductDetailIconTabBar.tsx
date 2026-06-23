'use client';

import { cn } from '@/lib/utils';
import { AuctionGavelIcon } from '@/components/ui/AuctionGavelIcon';
import type {
  ProductDetailTabConfig,
  ProductDetailTabId,
} from '@/lib/product-detail/product-detail-view-types';

export function ProductDetailIconTabBar({
  tabs,
  activeTab,
  onTabChange,
  className,
  compact = false,
}: {
  tabs: ProductDetailTabConfig[];
  activeTab: ProductDetailTabId;
  onTabChange: (id: ProductDetailTabId) => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn('flex border-b border-zinc-200/80 bg-white', className)} role="tablist" aria-label="Azioni carta">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isAuctionIcon = tab.id === 'ASTA';
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 transition-colors',
              compact ? 'px-0.5 py-2' : 'px-1 py-2 sm:py-2.5',
              isActive
                ? 'text-primary after:absolute after:bottom-0 after:left-1 after:right-1 after:h-0.5 after:rounded-full after:bg-primary sm:after:left-2 sm:after:right-2'
                : 'text-zinc-500 hover:bg-zinc-50/80 hover:text-zinc-700'
            )}
          >
            {isAuctionIcon ? (
              <AuctionGavelIcon
                className={cn('shrink-0', compact ? 'h-4 w-4' : 'h-4 w-4 sm:h-[18px] sm:w-[18px]')}
                animated
              />
            ) : (
              <Icon className={cn('shrink-0', compact ? 'h-4 w-4' : 'h-4 w-4 sm:h-[18px] sm:w-[18px]')} aria-hidden />
            )}
            <span
              className={cn(
                'truncate font-bold uppercase tracking-wide',
                compact ? 'text-[8px]' : 'text-[8px] sm:text-[10px]'
              )}
            >
              {tab.mobileLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
