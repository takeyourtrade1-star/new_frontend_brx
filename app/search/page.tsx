import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { SearchResults } from '@/components/feature/search/SearchResults';
import { SearchPageLoading } from '@/components/feature/search/SearchPageLoading';

export const metadata = {
  title: 'Cerca | Ebartex',
  description: 'Risultati di ricerca Ebartex',
  // Canonical alla pagina pulita: deduplica le infinite varianti con query/filtri.
  alternates: { canonical: '/search' },
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string; game?: string; category?: string; set?: string; page?: string; sort?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = (params.q ?? '').trim();
  const game = params.game ?? '';

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#193874' }}>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <Suspense fallback={<SearchPageLoading />}>
        <SearchResults query={q} game={game} />
      </Suspense>
    </main>
  );
}
