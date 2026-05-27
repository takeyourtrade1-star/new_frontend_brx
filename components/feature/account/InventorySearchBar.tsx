'use client';

import { Search, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export interface InventorySearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}

export function InventorySearchBar({
  value,
  onChange,
  onClear,
  disabled = false,
  className = '',
  inputClassName = '',
}: InventorySearchBarProps) {
  const { t } = useTranslation();

  return (
    <div className={`relative ${className}`}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('accountPage.itemsSearchPlaceholder')}
        disabled={disabled}
        aria-label={t('accountPage.itemsSearchAria')}
        className={`w-full rounded-2xl border border-white/60 bg-white/80 py-3 pl-10 pr-11 text-base text-gray-900 shadow-sm backdrop-blur-md placeholder:text-gray-400 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all disabled:opacity-60 ${inputClassName}`}
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100/80 hover:text-gray-700 active:scale-95 disabled:opacity-50"
          aria-label={t('accountPage.itemsClearSearchAria')}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
