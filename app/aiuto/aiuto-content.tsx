'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function AiutoContent() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen font-sans text-white" style={{ backgroundColor: '#3D65C6' }}>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-white/90 hover:text-white hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('help.backHome')}
        </Link>
        <h1 className="mb-8 font-display text-2xl font-bold text-white md:text-3xl">{t('help.title')}</h1>

        <section id="condizioni" className="scroll-mt-8 border-b border-white/20 pb-8">
          <h2 className="mb-4 text-lg font-semibold text-white">{t('help.conditionsTitle')}</h2>
          <p className="mb-2 text-sm text-white/80">{t('help.conditionsText')}</p>
          <Link href="/legal/condizioni" className="text-sm text-white/90 hover:text-white hover:underline">
            {t('help.conditionsLink')}
          </Link>
        </section>

        <section id="comprare" className="scroll-mt-8 border-b border-white/20 py-8">
          <h2 className="mb-4 text-lg font-semibold text-white">{t('help.buyTitle')}</h2>
          <ol className="list-inside list-decimal space-y-2 text-sm text-white/80">
            <li>{t('help.buy1')}</li>
            <li>{t('help.buy2')}</li>
            <li>{t('help.buy3')}</li>
            <li>{t('help.buy4')}</li>
          </ol>
        </section>

        <section id="spedizione" className="scroll-mt-8 py-8">
          <h2 className="mb-4 text-lg font-semibold text-white">{t('help.shippingTitle')}</h2>
          <p className="text-sm text-white/80">{t('help.shippingText')}</p>
        </section>
      </main>
    </div>
  );
}
