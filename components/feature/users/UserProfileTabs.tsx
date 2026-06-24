'use client';

import { Archive, Heart, MessageSquare } from 'lucide-react';
import { AuctionGavelIcon } from '@/components/ui/AuctionGavelIcon';
import { ScambiIcon } from '@/components/ui/ScambiIcon';
import { useTabListKeyboard } from '@/hooks/useTabListKeyboard';

import { UserProfileAuctionsPanel } from '@/components/feature/users/UserProfileAuctionsPanel';
import { UserProfileCollectionPanel } from '@/components/feature/users/UserProfileCollectionPanel';

export type ProfileTab = 'collezione' | 'aste' | 'scambi' | 'recensioni' | 'wishlist';

const TABS: {
  id: ProfileTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  implemented: boolean;
}[] = [
  { id: 'collezione', label: 'Collezione', icon: Archive, implemented: true },
  { id: 'aste', label: 'Aste', icon: AuctionGavelIcon, implemented: true },
  { id: 'scambi', label: 'Scambi', icon: ScambiIcon, implemented: false },
  { id: 'recensioni', label: 'Recensioni', icon: MessageSquare, implemented: false },
  { id: 'wishlist', label: 'Wishlist', icon: Heart, implemented: false },
];

interface UserProfileTabsProps {
  userId: string;
  username: string;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  collectionCount?: number | null;
  auctionsCount?: number | null;
}

function TabPlaceholder({ tab, username }: { tab: ProfileTab; username: string }) {
  const messages: Record<ProfileTab, { title: string; description: string }> = {
    collezione: {
      title: 'Collezione non disponibile',
      description: `La collezione di ${username} non è al momento accessibile.`,
    },
    aste: {
      title: 'Aste non disponibili',
      description: `Le aste di ${username} non sono al momento accessibili.`,
    },
    scambi: {
      title: 'Scambi in arrivo',
      description: `Gli scambi proposti da ${username} saranno visibili presto.`,
    },
    recensioni: {
      title: 'Nessuna recensione',
      description: `${username} non ha ancora ricevuto recensioni pubbliche.`,
    },
    wishlist: {
      title: 'Wishlist privata',
      description: `La wishlist di ${username} non è pubblica.`,
    },
  };

  const { title, description } = messages[tab];
  const TabIcon = TABS.find((t) => t.id === tab)?.icon;

  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200/70 bg-white/35 px-8 py-16 text-center backdrop-blur-xl">
      {TabIcon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-inner ring-1 ring-slate-200/60">
          <TabIcon className="h-6 w-6 text-slate-400" />
        </div>
      )}
      <p className="mb-1 text-base font-semibold text-slate-800">{title}</p>
      <p className="max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  );
}

function tabCount(
  tabId: ProfileTab,
  collectionCount?: number | null,
  auctionsCount?: number | null,
): number | null {
  if (tabId === 'collezione' && collectionCount != null && collectionCount > 0) return collectionCount;
  if (tabId === 'aste' && auctionsCount != null && auctionsCount > 0) return auctionsCount;
  return null;
}

export function UserProfileTabs({
  userId,
  username,
  activeTab,
  onTabChange,
  collectionCount,
  auctionsCount,
}: UserProfileTabsProps) {
  const { onKeyDown, registerTab, getTabIndex } = useTabListKeyboard(
    TABS.map((tab) => tab.id),
    activeTab,
    onTabChange
  );

  return (
    <section className="space-y-6">
      <div
        role="tablist"
        aria-label="Sezioni profilo"
        className="flex gap-1 overflow-x-auto rounded-2xl border border-white/60 bg-white/45 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tabCount(tab.id, collectionCount, auctionsCount);

          return (
            <button
              key={tab.id}
              ref={registerTab(tab.id)}
              type="button"
              role="tab"
              id={`profile-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`profile-tabpanel-${tab.id}`}
              tabIndex={getTabIndex(tab.id)}
              onKeyDown={onKeyDown}
              onClick={() => onTabChange(tab.id)}
              className={`group relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-[0_4px_14px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60'
                  : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'
              }`}
            >
              {tab.id === 'aste' ? (
                <AuctionGavelIcon
                  className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#ff7300]' : ''}`}
                  animated
                />
              ) : (
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#ff7300]' : ''}`} />
              )}
              <span>{tab.label}</span>
              {count != null && (
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                    isActive ? 'bg-[#ff7300]/10 text-[#ff7300]' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`profile-tabpanel-${activeTab}`}
        aria-labelledby={`profile-tab-${activeTab}`}
        tabIndex={0}
        className="min-h-[280px] focus:outline-none"
      >
        {activeTab === 'collezione' && <UserProfileCollectionPanel username={username} />}
        {activeTab === 'aste' && (
          <UserProfileAuctionsPanel userId={userId} username={username} />
        )}
        {activeTab !== 'collezione' && activeTab !== 'aste' && (
          <TabPlaceholder tab={activeTab} username={username} />
        )}
      </div>
    </section>
  );
}
