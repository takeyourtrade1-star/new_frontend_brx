'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { ChevronDown, Check, Search } from 'lucide-react';
import { FlagIcon, type CountryCode } from './FlagIcon';
import { cn } from '@/lib/utils';

export interface CountryOption {
  code: CountryCode;
  label: string;
  flagCode: CountryCode;
}

interface CountrySelectProps {
  options: CountryOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Compatto per prefisso telefonico: bandiera sempre visibile, valore più accentuato. */
  variant?: 'default' | 'prefix';
}

const sizeClasses = {
  sm: {
    trigger: 'h-11 pl-3.5 pr-3 text-[14px] rounded-xl',
    flag: 'sm' as const,
    item: 'px-3 py-2 text-sm',
    list: 'mt-1',
  },
  md: {
    trigger: 'h-14 pl-4 pr-4 text-base rounded-2xl',
    flag: 'md' as const,
    item: 'px-4 py-2.5 text-sm',
    list: 'mt-1.5',
  },
  lg: {
    trigger: 'h-16 pl-5 pr-5 text-lg rounded-2xl',
    flag: 'lg' as const,
    item: 'px-5 py-3 text-base',
    list: 'mt-2',
  },
};

export function CountrySelect({
  options,
  value,
  onChange,
  placeholder,
  label,
  className,
  disabled = false,
  size = 'md',
  variant = 'default',
}: CountrySelectProps) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t('countrySelect.placeholder');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedOption = options.find((o) => o.code === value);
  const hasSelection = Boolean(selectedOption);
  const sizes = sizeClasses[size];
  const isPrefix = variant === 'prefix';

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(query) ||
        o.code.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  // Reset search when closing dropdown
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Focus search input when opening dropdown
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn('relative min-w-0', className)}>
      {label && (
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          'flex w-full items-center justify-between border transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-global-bg-start/25 focus-visible:ring-offset-0',
          isPrefix ? 'h-11 rounded-xl px-2.5 gap-1 border-black/10 bg-black/5 hover:border-global-bg-start/50 hover:bg-white focus:bg-white focus:border-global-bg-start' : sizes.trigger,
          disabled
            ? 'cursor-not-allowed border-black/10 bg-black/5 text-gray-400'
            : hasSelection
              ? cn(
                  'cursor-pointer border-black/10 bg-black/5 text-[#1d1d1f]',
                  'hover:border-global-bg-start hover:bg-white focus:bg-white focus:border-global-bg-start'
                )
              : 'cursor-pointer border-black/10 bg-black/5 text-gray-900 hover:border-global-bg-start/40 hover:bg-black/[0.07]'
        )}
      >
        <span className={cn('flex min-w-0 flex-1 items-center', isPrefix ? 'gap-1.5' : 'gap-3')}>
          {selectedOption ? (
            <>
              <FlagIcon
                country={selectedOption.flagCode}
                size={isPrefix ? 'sm' : sizes.flag}
                className="shrink-0"
              />
              <span
                className={cn(
                  isPrefix
                    ? 'whitespace-nowrap font-medium text-[14px] text-[#1d1d1f]'
                    : cn('truncate', hasSelection ? 'font-medium text-[#1d1d1f]' : 'font-medium')
                )}
              >
                {selectedOption.label}
              </span>
            </>
          ) : (
            <span className="truncate text-gray-400">{resolvedPlaceholder}</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
            hasSelection ? 'text-gray-500' : 'text-gray-400',
            isOpen && 'rotate-180'
          )}
          aria-hidden
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg',
            isPrefix ? 'left-0 min-w-[11rem] w-max' : 'left-0 right-0',
            sizes.list
          )}
          role="listbox"
        >
          {/* Search Input */}
          <div className="border-b border-gray-100 p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('countrySelect.searchPlaceholder')}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#FF7300]/50 focus:outline-none focus:ring-1 focus:ring-[#FF7300]/30"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">
                {t('countrySelect.empty')}
              </li>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.code === value;
                return (
                  <li key={option.code} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(option.code);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 text-left transition-colors',
                        sizes.item,
                        isSelected
                          ? 'bg-global-bg-start/10 font-semibold text-global-bg-start'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <FlagIcon country={option.flagCode} size={sizes.flag} className="shrink-0" />
                      <span className={cn('min-w-0 flex-1 truncate', isSelected && 'font-semibold')}>
                        {option.label}
                      </span>
                      {isSelected && (
                        <Check className="h-4 w-4 shrink-0 text-global-bg-start" aria-hidden />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CountrySelect;
