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
  'non-ricevuto': { message: 'Nessun ordine non ricevuto.' },
  cancellato: { message: 'Nessun ordine cancellato.' },
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
    <div className="min-h-screen w-full font-sans" style={{ backgroundColor: '#F5F4F0' }}>
      <div className="container-content mx-auto py-8 md:py-10">
        {/* Breadcrumb + aiuto */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-gray-900" aria-label="Home">
              <Home className="h-4 w-4" />
            </Link>
            <span>/</span>
            <span>ORDINI</span>
            <span>/</span>
            <Link href="/ordini/acquisti" className="hover:text-gray-900">I MIEI ACQUISTI</Link>
            <span>/</span>
            <span className="font-medium text-gray-900">{activeLabel}</span>
          </nav>
          <Link
            href="/aiuto"
            className="text-sm font-medium text-[#FF7300] hover:underline"
          >
            HAI BISOGNO DI AIUTO?
          </Link>
        </div>

        <h1 className="mb-6 text-2xl font-bold uppercase tracking-wide text-gray-900 sm:text-3xl">
          I MIEI ACQUISTI
        </h1>

        {/* Tab: pill arrotondate come richiesto */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-x-2 gap-y-2 border-b border-gray-200 pb-3">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
            {TABS_LEFT.map((tab) => (
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
                  'rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors',
                  activeTab === tab.id
                    ? 'bg-gray-700 text-white shadow-sm'
                    : 'bg-white text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Box stato vuoto: squadrato, sfondo bianco */}
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 border border-gray-200 bg-white px-6 py-12">
          <p className="text-center text-base font-semibold uppercase tracking-wide text-gray-500">
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
