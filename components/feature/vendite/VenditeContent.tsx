'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Home,
  Package,
  Sparkles,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import { VenditeSaleCard } from './VenditeSaleCard';
import {
  countByStato,
  filterVendite,
  MOCK_VENDITE,
  VENDITA_TAB_META,
  type VenditaStato,
} from './venditeMockData';

type TabId = VenditaStato | 'tutte';

const SUMMARY_CARDS: {
  id: TabId;
  icon: typeof Clock;
  ring: string;
  pill: string;
}[] = [
  {
    id: 'in-attesa-pagamento',
    icon: Clock,
    ring: 'ring-amber-400/60',
    pill: 'bg-amber-50 text-amber-700 ring-amber-200/70',
  },
  {
    id: 'da-spedire',
    icon: Package,
    ring: 'ring-[#FF7300]/50',
    pill: 'bg-[#FF7300]/10 text-[#c45a00] ring-[#FF7300]/20',
  },
  {
    id: 'spedito',
    icon: Truck,
    ring: 'ring-blue-400/50',
    pill: 'bg-blue-50 text-blue-700 ring-blue-200/70',
  },
  {
    id: 'completato',
    icon: CheckCircle2,
    ring: 'ring-emerald-400/50',
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
  },
];

function getTabMeta(id: TabId) {
  return VENDITA_TAB_META.find((t) => t.id === id) ?? VENDITA_TAB_META[0];
}

