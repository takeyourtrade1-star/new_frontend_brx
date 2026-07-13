'use client';

import { Fragment, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, ChevronRight, ChevronDown, ChevronUp, Search, Coins, Send, Clock, Inbox, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScambiIcon } from '@/components/ui/ScambiIcon';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { OrderTabs, type OrderTab } from '@/components/feature/ordini/OrderTabs';
import GlobalSearchBar from '@/components/layout/GlobalSearchBar';
import { MOCK_RECEIVED_PROPOSALS, type ReceivedProposal } from './mock-received-proposals';
import { ReceivedProposalDetail } from './ReceivedProposalDetail';

type ScambiTabId = 'richieste' | 'inviate' | 'conclusi';

const TABS_LEFT: OrderTab<ScambiTabId>[] = [
  { id: 'richieste', label: 'PROPOSTE RICEVUTE', icon: Inbox },
  { id: 'inviate', label: 'PROPOSTE INVIATE', icon: Send },
];

const TABS_RIGHT: OrderTab<ScambiTabId>[] = [
  { id: 'conclusi', label: 'SCAMBI CONCLUSI', icon: CheckCircle2 },
];

const ALL_TABS = [...TABS_LEFT, ...TABS_RIGHT];

const EMPTY_STATE_BY_TAB: Record<ScambiTabId, string> = {
  richieste: 'NESSUNA PROPOSTA RICEVUTA',
  inviate: 'NESSUNA PROPOSTA INVIATA',
  conclusi: 'NESSUNO SCAMBIO CONCLUSO',
};

function getTabLabel(tabId: ScambiTabId): string {
  return ALL_TABS.find((t) => t.id === tabId)?.label ?? tabId;
}

/**
 * Emblema "coppia di carte": due carte incrociate che si animano "scambiandosi"
 * (ruotano l'una attorno all'altra). Posizione/rotazione base e animazione sono
 * gestite dalle classi `.trade-emblem-card-a/-b` in globals.css. Usato ai lati
 * del banner marketing degli scambi al posto della singola icona refresh.
 */
function TradeCardsEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect
        className="trade-emblem-card-a"
        x="7.25"
        y="5.5"
        width="9.5"
        height="13"
        rx="2"
        fill="white"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <rect
        className="trade-emblem-card-b"
        x="7.25"
        y="5.5"
        width="9.5"
        height="13"
        rx="2"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

/** Passi del flusso di scambio. `card` è la parola evidenziata (le carte sono il
 *  centro dello scambio); `iconClass` è l'animazione propria di ogni icona. */
const TRADE_STEPS = [
  { icon: Search, lead: 'Scegli la ', card: 'carta', tail: ' che vuoi', iconClass: 'scambi-icon-search' },
  { icon: Coins, lead: 'Offri le tue ', card: 'carte', tail: '', iconClass: 'scambi-icon-coins' },
  { icon: Send, lead: 'Manda la proposta', card: '', tail: '', iconClass: 'scambi-icon-send' },
  { icon: Clock, lead: 'Attendi la risposta', card: '', tail: '', iconClass: 'scambi-icon-clock' },
  { icon: ScambiIcon, lead: 'Scambia le ', card: 'carte', tail: '!', iconClass: 'scambi-step-spin' },
] as const;

/** Ritardo di comparsa in cascata: ogni passo entra dopo il precedente. */
const STEP_ENTER_DELAY_MS = 380;

/** Testo del passo con la parola "carta/carte" messa in risalto. */
function StepLabel({ step, className }: { step: (typeof TRADE_STEPS)[number]; className?: string }) {
  return (
    <span className={className}>
      {step.lead}
      {step.card && (
        <span className="scambi-card-word font-extrabold text-[#FF7300]">{step.card}</span>
      )}
      {step.tail}
    </span>
  );
}

/** Badge numerato con icona animata del passo. */
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
          step.iconClass,
          lg ? (isLast ? 'h-7 w-7' : 'h-6 w-6') : isLast ? 'h-6 w-6' : 'h-[18px] w-[18px]'
        )}
      />
      <span className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white text-[10px] font-black tabular-nums text-[#1D3160] shadow ring-1 ring-black/5">
        {index + 1}
      </span>
    </span>
  );
}

/** Chiave localStorage per ricordare se il tutorial è nascosto (solo mobile). */
const TUTORIAL_HIDDEN_KEY = 'scambi-tutorial-hidden';

/** Tutorial passi dello scambio: stepper verticale su mobile, riga su desktop.
 *  Su mobile è comprimibile con un toggle "Nascondi/Mostra" (preferenza ricordata),
 *  così quando si apre una proposta il tutorial non occupa tutto lo schermo. */
