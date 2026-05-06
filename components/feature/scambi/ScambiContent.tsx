'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';

const TABS = [
  { id: 'richieste', label: 'RICHIESTE IN ATTESA' },
  { id: 'inviate', label: 'INVIATE' },
  { id: 'conclusi', label: 'CONCLUSI' },
] as const;

type EmptyState = {
  message: string;
  linkText?: string;
  linkHref?: string;
};

const EMPTY_STATE_BY_TAB: Record<string, EmptyState> = {
  richieste: { message: 'NESSUNA RICHIESTA IN ATTESA' },
  inviate: { message: 'NESSUNA PROPOSTA INVIATA' },
  conclusi: { message: 'NESSUNO SCAMBIO CONCLUSO' },
};

function getTabLabel(tabId: string): string {
  return TABS.find((t) => t.id === tabId)?.label ?? tabId;
}

export function ScambiContent() {
  const [activeTab, setActiveTab] = useState<string>('richieste');
  const activeLabel = getTabLabel(activeTab);
  const emptyState = EMPTY_STATE_BY_TAB[activeTab] ?? {
    message: 'NESSUNO SCAMBIO',
  };
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
    { href: '/scambi', label: 'I MIEI SCAMBI', isCurrent: false },
    { label: activeLabel, isCurrent: true },
  ];

  return (
    <div className="min-h-screen w-full font-sans" style={{ backgroundColor: '#F5F4F0' }}>
      <div className="container-content mx-auto py-8 md:py-10">
        {/* Breadcrumb + aiuto */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <AppBreadcrumb items={breadcrumbItems} ariaLabel="Breadcrumb" variant="default" className="w-auto text-sm" />
          <Link
            href="/aiuto"
            className="text-sm font-medium text-[#FF7300] hover:underline"
          >
            HAI BISOGNO DI AIUTO?
          </Link>
        </div>

        <h1 className="mb-6 text-2xl font-bold uppercase tracking-wide text-gray-900 sm:text-3xl">
          I MIEI SCAMBI
        </h1>

        {/* Notifiche scambi — scrollabili quando multiple */}
        <div className="mb-6 flex max-h-[200px] flex-col gap-2 overflow-y-auto pr-1">
          {/* Mockup notifica 1 */}
          <div className="group flex items-center gap-3 overflow-hidden rounded-full bg-white pl-1.5 pr-3 py-1.5 ring-1 ring-inset ring-gray-200 transition hover:ring-gray-300">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF7300]">
              <ArrowLeftRight className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1 py-0.5">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-[#1D3160]">Nuova proposta</p>
                <span className="relative inline-flex items-center overflow-hidden rounded-full bg-gradient-to-r from-[#FF7300] to-[#FF5500] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  <span className="relative z-10">NUOVO</span>
                  <span className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                </span>
              </div>
              <p className="text-[11px] leading-tight text-gray-500">Qualcuno vuole scambiare una carta con te.</p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-full bg-[#1D3160] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-[#FF7300] active:scale-[0.98]"
            >
              Guarda
            </button>
          </div>

          {/* Mockup notifica 2 */}
          <div className="group flex items-center gap-3 overflow-hidden rounded-full bg-white pl-1.5 pr-3 py-1.5 ring-1 ring-inset ring-gray-200 transition hover:ring-gray-300">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF7300]">
              <ArrowLeftRight className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1 py-0.5">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-[#1D3160]">Proposta accettata</p>
                <span className="inline-flex items-center rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">OK</span>
              </div>
              <p className="text-[11px] leading-tight text-gray-500">La tua offerta per Black Lotus è stata accettata.</p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-full ring-1 ring-inset ring-[#1D3160] bg-white px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#1D3160] transition hover:bg-[#1D3160] hover:text-white active:scale-[0.98]"
            >
              Dettagli
            </button>
          </div>
        </div>

        {/* Tab: pill arrotondate */}
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
              {tab.label}
            </button>
          ))}
        </div>

        {/* Box stato vuoto */}
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
