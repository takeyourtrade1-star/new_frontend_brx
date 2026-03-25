'use client';

import { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
  /** Se true, avvolge la barra in un contenitore con sfondo blu scuro (slate-900) */
  withDarkContainer?: boolean;
}

export function SearchBar({
  placeholder = 'Cosa stai cercando?',
  className,
  onSearch,
  withDarkContainer = false,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch?.(query);
  }

  const bar = (
    <div
      className={cn(
        'w-full rounded-full bg-gray-200 px-4 py-2.5',
        'focus-within:ring-0',
        !withDarkContainer && className
      )}
      style={{ height: '44px' }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex h-full items-center gap-2"
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'min-w-0 flex-1 bg-transparent text-sm text-gray-900',
            'placeholder:text-gray-500 font-sans',
            'focus:outline-none focus:ring-0'
          )}
          aria-label="Cerca"
        />

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setCategoriesOpen((o) => !o)}
            className={cn(
              'flex items-center gap-1 rounded-full border border-gray-400 px-3 py-1.5',
              'bg-white/50 text-gray-700 text-sm font-medium',
              'hover:bg-gray-100 transition-colors',
              'focus:outline-none focus:ring-0'
            )}
            aria-expanded={categoriesOpen}
            aria-label="Categorie"
          >
            Categorie
            <ChevronDown className="h-4 w-4 text-gray-600" />
          </button>

          <button
            type="submit"
            className="p-1 text-gray-900 focus:outline-none focus:ring-0"
            aria-label="Cerca"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );

  if (withDarkContainer) {
    return (
      <div
        className={cn(
          'rounded-lg bg-slate-900 p-4',
          className
        )}
      >
        {bar}
      </div>
    );
  }

  return bar;
}
