'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, ChevronRight, Search, Coins, Send, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScambiIcon } from '@/components/ui/ScambiIcon';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { MOCK_RECEIVED_PROPOSALS, type ReceivedProposal } from './mock-received-proposals';
import { ReceivedProposalDetail } from './ReceivedProposalDetail';

const TABS = [
  { id: 'richieste', label: 'PROPOSTE RICEVUTE' },
  { id: 'inviate', label: 'PROPOSTE INVIATE' },
  { id: 'conclusi', label: 'SCAMBI CONCLUSI' },
] as const;

const EMPTY_STATE_BY_TAB: Record<string, string> = {
  richieste: 'NESSUNA PROPOSTA RICEVUTA',
  inviate: 'NESSUNA PROPOSTA INVIATA',
  conclusi: 'NESSUNO SCAMBIO CONCLUSO',
};

function getTabLabel(tabId: string): string {
  return TABS.find((t) => t.id === tabId)?.label ?? tabId;
}

/** Passi del flusso di scambio mostrati nella striscia scorrevole. */
const TRADE_STEPS = [
  { icon: Search, label: 'Scegli la carta' },
  { icon: Coins, label: 'Fai un’offerta' },
  { icon: Send, label: 'Manda la proposta' },
  { icon: Clock, label: 'Attendi risposta' },
  { icon: ScambiIcon, label: 'Scambia!' },
] as const;

/** Badge numerato con icona del passo (animato sull'ultimo). */
function StepBadge({
  step,
  index,
  size = 'md',
}: {
  step: (typeof TRADE_STEPS)[number];
  index: number;
  size?: 'md' | 'lg';
}) {
  const Icon = step.icon;
  const isLast = index === TRADE_STEPS.length - 1;
  const lg = size === 'lg';
  return (
    <span
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF8A26] to-[#FF7300] text-white shadow-sm',
        lg ? 'h-12 w-12' : 'h-9 w-9',
        isLast && 'shadow-[0_4px_16px_rgba(255,115,0,0.4)]'
      )}
      aria-hidden
    >
      <Icon
        className={cn(
          isLast && 'scambi-step-spin',
          lg ? (isLast ? 'h-7 w-7' : 'h-6 w-6') : isLast ? 'h-6 w-6' : 'h-[18px] w-[18px]'
        )}
      />
      <span className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white text-[10px] font-black tabular-nums text-[#1D3160] shadow ring-1 ring-black/5">
        {index + 1}
      </span>
    </span>
  );
}

/** Tutorial passi dello scambio: stepper verticale su mobile, riga su desktop.
 *  Su mobile è comprimibile (toggle "Nascondi"), preferenza salvata in localStorage. */
function TradeStepsTicker() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(localStorage.getItem('scambi_tutorial_hidden') === '1');
  }, []);

  const toggleHidden = () =>
    setHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('scambi_tutorial_hidden', next ? '1' : '0');
      } catch {
        /* localStorage non disponibile */
      }
      return next;
    });

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm">
      <div
        className={cn(
          'flex items-center justify-between gap-2 bg-gradient-to-r from-[#FFF4EC] to-white px-4 py-2.5',
          hidden ? 'sm:border-b sm:border-gray-200' : 'border-b border-gray-200'
        )}
      >
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF7300]">
          Come funziona uno scambio
        </span>
        <button
          type="button"
          onClick={toggleHidden}
          className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-gray-400 transition hover:text-gray-600 sm:hidden"
          aria-expanded={!hidden}
        >
          {hidden ? 'Mostra' : 'Nascondi'}
          <ChevronRight
            className={cn('h-3.5 w-3.5 transition-transform', hidden ? '' : 'rotate-90')}
            aria-hidden
          />
        </button>
      </div>

      {/* Mobile: stepper verticale con connettore */}
      {!hidden && (
      <ol className="flex flex-col px-4 py-3 sm:hidden">
        {TRADE_STEPS.map((step, index) => {
          const isLast = index === TRADE_STEPS.length - 1;
          return (
            <li key={step.label} className="flex gap-3.5">
              <div className="flex flex-col items-center">
                <StepBadge step={step} index={index} size="lg" />
                {!isLast && <span className="my-1 w-0.5 flex-1 rounded-full bg-[#FF7300]/25" aria-hidden />}
              </div>
              <span
                className={cn(
                  'pt-3 text-[15px] font-semibold text-[#1D3160]',
                  !isLast && 'pb-4',
                  isLast && 'font-bold'
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      )}

      {/* Desktop: riga orizzontale */}
      <div className="hidden flex-wrap items-center justify-center gap-y-3 px-4 py-3.5 sm:flex">
        {TRADE_STEPS.map((step, index) => {
          const isLast = index === TRADE_STEPS.length - 1;
          return (
            <Fragment key={step.label}>
              <div className="flex shrink-0 items-center gap-2.5 px-2.5">
                <StepBadge step={step} index={index} />
                <span className={cn('whitespace-nowrap text-sm font-semibold text-[#1D3160]', isLast && 'font-bold')}>
                  {step.label}
                </span>
              </div>
              {!isLast && <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden />}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

/** Riga riassuntiva di una proposta ricevuta (nel tab RICHIESTE). */
function ProposalListItem({ proposal, onOpen }: { proposal: ReceivedProposal; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex items-center gap-3 rounded-xl border border-gray-300 bg-white p-3 text-left shadow-sm transition hover:border-[#FF7300] hover:shadow-md"
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

        <h1 className="mb-4 text-2xl font-bold uppercase tracking-wide text-gray-900 sm:text-3xl">I MIEI SCAMBI</h1>

        <TradeStepsTicker />

        {openProposal ? (
          <ReceivedProposalDetail proposal={openProposal} onBack={() => setOpenProposal(null)} />
        ) : (
          <>
            {/* Tab — una riga scrollabile su mobile, a capo su desktop */}
            <div className="scrollbar-hide mb-6 flex items-center gap-2 overflow-x-auto border-b border-gray-200 pb-3 sm:flex-wrap">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold uppercase tracking-wide transition-all sm:py-1.5 sm:text-xs',
                    activeTab === tab.id
                      ? 'bg-[#FF7300] text-white shadow-sm shadow-[#FF7300]/25'
                      : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-xl border border-gray-300 bg-white px-6 py-12 shadow-sm">
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
