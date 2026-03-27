'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, Plus, Trash2, Search, ArrowUpDown } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

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
    <div className="font-sans text-gray-900">
      <nav
        className="mb-6 flex items-center gap-2 text-sm uppercase tracking-wide text-gray-500"
        aria-label={t('accountPage.breadcrumbNav')}
      >
        <Link href="/" className="hover:text-gray-900" aria-label={t('breadcrumb.home')}>
          <Home className="h-4 w-4" />
        </Link>
        <span>/</span>
        <Link href="/ordini/acquisti" className="hover:text-gray-900">
          {t('breadcrumb.acquisti')}
        </Link>
        <span>/</span>
        <Link href="/account/lista-desideri" className="hover:text-gray-900">
          {t('accountPage.wantlistTitle')}
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-900">{listName.toUpperCase()}</span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold uppercase tracking-wide text-gray-900 sm:text-3xl">
        {listName}
      </h1>

      <div className="mb-6 border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
          {t('accountPage.wantlistDetailAddCard')}
        </p>
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('accountPage.wantlistDetailSearchPh')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF7300]"
            />
          </div>
          <button
            type="button"
            className="flex items-center gap-2 bg-[#FF7300] px-4 py-2 text-sm font-semibold uppercase text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            {t('accountPage.wantlistDetailAdd')}
          </button>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center border border-gray-200 bg-white py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            {t('accountPage.wantlistDetailEmpty')}
          </p>
          <p className="mt-1 text-xs text-gray-400">{t('accountPage.wantlistDetailEmptyHint')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 bg-white">
          <div className="min-w-[480px]">
            <div className="grid grid-cols-[2fr_1fr_auto_auto_auto_auto] items-center gap-4 border-b border-gray-100 bg-gray-50 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-500">
              <button type="button" className="flex items-center gap-1 hover:text-gray-700">
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
                className={`grid grid-cols-[2fr_1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3 text-sm hover:bg-gray-50 ${i > 0 ? 'border-t border-gray-100' : ''}`}
              >
                <span className="font-medium text-gray-900">{card.name}</span>
                <span className="text-gray-500">{card.set}</span>
                <span className="tabular-nums text-gray-700">{card.quantity}</span>
                <span className="text-gray-500">{card.language}</span>
                <span className="text-gray-500">{card.condition}</span>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center text-gray-400 transition-colors hover:text-red-500"
                  aria-label={t('accountPage.wantlistDetailRemoveAria', { name: card.name })}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
