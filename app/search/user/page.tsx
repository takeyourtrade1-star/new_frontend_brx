'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Loader2, Search } from 'lucide-react';

import { Header } from '@/components/layout/Header';
import { authApi } from '@/lib/api/auth-client';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { PublicUserProfile, PublicUsersSearchResponse } from '@/types';

export default function UserSearchPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [items, setItems] = useState<PublicUserProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limit = 20;
  const canSearch = debouncedQuery.trim().length >= 2;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setOffset(0);
    }, 250);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    let isCancelled = false;
    const fetchUsers = async () => {
      if (!canSearch) {
        setItems([]);
        setTotal(0);
        setError(null);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await authApi.get<PublicUsersSearchResponse>(
          '/api/auth/users/search',
          {
            q: debouncedQuery,
            limit,
            offset,
          }
        );
        if (isCancelled) return;
        setItems(response?.data?.items ?? []);
        setTotal(response?.data?.total ?? 0);
      } catch (err) {
        if (isCancelled) return;
        setError('Impossibile caricare i risultati. Riprova.');
        setItems([]);
        setTotal(0);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };
    fetchUsers();
    return () => {
      isCancelled = true;
    };
  }, [canSearch, debouncedQuery, limit, offset]);

  const helperText = useMemo(() => {
    if (query.trim().length === 0) return 'Cerca per username';
    if (query.trim().length < 2) return 'Inserisci almeno 2 caratteri';
    if (isLoading) return 'Ricerca in corso...';
    if (error) return error;
    if (canSearch && items.length === 0) return 'Nessun utente trovato';
    return `${total} risultati`;
  }, [canSearch, error, isLoading, items.length, query, total]);

  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-[#ff7300]/20">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>

      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-[#ff7300]/5 blur-[100px]" />
        <div className="absolute right-[10%] top-[30%] h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <div className="container-content pb-24 pt-12 lg:pb-32 lg:pt-16">
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="mb-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl font-display">
              {t('searchUser.titlePrefix')}{' '}
              <span className="bg-gradient-to-r from-[#ff7300] to-[#ff9900] bg-clip-text text-transparent">
                {t('searchUser.titleAccent')}
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-slate-500 md:text-lg">
              {t('searchUser.subtitle')}
            </p>

            <div className="relative mx-auto mb-8 max-w-2xl">
              <div className="absolute inset-y-0 left-5 flex items-center">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('searchUser.placeholder')}
                className="h-16 w-full rounded-2xl border-0 bg-white pl-14 pr-16 text-lg text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-slate-900/5 backdrop-blur-xl transition-shadow placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff7300]/35"
              />
              <div className="absolute inset-y-0 right-3 flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-200">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ArrowRight className="h-5 w-5" />
                  )}
                </div>
              </div>
            </div>

            <div className="mx-auto mb-10 inline-flex items-center rounded-full border border-orange-500/20 bg-orange-50 px-5 py-1.5">
              <p className="text-sm font-semibold text-orange-700">{helperText}</p>
            </div>

            {canSearch ? (
              <div className="mx-auto max-w-3xl space-y-3 text-left">
                {items.map((user) => (
                  <Link
                    key={user.id}
                    href={`/users/${user.username}`}
                    className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_20px_rgb(0,0,0,0.03)] transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-base font-bold text-slate-900 group-hover:text-[#ff7300] transition-colors">
                        @{user.username}
                      </p>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {user.account_type === 'business' ? 'Venditore Business' : 'Privato'}
                        {user.country_code ? ` · ${user.country_code}` : ''}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#ff7300]" />
                  </Link>
                ))}

                {total > limit && (
                  <div className="mt-6 flex items-center justify-between">
                    <button
                      type="button"
                      disabled={offset === 0 || isLoading}
                      onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Precedente
                    </button>
                    <p className="text-sm font-semibold text-slate-600">
                      Pagina {currentPage} / {totalPages}
                    </p>
                    <button
                      type="button"
                      disabled={offset + limit >= total || isLoading}
                      onClick={() => setOffset((prev) => prev + limit)}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Successiva
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
                <div className="rounded-3xl bg-white p-8 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5">
                  <h3 className="mb-2.5 text-lg font-bold text-slate-900">{t('searchUser.cardFindTitle')}</h3>
                  <p className="text-sm font-medium leading-relaxed text-slate-500">{t('searchUser.cardFindDesc')}</p>
                </div>
                <div className="rounded-3xl bg-white p-8 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5">
                  <h3 className="mb-2.5 text-lg font-bold text-slate-900">{t('searchUser.cardProfilesTitle')}</h3>
                  <p className="text-sm font-medium leading-relaxed text-slate-500">{t('searchUser.cardProfilesDesc')}</p>
                </div>
                <div className="rounded-3xl bg-white p-8 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5">
                  <h3 className="mb-2.5 text-lg font-bold text-slate-900">{t('searchUser.cardSafeTitle')}</h3>
                  <p className="text-sm font-medium leading-relaxed text-slate-500">{t('searchUser.cardSafeDesc')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

