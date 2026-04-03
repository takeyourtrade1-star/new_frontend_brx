"use client";

import { Header } from '@/components/layout/Header';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function BiddingPage() {
  const searchParams = useSearchParams();
  const auctionId = searchParams.get('auctionId') ?? undefined;
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-white">
      <Header />
      
      <div className="container-content py-8">
        <Link
          href={auctionId ? `/aste/${auctionId}` : '/aste'}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#FF7300] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('bidding.backToAuction')}
        </Link>

        <div className="mt-8 rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-[1px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900">
            {t('bidding.title')}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {t('bidding.subtitle')}
          </p>
          
          <div className="mt-8 flex items-center justify-center py-16">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <p className="mt-4 text-sm font-medium text-gray-500 uppercase tracking-wide">
                {t('bidding.comingSoonLabel')}
              </p>
              <p className="mt-2 text-xs text-gray-400 max-w-xs">
                {t('bidding.helpText')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