function TradeStepsTicker() {
  const [started, setStarted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ripristina la preferenza "tutorial nascosto".
  useEffect(() => {
    try {
      setHidden(localStorage.getItem(TUTORIAL_HIDDEN_KEY) === '1');
    } catch {
      /* localStorage non disponibile: mostra il tutorial */
    }
  }, []);

  const toggleHidden = useCallback(() => {
    setHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(TUTORIAL_HIDDEN_KEY, next ? '1' : '0');
      } catch {
        /* ignora: la preferenza semplicemente non verrà ricordata */
      }
      return next;
    });
  }, []);

  // Avvia la cascata solo quando il tutorial entra nel viewport.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="mb-6">
      {/* Mobile: intestazione con toggle Nascondi/Mostra */}
      <div className="flex items-center justify-between px-4 sm:hidden">
        <span className="text-xs font-bold uppercase tracking-wide text-gray-400">
          Come funziona
        </span>
        <button
          type="button"
          onClick={toggleHidden}
          aria-expanded={!hidden}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#FF7300] transition hover:bg-[#FF7300]/10 active:scale-95"
        >
          {hidden ? (
            <>
              <ChevronDown className="h-3.5 w-3.5" aria-hidden /> Mostra
            </>
          ) : (
            <>
              <ChevronUp className="h-3.5 w-3.5" aria-hidden /> Nascondi
            </>
          )}
        </button>
      </div>

      {/* Mobile: stepper verticale con connettore (nascondibile) */}
      {!hidden && (
        <ol className="flex flex-col px-4 pb-4 pt-3 sm:hidden">
          {TRADE_STEPS.map((step, index) => {
            const isLast = index === TRADE_STEPS.length - 1;
            return (
              <li
                key={step.lead}
                className={cn('flex gap-3.5', started ? 'scambi-step-enter' : 'opacity-0')}
                style={{ '--step-delay': `${index * STEP_ENTER_DELAY_MS}ms` } as CSSProperties}
              >
                <div className="flex flex-col items-center">
                  <StepBadge step={step} index={index} size="lg" />
                  {!isLast && <span className="my-1 w-0.5 flex-1 rounded-full bg-[#FF7300]/25" aria-hidden />}
                </div>
                <StepLabel
                  step={step}
                  className={cn(
                    'pt-3 text-[15px] font-semibold text-[#1D3160]',
                    !isLast && 'pb-4',
                    isLast && 'font-bold'
                  )}
                />
              </li>
            );
          })}
        </ol>
      )}

      {/* Desktop: riga orizzontale */}
      <div className="hidden flex-wrap items-center justify-center gap-y-3 px-6 py-5 sm:flex">
        {TRADE_STEPS.map((step, index) => {
          const isLast = index === TRADE_STEPS.length - 1;
          return (
            <Fragment key={step.lead}>
              <div
                className={cn(
                  'flex shrink-0 items-center gap-2.5 px-2.5',
                  started ? 'scambi-step-enter' : 'opacity-0'
                )}
                style={{ '--step-delay': `${index * STEP_ENTER_DELAY_MS}ms` } as CSSProperties}
              >
                <StepBadge step={step} index={index} />
                <StepLabel
                  step={step}
                  className={cn('whitespace-nowrap text-sm font-semibold text-[#1D3160]', isLast && 'font-bold')}
                />
              </div>
              {!isLast && (
                <ChevronRight
                  className={cn('h-4 w-4 shrink-0 text-gray-300', started ? 'scambi-step-enter' : 'opacity-0')}
                  style={{ '--step-delay': `${index * STEP_ENTER_DELAY_MS + 180}ms` } as CSSProperties}
                  aria-hidden
                />
              )}
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
  const [activeTab, setActiveTab] = useState<ScambiTabId>('richieste');
  const [openProposal, setOpenProposal] = useState<ReceivedProposal | null>(null);

  const proposals = MOCK_RECEIVED_PROPOSALS;
  const activeLabel = getTabLabel(activeTab);

  const leftTabs = TABS_LEFT.map((tab) =>
    tab.id === 'richieste' && proposals.length > 0
      ? { ...tab, count: proposals.length }
      : tab,
  );
  const rightTabs = TABS_RIGHT;

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

        {/* Titolo + banner marketing centrato sulla riga (desktop); impilati su mobile */}
        <div className="mb-6 flex flex-col items-center gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-6">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900 sm:text-3xl sm:justify-self-start">I MIEI SCAMBI</h1>

          <div className="flex items-center justify-center gap-2.5 sm:col-start-2 sm:justify-self-center">
            <TradeCardsEmblem className="h-6 w-6 shrink-0 text-[#FF7300] sm:h-7 sm:w-7" />
            <p className="text-center text-base font-extrabold uppercase tracking-widest text-[#1D3160] sm:text-lg">
              Il primo marketplace per{' '}
              <span className="text-[#FF7300]">scambiare</span>{' '}
              le tue carte
            </p>
            <TradeCardsEmblem className="h-6 w-6 shrink-0 -scale-x-100 text-[#FF7300] sm:h-7 sm:w-7" />
          </div>
        </div>

        {/* Stessa ricerca globale: dal risultato si apre il prodotto, dove ogni
            inserzione reale espone l'azione "Proponi scambio". */}
        <div className="relative z-[80] mb-6 rounded-2xl bg-[#1D3160] p-2 shadow-sm sm:p-3">
          <GlobalSearchBar />
        </div>

        <TradeStepsTicker />

        {openProposal ? (
          <ReceivedProposalDetail proposal={openProposal} onBack={() => setOpenProposal(null)} />
        ) : (
          <>
            {/* Tab — dropdown a tendina su mobile, pillole su desktop (come "Le mie vendite") */}
            <div className="mb-6">
              <OrderTabs
                leftTabs={leftTabs}
                rightTabs={rightTabs}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
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
