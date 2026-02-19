'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS_LEFT = [
  { id: 'da-pagare', label: 'DA PAGARE' },
  { id: 'pagato', label: 'PAGATO' },
  { id: 'inviato', label: 'INVIATO' },
  { id: 'ricevuto', label: 'RICEVUTO' },
  { id: 'scambi-in-corso', label: 'SCAMBI IN CORSO' },
  { id: 'scambi-effettuati', label: 'SCAMBI EFFETTUATI' },
  { id: 'acquisti-asta', label: 'ACQUISTI ASTA' },
] as const;

const TABS_RIGHT = [
  { id: 'non-ricevuto', label: 'NON RICEVUTO' },
  { id: 'cancellato', label: 'CANCELLATO' },
] as const;

const ALL_TABS = [...TABS_LEFT, ...TABS_RIGHT];

type EmptyState = {
  message: string;
  linkText?: string;
  linkHref?: string;
};

const EMPTY_STATE_BY_TAB: Record<string, EmptyState> = {
  'da-pagare': { message: 'SPIACENTE, NON HAI NESSUN ACQUISTO' },
  pagato: { message: 'SPIACENTE, NON HAI NESSUN ACQUISTO' },
  inviato: { message: 'SPIACENTE, NON HAI NESSUN ACQUISTO' },
  ricevuto: { message: 'SPIACENTE, NON HAI NESSUN ACQUISTO' },
  'scambi-in-corso': {
    message: 'SPIACENTE, NON HAI NESSUNO SCAMBIO',
    linkText: 'SCOPRI COME FARE GLI SCAMBI',
    linkHref: '/aiuto',
  },
  'scambi-effettuati': {
    message: 'SPIACENTE, NON HAI NESSUNO SCAMBIO',
    linkText: 'SCOPRI COME FARE GLI SCAMBI',
    linkHref: '/aiuto',
  },
  'acquisti-asta': {
    message: 'SPIACENTE, NON HAI NESSUN ACQUISTO',
    linkText: 'SCOPRI COME PARTECIPARE ALLE ASTE',
    linkHref: '/aiuto',
  },
  'non-ricevuto': { message: 'Spiacente, non hai nessun ordine non ricevuto.' },
  cancellato: { message: 'Spiacente, non hai nessun ordine cancellato.' },
};

function getTabLabel(tabId: string): string {
  return ALL_TABS.find((t) => t.id === tabId)?.label ?? tabId;
}

export function AcquistiContent() {
  const [activeTab, setActiveTab] = useState<string>('da-pagare');
  const activeLabel = getTabLabel(activeTab);
  const emptyState = EMPTY_STATE_BY_TAB[activeTab] ?? {
    message: 'SPIACENTE, NON HAI NESSUN ACQUISTO',
  };

  return (
    <div
      className="min-h-screen w-full px-4 py-8 text-white md:px-8 md:py-10"
      style={{
        backgroundImage:
          'linear-gradient(rgba(61, 101, 198, 0.85), rgba(29, 49, 96, 0.85)), url("/brx_bg.png"), linear-gradient(180deg, #3D65C6 0%, #1D3160 100%)',
        backgroundRepeat: 'no-repeat, repeat, no-repeat',
        backgroundSize: 'cover, auto, cover',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb e help */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <nav
            className="flex items-center gap-2 text-sm text-white/90"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="text-[#FF7300] hover:text-[#FF8C1A]" aria-label="Home">
              <Home className="h-4 w-4" />
            </Link>
            <span className="text-white/60">/</span>
            <span className="text-white/70">ORDINI</span>
            <span className="text-white/60">/</span>
            <span className="text-white/70">I MIEI ACQUISTI</span>
            <span className="text-white/60">/</span>
            <span className="text-white">{activeLabel}</span>
          </nav>
          <Link
            href="/aiuto"
            className="ml-auto text-sm font-normal text-white/90 hover:underline"
          >
            HAI BISOGNO DI AIUTO?
          </Link>
        </div>

        <h1 className="mb-4 text-2xl font-bold uppercase tracking-wide text-white sm:text-3xl">
          {activeLabel}
        </h1>

        {/* Tab: abbassati e rimpiccioliti */}
        <div className="mb-6 mt-4 flex flex-wrap items-center justify-between gap-x-1.5 gap-y-1.5 border-b border-white/20 pb-2">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
            {TABS_LEFT.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide transition-colors',
                  activeTab === tab.id
                    ? 'bg-[#FF7300] text-white'
                    : 'text-white/90 hover:text-white'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex shrink-0 flex-wrap items-center gap-x-1.5 gap-y-1.5">
            {TABS_RIGHT.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide transition-colors',
                  activeTab === tab.id
                    ? 'bg-[#FF7300] text-white'
                    : 'text-white/90 hover:text-white'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Box contenuto vuoto (messaggio + link opzionale come nelle foto) */}
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-xl bg-[#E8EAED] px-6 py-12">
          <p className="text-center text-base font-medium uppercase tracking-wide text-gray-600">
            {emptyState.message}
          </p>
          {emptyState.linkText && emptyState.linkHref && (
            <Link
              href={emptyState.linkHref}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#FF7300] hover:underline"
            >
              {emptyState.linkText}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
