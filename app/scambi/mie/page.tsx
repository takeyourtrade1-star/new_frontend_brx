import { Suspense } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { ScambiNav } from '@/components/feature/scambi/ScambiNav';
import { ScambiGuard } from '../ScambiGuard';
import { ArrowLeftRight } from 'lucide-react';

export const metadata = {
  title: 'I miei scambi | Ebartex',
};

export default function MieiScambiPage() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <ScambiGuard>
      <ScambiNav />
      <div className="container-content flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF4EC]">
          <ArrowLeftRight className="h-8 w-8 text-[#FF7300]" />
        </div>
        <h1 className="mb-3 text-2xl font-bold text-[#1D3160]">I miei scambi</h1>
        <p className="mb-8 max-w-md text-gray-500">
          Gestisci le tue proposte di scambio. Funzionalità in arrivo presto!
        </p>
        <Link
          href="/scambi"
          className="inline-flex h-11 items-center justify-center rounded-full bg-[#FF7300] px-6 text-sm font-semibold text-white transition-all hover:bg-[#e66800] active:scale-95"
        >
          Torna agli scambi
        </Link>
      </div>
      </ScambiGuard>
    </main>
  );
}
