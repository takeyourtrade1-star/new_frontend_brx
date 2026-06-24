'use client';

import { Clock, Flag } from 'lucide-react';
import { OrderTabs, type OrderTab } from '@/components/feature/ordini/OrderTabs';
import type { AuctionTranslate } from '@/components/feature/aste/auctions-browse-shared';

export type MyListingsTab = 'ongoing' | 'ended';

type AsteMineViewBarProps = {
  variant: 'published' | 'participations';
  statusTab: MyListingsTab;
  onStatusTabChange: (tab: MyListingsTab) => void;
  ongoingCount: number;
  endedCount: number;
  t: AuctionTranslate;
};

export function AsteMineViewBar({
  variant,
  statusTab,
  onStatusTabChange,
  ongoingCount,
  endedCount,
  t,
}: AsteMineViewBarProps) {
  const isPublished = variant === 'published';

  // Pillole su desktop, dropdown a tendina su mobile (stesso pattern di "Le mie vendite").
  const leftTabs: OrderTab<MyListingsTab>[] = [
    {
      id: 'ongoing',
      label: isPublished ? t('auctions.myListingsTabOngoing') : t('auctions.participationsTabOngoing'),
      icon: Clock,
      count: ongoingCount,
    },
    {
      id: 'ended',
      label: isPublished ? t('auctions.myListingsTabEnded') : t('auctions.participationsTabEnded'),
      icon: Flag,
      count: endedCount,
    },
  ];

  return (
    <OrderTabs
      leftTabs={leftTabs}
      rightTabs={[]}
      activeTab={statusTab}
      onChange={onStatusTabChange}
    />
  );
}
