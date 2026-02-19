'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEARCH_CATEGORIES } from '@/lib/search-categories';

const CATEGORY_LABELS = SEARCH_CATEGORIES.map((c) => c.label);

export function MainSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [categoryLabel, setCategoryLabel] = useState<string>(CATEGORY_LABELS[0]);
  const [categoryOpen, setCategoryOpen] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const categoryValue =
      SEARCH_CATEGORIES.find((c) => c.label === categoryLabel)?.value ?? '';
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (categoryValue) params.set('category', categoryValue);
    router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-1 items-center gap-0 rounded-full py-1 pl-3 pr-1 focus-within:ring-0"
      style={{ backgroundColor: '#e5e7eb' }}
    >
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cosa stai cercando?"
        className="min-w-0 flex-1 bg-transparent text-sm font-normal text-[#0F172A] placeholder:text-gray-500 focus:outline-none focus:ring-0"
        aria-label="Cerca prodotti"
      />

      <div className="flex items-center gap-1.5">
        <div className="relative">
          <button
            type="button"
            onClick={() => setCategoryOpen((o) => !o)}
            className={cn(
              'flex max-w-[140px] items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium',
              'bg-gray-200 text-gray-700 border-gray-400',
              'hover:bg-gray-300/80 focus:outline-none focus:ring-0',
              'transition-colors'
            )}
            aria-expanded={categoryOpen}
            aria-haspopup="listbox"
            aria-label={`Categoria: ${categoryLabel}`}
          >
            <span className="min-w-0 truncate">{categoryLabel}</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-black transition-transform',
                categoryOpen && 'rotate-180'
              )}
            />
          </button>

          {categoryOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                aria-hidden
                onClick={() => setCategoryOpen(false)}
              />
              <ul
                role="listbox"
                className="absolute right-0 top-full z-20 mt-1 max-h-60 w-48 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
              >
                {CATEGORY_LABELS.map((label) => (
                  <li key={label} role="option">
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryLabel(label);
                        setCategoryOpen(false);
                      }}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm font-normal text-gray-800 hover:bg-gray-100',
                        categoryLabel === label && 'font-medium'
                      )}
                      style={categoryLabel === label ? { color: '#FF7300' } : undefined}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <button
          type="submit"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#0F172A] hover:bg-gray-300/60 focus:outline-none focus:ring-0"
          aria-label="Cerca"
        >
          <Search className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>
    </form>
  );
}
