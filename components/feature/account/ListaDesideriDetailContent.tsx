'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Search, ArrowUpDown, ArrowLeft, Sparkles } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { AccountBreadcrumb } from '@/components/feature/account/AccountBreadcrumb';

type WantCard = {
  id: string;
  name: string;
  set: string;
  quantity: number;
  language: string;
  condition: string;
};

const MOCK_CARDS: WantCard[] = [];

export function ListaDesideriDetailContent({ listId }: { listId: string }) {
  const { t } = useTranslation();
  const [cards] = useState<WantCard[]>(MOCK_CARDS);
  const [search, setSearch] = useState('');

  const listName = `${t('accountPage.wantlistTitle')} ${listId}`;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F5F4F0] pb-16">
      <section className="px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <AccountBreadcrumb current="breadcrumb.lista-desideri" />

          <Link
            href="/account/lista-desideri"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-[#FF7300]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('accountPage.wantlistBackToLists')}
          </Link>

          <div className="mb-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#1D3160] shadow-sm ring-1 ring-black/[0.04] backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-[#FF7300]" aria-hidden />
                {t('accountPage.wantlistComingSoonBadge')}
              </span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-[#1D3160] sm:text-3xl">
              {listName}
            </h1>
          </div>

          <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">
              {t('accountPage.wantlistDetailAddCard')}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('accountPage.wantlistDetailSearchPh')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF7300]/30"
                />
              </div>
              <button
                type="button"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF7300] to-[#FF8800] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-[#FF7300]/20 transition-all hover:brightness-110 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                {t('accountPage.wantlistDetailAdd')}
              </button>
            </div>
          </div>

          {cards.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300/80 bg-white/60 px-6 py-16 text-center backdrop-blur-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                {t('accountPage.wantlistDetailEmpty')}
              </p>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-gray-500">
                {t('accountPage.wantlistDetailEmptyHint')}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <div className="min-w-[480px]">
                  <div className="grid grid-cols-[2fr_1fr_auto_auto_auto_auto] items-center gap-4 border-b border-gray-100 bg-gray-50/80 px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <button type="button" className="flex items-center gap-1 text-left hover:text-gray-700">
                      {t('accountPage.wantlistDetailColCard')} <ArrowUpDown className="h-3 w-3" />
                    </button>
                    <span>{t('accountPage.wantlistDetailColSet')}</span>
                    <span>{t('accountPage.wantlistDetailColQty')}</span>
                    <span>{t('accountPage.wantlistDetailColLang')}</span>
                    <span>{t('accountPage.wantlistDetailColCond')}</span>
                    <span />
                  </div>
                  {cards.map((card, i) => (
                    <div
                      key={card.id}
                      className={`grid grid-cols-[2fr_1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5 text-sm transition-colors hover:bg-orange-50/40 ${i > 0 ? 'border-t border-gray-100' : ''}`}
                    >
                      <span className="font-medium text-gray-900">{card.name}</span>
                      <span className="text-gray-500">{card.set}</span>
                      <span className="tabular-nums text-gray-700">{card.quantity}</span>
                      <span className="text-gray-500">{card.language}</span>
                      <span className="text-gray-500">{card.condition}</span>
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        aria-label={t('accountPage.wantlistDetailRemoveAria', { name: card.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
