'use client';

import { Header } from '@/components/layout/Header';
import { PrestoInArrivoBanner } from '@/components/feature/account/PrestoInArrivoBanner';
import { Search, UserCircle, Shield, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function UserSearchPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f8faff] via-white to-[#f0f4f8]">
      <Header />
      
      <div className="pointer-events-none">
        <div className="container-content pt-8">
          <PrestoInArrivoBanner className="mx-auto" />
        </div>
        
        <div className="container-content pb-20 lg:pb-28">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-5 text-4xl font-bold text-[#1D3160] sm:text-5xl lg:text-6xl">
              {t('searchUser.titlePrefix')} <span className="text-[#FF7300]">{t('searchUser.titleAccent')}</span>
            </h1>
            
            <p className="mx-auto mb-14 max-w-xl text-base leading-relaxed text-gray-500">
              {t('searchUser.subtitle')}
            </p>
            
            <p className="mx-auto mb-10 max-w-lg text-sm font-medium text-[#FF7300]">
              {t('searchUser.supportText')}
            </p>
            
            <div className="relative mx-auto max-w-lg">
              <div className="absolute inset-y-0 left-5 flex items-center">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                disabled
                placeholder={t('searchUser.placeholder')}
                className="h-14 w-full rounded-2xl border border-gray-200 bg-white/80 pl-14 pr-5 text-[#1D3160] shadow-lg shadow-gray-200/50 backdrop-blur-sm placeholder:text-gray-400"
              />
              <div className="absolute inset-y-0 right-3 flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div className="mt-16 grid gap-5 sm:grid-cols-3">
              <div className="group rounded-2xl border border-white/50 bg-white/70 p-7 shadow-xl shadow-gray-200/30 backdrop-blur-xl transition-all duration-300">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF7300]/10 to-[#FF9500]/5">
                  <Search className="h-7 w-7 text-[#FF7300]" />
                </div>
                <h3 className="mb-2 text-base font-bold text-[#1D3160]">
                  {t('searchUser.cardFindTitle')}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  {t('searchUser.cardFindDesc')}
                </p>
              </div>
              
              <div className="group rounded-2xl border border-white/50 bg-white/70 p-7 shadow-xl shadow-gray-200/30 backdrop-blur-xl transition-all duration-300">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1D3160]/10 to-[#2d4a8a]/5">
                  <UserCircle className="h-7 w-7 text-[#1D3160]" />
                </div>
                <h3 className="mb-2 text-base font-bold text-[#1D3160]">
                  {t('searchUser.cardProfilesTitle')}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  {t('searchUser.cardProfilesDesc')}
                </p>
              </div>
              
              <div className="group rounded-2xl border border-white/50 bg-white/70 p-7 shadow-xl shadow-gray-200/30 backdrop-blur-xl transition-all duration-300">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                  <Shield className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="mb-2 text-base font-bold text-[#1D3160]">
                  {t('searchUser.cardSafeTitle')}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">
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
