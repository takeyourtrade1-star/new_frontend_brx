'use client';

import { Archive, Gavel, ArrowLeftRight, MessageSquare, Heart } from 'lucide-react';

export type ProfileTab = 'collezione' | 'aste' | 'scambi' | 'recensioni' | 'wishlist';

const TABS: { id: ProfileTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'collezione', label: 'Collezione', icon: Archive },
  { id: 'aste', label: 'Aste', icon: Gavel },
  { id: 'scambi', label: 'Scambi', icon: ArrowLeftRight },
  { id: 'recensioni', label: 'Recensioni', icon: MessageSquare },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
];

interface UserProfileTabsProps {
  username: string;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

function TabPlaceholder({ tab, username }: { tab: ProfileTab; username: string }) {
  const messages: Record<ProfileTab, { title: string; description: string }> = {
    collezione: {
      title: 'Collezione non ancora disponibile',
      description: `La collezione di ${username} sarà visibile presto.`,
    },
    aste: {
      title: 'Nessuna asta attiva',
      description: `${username} non ha aste attive al momento.`,
    },
    scambi: {
      title: 'Scambi non ancora disponibili',
      description: `Gli scambi proposti da ${username} saranno visibili presto.`,
    },
    recensioni: {
      title: 'Nessuna recensione',
      description: `${username} non ha ancora ricevuto recensioni.`,
    },
    wishlist: {
      title: 'Wishlist privata',
      description: `La wishlist di ${username} non è pubblica.`,
    },
  };

  const { title, description } = messages[tab];
  const TabIcon = TABS.find((t) => t.id === tab)?.icon;

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-8 py-16 text-center">
      {TabIcon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
          <TabIcon className="h-6 w-6 text-slate-400" />
        </div>
      )}
      <p className="mb-1 text-base font-semibold text-slate-700">{title}</p>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}

export function UserProfileTabs({ username, activeTab, onTabChange }: UserProfileTabsProps) {
  return (
    <div>
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <TabPlaceholder tab={activeTab} username={username} />
    </div>
  );
}