export function VenditeContent() {
  const [activeTab, setActiveTab] = useState<TabId>('tutte');

  const filtered = useMemo(() => filterVendite(activeTab), [activeTab]);
  const tabMeta = getTabMeta(activeTab);
  const totalRevenue = useMemo(
    () => MOCK_VENDITE.reduce((sum, v) => sum + v.price, 0),
    [],
  );

  const breadcrumbItems: AppBreadcrumbItem[] = useMemo(
    () => [
      {
        href: '/',
        label: 'Home',
        ariaLabel: 'Home',
        icon: <Home className="h-4 w-4" />,
        iconOnly: true,
        isCurrent: false,
      },
      { label: 'Ordini', isCurrent: false },
      { href: '/ordini/vendite', label: 'Le mie vendite', isCurrent: false },
      { label: tabMeta.label, isCurrent: true },
    ],
    [tabMeta.label],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F5F5F7] pb-20 pt-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-[#FF7300]/[0.07] blur-3xl" />
        <div className="absolute -right-24 top-48 h-80 w-80 rounded-full bg-[#1D3160]/[0.05] blur-3xl" />
        <div className="absolute bottom-16 left-1/4 h-64 w-64 rounded-full bg-emerald-400/[0.04] blur-3xl" />
      </div>

      <div className="container-content relative">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <AppBreadcrumb
            items={breadcrumbItems}
            ariaLabel="Breadcrumb"
            variant="default"
            className="w-auto text-sm"
          />
          <Link
            href="/aiuto"
            className="text-[13px] font-medium text-[#FF7300] transition hover:text-[#e56800]"
          >
            Hai bisogno di aiuto?
          </Link>
        </div>

        <header className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2.5">
                <h1 className="text-[1.75rem] font-semibold tracking-tight text-[#1D1D1F] sm:text-[2rem]">
                  Le mie vendite
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1D3160]/15 bg-[#1D3160]/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#1D3160] backdrop-blur-md">
                  <Sparkles className="h-3 w-3 text-[#FF7300]" aria-hidden />
                  In arrivo
                </span>
              </div>
              <p className="max-w-2xl text-[15px] leading-relaxed text-[#6E6E73]">
                Anteprima della nuova area vendite: gestione avanzata di pagamenti, spedizioni e
                chiusura ordini. I dati mostrati sono dimostrativi.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-[13px] font-medium text-[#6E6E73] shadow-sm backdrop-blur-md">
                <Package className="h-4 w-4 text-[#FF7300]" aria-hidden />
                {MOCK_VENDITE.length} vendite nel mockup
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-[13px] font-medium text-[#6E6E73] shadow-sm backdrop-blur-md">
                <TrendingUp className="h-4 w-4 text-emerald-600" aria-hidden />
                <span>
                  Valore totale{' '}
                  <span className="font-semibold tabular-nums text-[#1D1D1F]">
                    {new Intl.NumberFormat('it-IT', {
                      style: 'currency',
                      currency: 'EUR',
                      maximumFractionDigits: 0,
                    }).format(totalRevenue)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </header>

        <div
          className="mb-8 flex items-start gap-3 rounded-2xl border border-white/60 bg-white/50 px-4 py-3.5 shadow-[0_2px_20px_rgba(15,23,42,0.04)] backdrop-blur-xl sm:px-5"
          role="status"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FF7300]/10 ring-1 ring-[#FF7300]/20">
            <Sparkles className="h-4 w-4 text-[#FF7300]" aria-hidden />
          </span>
          <p className="text-[13px] leading-relaxed text-[#6E6E73] sm:text-sm">
            <span className="font-semibold text-[#1D1D1F]">Coming soon — gestione vendite avanzata.</span>{' '}
            Stiamo finalizzando strumenti per etichette di spedizione, messaggistica con
            l&apos;acquirente e incassi automatici. Esplora liberamente questo mockup ad alta
            fedeltà.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3">
          {SUMMARY_CARDS.map((card) => {
            const meta = getTabMeta(card.id);
            const Icon = card.icon;
            const count = countByStato(card.id as VenditaStato);
            const isActive = activeTab === card.id;

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setActiveTab(card.id)}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border border-white/60 bg-white/55 p-3.5 text-left shadow-[0_2px_16px_rgba(0,0,0,0.04)] backdrop-blur-xl transition hover:bg-white/75 sm:p-4',
                  isActive && cn('ring-2 ring-offset-2 ring-offset-[#F5F5F7]', card.ring),
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1',
                    card.pill,
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-lg font-semibold tabular-nums text-[#1D1D1F]">
                    {count}
                  </span>
                  <span className="block truncate text-[11px] font-medium text-[#6E6E73] sm:text-xs">
                    {meta.shortLabel}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div
          role="tablist"
          aria-label="Fasi del processo di vendita"
          className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-white/60 bg-white/45 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {VENDITA_TAB_META.map((tab) => {
            const isActive = activeTab === tab.id;
            const count =
              tab.id === 'tutte' ? MOCK_VENDITE.length : countByStato(tab.id as VenditaStato);

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 sm:flex-1 sm:px-4',
                  isActive
                    ? 'bg-white text-[#1D1D1F] shadow-[0_4px_14px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60'
                    : 'text-[#6E6E73] hover:bg-white/50 hover:text-[#1D1D1F]',
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                    isActive ? 'bg-[#FF7300]/10 text-[#FF7300]' : 'bg-slate-200/80 text-slate-600',
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mb-4 text-[13px] text-[#86868B]">{tabMeta.description}</p>

        {filtered.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-slate-200/70 bg-white/40 px-8 py-16 text-center backdrop-blur-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-inner ring-1 ring-slate-200/60">
              <Package className="h-6 w-6 text-slate-400" aria-hidden />
            </div>
            <p className="text-base font-semibold text-[#1D1D1F]">Nessuna vendita in questa fase</p>
            <p className="mt-1 max-w-sm text-sm text-[#6E6E73]">
              Quando la funzionalità sarà attiva, qui vedrai gli ordini corrispondenti.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filtered.map((vendita) => (
              <VenditeSaleCard
                key={vendita.id}
                vendita={vendita}
                showStatoBadge={activeTab === 'tutte'}
              />
            ))}
            <p className="pt-2 text-center text-xs text-[#86868B]">
              {filtered.length}{' '}
              {filtered.length === 1 ? 'vendita mostrata' : 'vendite mostrate'}
              {activeTab !== 'tutte' ? ` · ${tabMeta.label}` : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
