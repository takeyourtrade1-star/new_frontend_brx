'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, List, Trash2, ChevronRight, ArrowUpDown, Heart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { AccountBreadcrumb } from '@/components/feature/account/AccountBreadcrumb';

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
    <div className="min-h-[calc(100vh-80px)] bg-[#F5F4F0] pb-16">
      <section className="px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <AccountBreadcrumb current="breadcrumb.lista-desideri" />

          {/* Header */}
          <div className="mb-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#1D3160] shadow-sm ring-1 ring-black/[0.04] backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-[#FF7300]" aria-hidden />
                {t('accountPage.wantlistComingSoonBadge')}
              </span>
              <span className="text-xs text-gray-500">{t('accountPage.wantlistComingSoonHint')}</span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-[#1D3160] sm:text-4xl">
              {t('accountPage.wantlistTitle')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
              {t('accountPage.wantlistDesc')}
            </p>
          </div>

          {/* Nuova lista */}
          <form
            onSubmit={handleAddList}
            className="mb-8 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6"
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">
              {t('accountPage.wantlistNew')}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
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
                    'w-full rounded-xl border bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF7300]/30',
                    nameError ? 'border-red-300' : 'border-gray-200'
                  )}
                />
                {nameError ? (
                  <p className="mt-1.5 text-xs text-red-500">{nameError}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-gray-400">{t('accountPage.wantlistNameHint')}</p>
                )}
              </div>
              <button
                type="submit"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF7300] to-[#FF8800] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-[#FF7300]/20 transition-all hover:brightness-110 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                {t('accountPage.wantlistAddList')}
              </button>
            </div>
          </form>

          {/* Liste o empty state */}
          {lists.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300/80 bg-white/60 px-6 py-16 text-center backdrop-blur-sm">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1D3160]/8 to-[#1D3160]/4 ring-1 ring-[#1D3160]/10">
                <Heart className="h-7 w-7 text-[#FF7300]/70" aria-hidden />
              </div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                {t('accountPage.wantlistEmpty')}
              </p>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-gray-500">
                {t('accountPage.wantlistEmptyHint')}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <div className="min-w-[380px]">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-gray-100 bg-gray-50/80 px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <button type="button" className="flex items-center gap-1 text-left hover:text-gray-700">
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
                        'grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-4 text-sm transition-colors hover:bg-orange-50/40',
                        i > 0 && 'border-t border-gray-100'
                      )}
                    >
                      <Link
                        href={`/account/lista-desideri/${list.id}`}
                        className="flex min-w-0 items-center gap-2 font-medium text-gray-900 hover:text-[#FF7300]"
                      >
                        <List className="h-4 w-4 shrink-0 text-gray-400" />
                        <span className="truncate">{list.name}</span>
                        <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-gray-400 sm:ml-1" />
                      </Link>
                      <span className="text-right tabular-nums text-gray-500">
                        {t('accountPage.wantlistCardsCount', { count: list.cardCount })}
                      </span>
                      <span className="text-right font-mono text-xs tabular-nums text-gray-400">{list.createdAt}</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(list.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        aria-label={t('accountPage.wantlistDeleteAria', { name: list.name })}
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
