'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { LOCALE_TO_INTL } from '@/lib/i18n/locales';
import type { UiLocale } from '@/lib/i18n/locales';
import type { MessageKey } from '@/lib/i18n/messages/en';

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
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm text-white/90 hover:text-white hover:underline"
      >
        <ChevronLeft className="h-4 w-4" />
        {t('help.backHome')}
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold text-white md:text-3xl">{t(titleKey)}</h1>
      <p className="mb-4 text-sm text-white/80">
        {t('legal.lastUpdated')} {updatedLabel}
      </p>
      <div className="max-w-none space-y-6 text-sm text-white/90">{children}</div>
    </div>
  );
}
