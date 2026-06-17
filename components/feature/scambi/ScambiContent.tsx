'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { MOCK_RECEIVED_PROPOSALS, type ReceivedProposal } from './mock-received-proposals';
import { ReceivedProposalDetail } from './ReceivedProposalDetail';

const TABS = [
  { id: 'richieste', label: 'RICHIESTE IN ATTESA' },
  { id: 'inviate', label: 'INVIATE' },
  { id: 'conclusi', label: 'CONCLUSI' },
] as const;

const EMPTY_STATE_BY_TAB: Record<string, string> = {
  richieste: 'NESSUNA RICHIESTA IN ATTESA',
  inviate: 'NESSUNA PROPOSTA INVIATA',
  conclusi: 'NESSUNO SCAMBIO CONCLUSO',
};

function getTabLabel(tabId: string): string {
  return TABS.find((t) => t.id === tabId)?.label ?? tabId;
}

/** Riga riassuntiva di una proposta ricevuta (nel tab RICHIESTE). */
function ProposalListItem({ proposal, onOpen }: { proposal: ReceivedProposal; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2.5 text-left transition hover:border-[#FF7300]/50 hover:shadow-sm"
    >
      <div className="flex -space-x-3">
        {proposal.offeredCards.slice(0, 2).map((c) => (
          <div key={c.id} className="relative h-12 w-9 overflow-hidden rounded-md bg-gray-200 ring-2 ring-white">
            <Image src={c.image} alt={c.name} fill unoptimized className="object-cover" sizes="36px" />
          </div>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <FlagIcon country={proposal.fromUser.country} size="xs" />
          <span className="truncate text-sm font-bold text-[#1D3160]">{proposal.fromUser.name}</span>
          <span className="text-gray-300">·</span>
          <span className="text-xs text-gray-400">{proposal.createdAtLabel}</span>
        </div>
        <p className="text-[12px] text-gray-500">
          Ti offre {proposal.offeredCards.length}{' '}
          {proposal.offeredCards.length === 1 ? 'carta' : 'carte'}
          {proposal.offeredCredits > 0 ? ' + crediti' : ''}, chiede {proposal.requestedCards.length}{' '}
          {proposal.requestedCards.length === 1 ? 'carta' : 'carte'}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-gray-300 transition group-hover:text-[#FF7300]" aria-hidden />
    </button>
  );
}

export function ScambiContent() {
  const [activeTab, setActiveTab] = useState<string>('richieste');
  const [openProposal, setOpenProposal] = useState<ReceivedProposal | null>(null);

  const proposals = MOCK_RECEIVED_PROPOSALS;
  const activeLabel = getTabLabel(activeTab);

  const breadcrumbItems: AppBreadcrumbItem[] = [
    {
      href: '/',
      label: 'Home',
      ariaLabel: 'Home',
      icon: <Home className="h-4 w-4" />,
      iconOnly: true,
      isCurrent: false,
    },
    { label: 'SCAMBI', isCurrent: false },
    { label: openProposal ? 'PROPOSTA' : activeLabel, isCurrent: true },
  ];

  return (
    <div className="min-h-screen w-full font-sans" style={{ backgroundColor: '#F5F4F0' }}>
      <div className="container-content mx-auto py-8 md:py-10">
        {/* Breadcrumb + aiuto */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <AppBreadcrumb items={breadcrumbItems} ariaLabel="Breadcrumb" variant="default" className="w-auto text-sm" />
          <Link href="/aiuto" className="text-sm font-medium text-[#FF7300] hover:underline">
            HAI BISOGNO DI AIUTO?
          </Link>
        </div>

        <h1 className="mb-6 text-2xl font-bold uppercase tracking-wide text-gray-900 sm:text-3xl">I MIEI SCAMBI</h1>

        {openProposal ? (
          <ReceivedProposalDetail proposal={openProposal} onBack={() => setOpenProposal(null)} />
        ) : (
          <>
            {/* Notifiche scambi */}
            <div className="mb-6 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200/80 bg-white px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">Nuova proposta</p>
                  <p className="mt-0.5 text-sm text-gray-500">Qualcuno vuole scambiare una carta con te.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('richieste');
                    if (proposals[0]) setOpenProposal(proposals[0]);
                  }}
                  className="shrink-0 text-sm font-medium text-gray-600 underline-offset-2 transition hover:text-gray-900 hover:underline"
                >
                  Guarda
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200/80 bg-white px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">Proposta accettata</p>
                  <p className="mt-0.5 text-sm text-gray-500">La tua offerta per Black Lotus è stata accettata.</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-sm font-medium text-gray-600 underline-offset-2 transition hover:text-gray-900 hover:underline"
                >
                  Dettagli
                </button>
              </div>
            </div>

            {/* Tab */}
            <div className="mb-6 flex flex-wrap items-center gap-x-1.5 gap-y-1.5 border-b border-gray-200 pb-3">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors',
                    activeTab === tab.id
                      ? 'bg-[#FF7300] text-white shadow-sm'
                      : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  {tab.id === 'richieste' && proposals.length > 0 ? `${tab.label} (${proposals.length})` : tab.label}
                </button>
              ))}
            </div>

            {/* Contenuto */}
            {activeTab === 'richieste' && proposals.length > 0 ? (
              <div className="flex flex-col gap-2">
                {proposals.map((p) => (
                  <ProposalListItem key={p.id} proposal={p} onOpen={() => setOpenProposal(p)} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 border border-gray-200 bg-white px-6 py-12">
                <p className="text-center text-base font-semibold uppercase tracking-wide text-gray-500">
                  {EMPTY_STATE_BY_TAB[activeTab] ?? 'NESSUNO SCAMBIO'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
