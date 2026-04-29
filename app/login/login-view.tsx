'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { LoginForm } from '@/components/feature/login/login-form';
import { AuthShell, AUTH_GLASS_CLASS, AUTH_GLASS_LIGHT } from '@/components/layout/AuthShell';
import { useLanguage, LANGUAGE_NAMES } from '@/lib/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { FlagIcon } from '@/components/ui/FlagIcon';
export function LoginView() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedLang, setSelectedLang, availableLangs } = useLanguage();

  const openLoginFromUrl = searchParams.get('accesso') === '1';
  const [showLoginForm, setShowLoginForm] = useState(openLoginFromUrl);

  useEffect(() => {
    setShowLoginForm(openLoginFromUrl);
  }, [openLoginFromUrl]);

  function goToLoginForm() {
    setShowLoginForm(true);
    router.replace('/login?accesso=1');
  }

  return (
    <AuthShell>
          {showLoginForm ? (
            <div className="relative w-full max-w-[480px] mx-auto overflow-hidden rounded-[40px] bg-white/85 backdrop-blur-[60px] shadow-[0_32px_64px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.8)] border border-white/50">
              <div className="p-8 sm:p-10 flex flex-col">
                <button 
                  onClick={() => setShowLoginForm(false)} 
                  className="self-start text-[#86868b] hover:text-[#1d1d1f] mb-6 flex items-center gap-1 text-[13px] font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Indietro
                </button>
                <h1 className="text-center text-[26px] sm:text-[32px] font-bold tracking-tight text-[#1d1d1f] mb-8">
                  {t('pages.login.title')}
                </h1>
                <LoginForm />
                <div className="mt-8 pt-6 border-t border-gray-200/50 text-center">
                  <p className="text-[14px] text-[#515154]">
                    {t('pages.login.noAccount')} <Link href="/registrati" className="font-semibold text-[#0066cc] hover:underline">Registrati</Link>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative w-full max-w-[440px] mx-auto overflow-hidden rounded-[40px] bg-white/85 backdrop-blur-[60px] shadow-[0_32px_64px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.8)] border border-white/50">
              <div className="p-8 sm:p-10 flex flex-col items-center">
                {/* Header / Language Selector Centered */}
                <div className="w-full flex justify-center mb-8">
                  <div className="relative flex items-center justify-center rounded-full bg-white/60 border border-gray-200/80 shadow-sm hover:bg-white/90 transition-colors pl-4 pr-3.5 py-1.5 backdrop-blur-md">
                    <div className="flex items-center gap-2.5 pointer-events-none">
                      <span className="text-[11px] font-semibold tracking-wide text-gray-500/90 uppercase pt-[1px]">
                        {t('pages.login.demoLanding.languagePrompt')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <FlagIcon 
                          country={selectedLang === 'en' ? 'GB' : selectedLang.toUpperCase()} 
                          size="xs" 
                          className="opacity-90 shadow-sm" 
                        />
                        <span className="text-[13px] font-semibold text-gray-800 pt-[1px]">
                          {LANGUAGE_NAMES[selectedLang] ?? selectedLang}
                        </span>
                      </div>
                      <svg className="w-3.5 h-3.5 text-gray-500 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                    <select
                      id="demo_lang"
                      value={selectedLang}
                      onChange={(e) => setSelectedLang(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      aria-label={t('common.languageSelectAria')}
                    >
                      {availableLangs.map((lang) => (
                        <option key={lang} value={lang}>
                          {LANGUAGE_NAMES[lang] ?? lang}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <h1 className="text-center text-[26px] sm:text-[32px] font-bold tracking-tight text-[#1d1d1f] mb-4">
                  {t('pages.login.demoLanding.title')}
                </h1>

                <p className="text-center text-[15px] leading-[1.45] text-[#515154] mb-4">
                  Qui puoi esplorare la piattaforma e farti un&apos;idea di come funzioneranno aste,
                  acquisti e gestione del tuo account. Tutto è in fase di sviluppo e potresti
                  incontrare bug o piccole imperfezioni.
                </p>

                <p className="text-center text-[14px] text-[#86868b] mb-10">
                  Problemi? Scrivici a <br className="sm:hidden" />
                  <a href="mailto:ebartex.service@gmail.com" className="font-medium text-[#0066cc] hover:underline transition-colors">
                    ebartex.service@gmail.com
                  </a>
                </p>

                <div className="w-full flex flex-col gap-3.5">
                  <div className="grid grid-cols-2 gap-3.5">
                    <button
                      type="button"
                      onClick={goToLoginForm}
                      className="w-full rounded-full bg-white border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-4 py-3.5 text-center text-[15px] font-semibold text-[#1d1d1f] transition-all hover:bg-gray-50 active:scale-[0.98]"
                    >
                      Accedi
                    </button>
                    <Link
                      href="/registrati"
                      className="w-full rounded-full bg-[#1d1d1f] px-4 py-3.5 text-center text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Registrati
                    </Link>
                  </div>

                  <Link
                    href="/"
                    className="mt-3 w-full text-center text-[14px] font-medium text-[#86868b] hover:text-[#1d1d1f] transition-colors"
                  >
                    Esplora il sito
                  </Link>
                </div>
                
                <p className="mt-8 text-center text-[12px] font-medium text-[#86868b]">
                  La demo potrebbe cambiare mentre lavoriamo su nuove funzionalità.
                </p>
              </div>
            </div>
          )}
    </AuthShell>
  );
}
