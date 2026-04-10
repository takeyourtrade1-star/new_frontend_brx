import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { SearchPageLoading } from '@/components/feature/search/SearchPageLoading';
import { SetPageClient } from '@/components/feature/product/SetPageClient';

export const metadata = {
  title: 'Set | Ebartex',
  description: 'Carte di un set specifico',
};

type SetPageProps = {
  searchParams: Promise<{ set?: string; game?: string }>;
};

export default async function SetPage({ searchParams }: SetPageProps) {
  const params = await searchParams;
  const game = params.game ?? '';
  const setName = params.set ?? '';

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#193874' }}>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <Suspense fallback={<SearchPageLoading />}>
        <SetPageClient game={game} setName={setName} />
      </Suspense>
    </main>
  );
}

