import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { SearchResults } from '@/components/feature/search/SearchResults';
import { SearchPageLoading } from '@/components/feature/search/SearchPageLoading';

export const metadata = {
  title: 'Cerca | Ebartex',
  description: 'Risultati di ricerca Ebartex',
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
      <Header />
      <Suspense fallback={<SearchPageLoading />}>
        <SearchResults query={q} game={game} />
      </Suspense>
    </main>
  );
}
