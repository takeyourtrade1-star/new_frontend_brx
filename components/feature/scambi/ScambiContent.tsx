'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, ChevronRight, Search, Coins, Send, Clock, Inbox, CheckCircle2, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScambiIcon } from '@/components/ui/ScambiIcon';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { OrderTabs, type OrderTab } from '@/components/feature/ordini/OrderTabs';
import { ScambiResultsGrid } from './scambi-browse-shared';
import type { ScambioUI } from './scambi-types';
import { fetchScambiCatalog } from '@/lib/scambi/scambi-catalog';
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

/** Tutorial passi dello scambio: stepper verticale su mobile, riga su desktop. */
function TradeStepsTicker() {
  const [started, setStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
      {/* Mobile: stepper verticale con connettore */}
      <ol className="flex flex-col px-4 py-4 sm:hidden">
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

/** Barra di ricerca interna agli scambi: stessa logica della ricerca principale,
 *  ma cerca solo nel catalogo degli scambi. */
function TradeSearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex w-full items-center gap-2 rounded-full bg-white py-1.5 pl-4 pr-1.5 shadow-sm ring-1 ring-gray-200 transition focus-within:ring-2 focus-within:ring-[#FF7300]/40"
    >
      <Search className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Che cosa cerchi da scambiare?"
        enterKeyHint="search"
        inputMode="search"
        className="min-w-0 flex-1 bg-transparent text-base text-gray-900 placeholder:text-gray-500 focus:outline-none md:text-sm"
        aria-label="Cerca tra gli scambi"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Cancella ricerca"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <button
        type="submit"
        aria-label="Cerca"
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#FF7300] px-4 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#e66800] active:scale-95"
      >
        <Search className="h-4 w-4" strokeWidth={2.5} aria-hidden />
        <span className="hidden sm:inline">Cerca</span>
      </button>
    </form>
  );
}

export function ScambiContent() {
  const [activeTab, setActiveTab] = useState<ScambiTabId>('richieste');
  const [openProposal, setOpenProposal] = useState<ReceivedProposal | null>(null);

  // Ricerca interna sul catalogo scambi (caricato pigramente alla prima ricerca).
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [catalog, setCatalog] = useState<ScambioUI[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const runSearch = useCallback(() => {
    const q = searchInput.trim();
    setActiveQuery(q);
    if (q && catalog.length === 0) {
      setCatalogLoading(true);
      fetchScambiCatalog(60)
        .then((rows) => setCatalog(rows))
        .finally(() => setCatalogLoading(false));
    }
  }, [searchInput, catalog.length]);

  const clearSearch = useCallback(() => {
    setSearchInput('');
    setActiveQuery('');
  }, []);

  const searchResults = useMemo(() => {
    const needle = activeQuery.trim().toLowerCase();
    if (!needle) return [];
    return catalog.filter(
      (s) =>
        s.title.toLowerCase().includes(needle) || s.seller.toLowerCase().includes(needle),
    );
  }, [activeQuery, catalog]);

  const hasActiveSearch = activeQuery.trim().length > 0;

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
            <p className="text-base font-extrabold uppercase tracking-widest text-[#1D3160] sm:text-lg">
              Il primo marketplace per{' '}
              <span className="text-[#FF7300]">scambiare</span>{' '}
              le tue carte
            </p>
            <TradeCardsEmblem className="h-6 w-6 shrink-0 -scale-x-100 text-[#FF7300] sm:h-7 sm:w-7" />
          </div>
        </div>

        {/* Ricerca interna agli scambi */}
        <div className="mb-6">
          <TradeSearchBar
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={runSearch}
            onClear={clearSearch}
          />
        </div>

        {hasActiveSearch ? (
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                Risultati per{' '}
                <span className="font-bold text-gray-900">«{activeQuery}»</span>
              </p>
              <button
                type="button"
                onClick={clearSearch}
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#FF7300] transition hover:underline"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Chiudi ricerca
              </button>
            </div>

            {catalogLoading ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-6 py-12 shadow-sm">
                <Loader2 className="h-6 w-6 animate-spin text-[#FF7300]" aria-hidden />
                <p className="text-sm text-gray-500">Caricamento scambi…</p>
              </div>
            ) : searchResults.length > 0 ? (
              <ScambiResultsGrid scambi={searchResults} />
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-xl border border-gray-300 bg-white px-6 py-12 shadow-sm">
                <p className="text-center text-base font-semibold uppercase tracking-wide text-gray-500">
                  Nessuno scambio trovato per «{activeQuery}»
                </p>
              </div>
            )}
          </section>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
