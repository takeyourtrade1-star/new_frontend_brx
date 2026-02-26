import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { SearchResults } from '@/components/feature/search/SearchResults';
import { SEARCH_CATEGORIES } from '@/lib/search-categories';

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
  const category = params.category ?? '';
  const categoryLabel =
    SEARCH_CATEGORIES.find((c) => c.value === category)?.label ?? 'Categorie';

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#193874' }}>
      <Header />
      <Suspense fallback={<div className="p-8 text-center text-white">Caricamento...</div>}>
        <SearchResults query={q} game={game} category={category} categoryLabel={categoryLabel} />
      </Suspense>
    </main>
  );
}
