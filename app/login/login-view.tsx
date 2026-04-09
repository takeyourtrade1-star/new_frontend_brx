'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/feature/login/login-form';
import { getCdnImageUrl } from '@/lib/config';
import { useLanguage, LANGUAGE_NAMES } from '@/lib/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function LoginView() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedLang, setSelectedLang, availableLangs } = useLanguage();

  const liquidGlass =
    'rounded-[24px] border border-gray-100/30 border-t border-l border-white/60 bg-white/60 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.05)]';

  const carouselBg = getCdnImageUrl('carousel/slide1.jpg');
  const logoUrl = getCdnImageUrl('logo.png');

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
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#2d2d2d]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${carouselBg}")` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#2d2d2d]/25" aria-hidden />

      <div className="relative z-10 flex min-h-screen flex-col pt-8">
        <div className="flex justify-center px-4">
          <Link
            href="/"
            className="relative block h-[80px] w-[200px] sm:h-[100px] sm:w-[260px]"
            aria-label={t('pages.auth.homeAria')}
          >
            <Image
              src={logoUrl}
              alt="Ebartex"
              fill
              className="object-contain object-center"
              priority
              sizes="(max-width: 640px) 200px, 260px"
              unoptimized
            />
          </Link>
        </div>
        <div className="mx-auto mt-8 w-full max-w-lg flex-1 px-4 pb-24 flex flex-col">
          {showLoginForm ? (
            <>
              <div
                className={`${liquidGlass} overflow-hidden`}
              >
                <div className="p-6 sm:p-8 md:p-10">
                  <h1 className="mb-6 text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                    {t('pages.login.title')}
                  </h1>

                  <LoginForm />

                  <div className="mt-6 border-t border-gray-100/70 pt-6 text-center">
                    <Link
                      href="/registrati"
                      className="text-sm font-semibold text-[#FF7300] hover:underline underline-offset-4"
                    >
                      {t('pages.login.noAccount')}
                    </Link>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={`${liquidGlass} overflow-hidden`}>
                <div className="p-5 sm:p-6 md:p-7 flex flex-col items-center">
                  <h1 className="text-center text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                    {t('pages.login.demoLanding.title')}
                  </h1>

                  <div className="mt-4 w-full max-w-md text-center">
                    <label
                      htmlFor="demo_lang"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {t('pages.login.demoLanding.languagePrompt')}
                    </label>
                    <div className="mt-2 mx-auto flex w-full max-w-sm items-center justify-center rounded-xl border border-gray-100/50 bg-white/70 px-3 py-2 backdrop-blur-md">
                      <select
                        id="demo_lang"
                        value={selectedLang}
                        onChange={(e) => setSelectedLang(e.target.value)}
                        className="w-full min-w-[12rem] bg-transparent text-sm font-semibold text-gray-900 outline-none"
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

                  <Link
                    href="/demo"
                    className="mt-5 w-full block rounded-2xl border border-gray-100/40 bg-white/65 p-4 transition-all hover:scale-[1.01] active:scale-[0.995]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-orange-100/60 bg-orange-50/70 text-[#FF7300]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="4 17 10 11 4 5" />
                          <line x1="12" y1="19" x2="20" y2="19" />
                        </svg>
                      </div>
                      <div>
                        <p className="mt-1.5 text-lg font-semibold text-gray-900">
                          {t('pages.login.demoLanding.cardTitle')}
                        </p>
                        <p className="mt-1.5 text-xs leading-relaxed text-gray-700/80">
                          {t('pages.login.demoLanding.cardSubtitle')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-center">
                      <span className="btn-orange-glow inline-flex items-center justify-center rounded-full px-7 py-2">
                        {t('pages.login.demoLanding.ctaDemo')}
                      </span>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="mt-4 w-full flex items-center justify-center relative z-20">
                <div className="flex items-center justify-center gap-2 rounded-full border border-gray-100/50 bg-white/65 px-3 py-1.5 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
                  <Link
                    href="/"
                    className="rounded-full border border-orange-100/60 bg-orange-50/60 px-3 py-1 text-xs font-semibold text-[#FF7300] transition-all duration-200 hover:bg-orange-50 hover:scale-[1.02] active:scale-95"
                  >
                    {t('pages.login.demoLanding.ctaViewSite')}
                  </Link>
                  <span className="text-[#FF7300]/70 select-none text-xs" aria-hidden>
                    |
                  </span>
                  <button
                    type="button"
                    onClick={goToLoginForm}
                    className="btn-orange-glow rounded-full px-3 py-1 text-xs"
                  >
                    {t('pages.login.demoLanding.ctaLoginNow')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
