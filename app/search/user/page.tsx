'use client';

import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { PrestoInArrivoBanner } from '@/components/feature/account/PrestoInArrivoBanner';
import { Search, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function UserSearchPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-[#ff7300]/20">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      
      {/* Background Orbs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-[#ff7300]/5 blur-[100px]" />
        <div className="absolute right-[10%] top-[30%] h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 pointer-events-none">
        <div className="container-content pt-8 md:pt-12">
          <PrestoInArrivoBanner className="mx-auto" />
        </div>
        
        <div className="container-content pb-24 pt-12 lg:pb-32 lg:pt-16">
          <div className="mx-auto max-w-5xl text-center">
            
            {/* Hero Header */}
            <h1 className="mb-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl font-display">
              {t('searchUser.titlePrefix')}{' '}
              <span className="bg-gradient-to-r from-[#ff7300] to-[#ff9900] bg-clip-text text-transparent">
                {t('searchUser.titleAccent')}
              </span>
            </h1>
            
            <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-slate-500 md:text-lg">
              {t('searchUser.subtitle')}
            </p>
            
            {/* Search Input Mockup */}
            <div className="relative mx-auto mb-12 max-w-2xl">
              <div className="absolute inset-y-0 left-5 flex items-center">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                disabled
                placeholder={t('searchUser.placeholder')}
                className="h-16 w-full rounded-2xl border-0 bg-white pl-14 pr-16 text-lg text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-slate-900/5 backdrop-blur-xl transition-shadow placeholder:text-slate-400"
              />
              <div className="absolute inset-y-0 right-3 flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-200">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>
            </div>
            
            {/* Support Text — clean pill, no dot */}
            <div className="mx-auto mb-12 inline-flex items-center rounded-full border border-orange-500/20 bg-orange-50 px-5 py-1.5">
              <p className="text-sm font-semibold text-orange-700">
                {t('searchUser.supportText')}
              </p>
            </div>
            
            {/* Bento Grid Cards */}
            <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">

              {/* Card 1 — Trova utenti */}
              <div className="group rounded-3xl bg-white p-8 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:ring-slate-900/10">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 ring-1 ring-orange-500/15">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="#ff7300" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                    <path d="M11 8a3 3 0 1 1 0 6 3 3 0 0 1 0-6" />
                  </svg>
                </div>
                <h3 className="mb-2.5 text-lg font-bold text-slate-900">
                  {t('searchUser.cardFindTitle')}
                </h3>
                <p className="text-sm font-medium leading-relaxed text-slate-500">
                  {t('searchUser.cardFindDesc')}
                </p>
              </div>
              
              {/* Card 2 — Visualizza profili */}
              <div className="group rounded-3xl bg-white p-8 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:ring-slate-900/10">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 ring-1 ring-orange-500/15">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="#ff7300" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h3 className="mb-2.5 text-lg font-bold text-slate-900">
                  {t('searchUser.cardProfilesTitle')}
                </h3>
                <p className="text-sm font-medium leading-relaxed text-slate-500">
                  {t('searchUser.cardProfilesDesc')}
                </p>
              </div>
              
              {/* Card 3 — Community sicura */}
              <div className="group rounded-3xl bg-white p-8 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:ring-slate-900/10">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 ring-1 ring-orange-500/15">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="#ff7300" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="mb-2.5 text-lg font-bold text-slate-900">
                  {t('searchUser.cardSafeTitle')}
                </h3>
                <p className="text-sm font-medium leading-relaxed text-slate-500">
                  {t('searchUser.cardSafeDesc')}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
