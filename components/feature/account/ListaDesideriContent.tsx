'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, Plus, List, Trash2, ChevronRight, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

type Wantlist = {
  id: string;
  name: string;
  cardCount: number;
  createdAt: string;
};

const MOCK_LISTS: Wantlist[] = [];

export function ListaDesideriContent() {
  const { t, locale } = useTranslation();
  const [lists, setLists] = useState<Wantlist[]>(MOCK_LISTS);
  const [newListName, setNewListName] = useState('');
  const [nameError, setNameError] = useState('');

  function handleAddList(e: React.FormEvent) {
    e.preventDefault();
    const name = newListName.trim();
    if (!name) {
      setNameError(t('accountPage.wantlistErrEmpty'));
      return;
    }
    if (name.length > 30) {
      setNameError(t('accountPage.wantlistErrMax'));
      return;
    }
    if (!/^[a-zA-Z0-9\s\-_àáâãäåçèéêëìíîïñòóôõöùúûü]+$/i.test(name)) {
      setNameError(t('accountPage.wantlistErrChars'));
      return;
    }
    setLists((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name,
        cardCount: 0,
        createdAt: new Date().toLocaleDateString(locale, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      },
    ]);
    setNewListName('');
    setNameError('');
  }

  function handleDelete(id: string) {
    setLists((prev) => prev.filter((l) => l.id !== id));
  }

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
        <span className="font-medium text-gray-900">{t('accountPage.wantlistTitle')}</span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold uppercase tracking-wide text-gray-900 sm:text-3xl">
        {t('accountPage.wantlistTitle')}
      </h1>

      <div className="mb-6 border-l-4 border-[#FF7300] bg-orange-50/60 p-4 text-sm text-gray-700">
        {t('accountPage.wantlistDesc')}
      </div>

      <form onSubmit={handleAddList} className="mb-8 border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
          {t('accountPage.wantlistNew')}
        </p>
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-[220px] flex-1">
            <input
              type="text"
              placeholder={t('accountPage.wantlistNamePlaceholder')}
              value={newListName}
              onChange={(e) => {
                setNewListName(e.target.value);
                setNameError('');
              }}
              maxLength={30}
              className={cn(
                'w-full border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF7300]',
                nameError ? 'border-red-400' : 'border-gray-300'
              )}
            />
            {nameError ? (
              <p className="mt-1 text-xs text-red-500">{nameError}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-400">{t('accountPage.wantlistNameHint')}</p>
            )}
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 bg-[#FF7300] px-5 py-2 text-sm font-semibold uppercase text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            {t('accountPage.wantlistAddList')}
          </button>
        </div>
      </form>

      {lists.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center border border-gray-200 bg-white py-16 text-center">
          <List className="mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            {t('accountPage.wantlistEmpty')}
          </p>
          <p className="mt-1 text-xs text-gray-400">{t('accountPage.wantlistEmptyHint')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 bg-white">
          <div className="min-w-[380px]">
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-gray-100 bg-gray-50 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-500">
              <button type="button" className="flex items-center gap-1 hover:text-gray-700">
                {t('accountPage.wantlistColName')} <ArrowUpDown className="h-3 w-3" />
              </button>
              <span className="text-right">{t('accountPage.wantlistColCards')}</span>
              <span className="text-right">{t('accountPage.wantlistColCreated')}</span>
              <span />
            </div>

            {lists.map((list, i) => (
              <div
                key={list.id}
                className={cn(
                  'grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-3.5 text-sm transition-colors hover:bg-gray-50',
                  i > 0 && 'border-t border-gray-100'
                )}
              >
                <Link
                  href={`/account/lista-desideri/${list.id}`}
                  className="flex items-center gap-2 font-medium text-gray-900 hover:text-[#FF7300]"
                >
                  <List className="h-4 w-4 shrink-0 text-gray-400" />
                  {list.name}
                  <ChevronRight className="ml-1 h-3.5 w-3.5 text-gray-400" />
                </Link>
                <span className="text-right tabular-nums text-gray-500">
                  {t('accountPage.wantlistCardsCount', { count: list.cardCount })}
                </span>
                <span className="text-right font-mono text-xs tabular-nums text-gray-400">{list.createdAt}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(list.id)}
                  className="flex h-7 w-7 items-center justify-center text-gray-400 transition-colors hover:text-red-500"
                  aria-label={t('accountPage.wantlistDeleteAria', { name: list.name })}
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
