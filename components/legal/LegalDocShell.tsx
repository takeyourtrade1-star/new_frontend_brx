'use client';

import Link from 'next/link';
import { ChevronLeft, FileCheck } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { LOCALE_TO_INTL } from '@/lib/i18n/locales';
import type { UiLocale } from '@/lib/i18n/locales';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { LegalNav } from '@/components/legal/LegalNav';
import { COMPANY_INFO } from '@/lib/legal/company-info';

export function LegalDocShell({
  titleKey,
  lastUpdated,
  children,
}: {
  titleKey: MessageKey;
  lastUpdated?: string;
  children: React.ReactNode;
}) {
  const { t, locale } = useTranslation();
  const intl = LOCALE_TO_INTL[locale as UiLocale] ?? 'it-IT';
  const updatedLabel = lastUpdated ?? new Date().toLocaleDateString(intl);

  return (
    <div className="relative overflow-hidden pb-16 pt-6 md:pb-24 md:pt-10">
      {/* Sfondo decorativo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#FF7300]/10 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="container-content relative mx-auto px-4">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('help.backHome')}
        </Link>

        {/* Hero */}
        <header className="mb-8 md:mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#FF7300]/30 bg-[#FF7300]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#FFB380]">
            <FileCheck className="h-3.5 w-3.5" aria-hidden />
            {COMPANY_INFO.tradeName} · {COMPANY_INFO.legalName}
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl">
            {t(titleKey)}
          </h1>
          <p className="mt-3 text-sm text-white/60">
            {t('legal.lastUpdated')} <span className="font-medium text-white/80">{updatedLabel}</span>
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <LegalNav />
          </aside>

          <article className="legal-document rounded-2xl border border-white/20 bg-white p-6 shadow-2xl shadow-black/20 md:p-10 lg:p-12">
            <div className="space-y-8">{children}</div>
          </article>
        </div>
      </div>
    </div>
  );
}
