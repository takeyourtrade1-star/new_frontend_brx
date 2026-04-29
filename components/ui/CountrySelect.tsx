'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
}

const sizeClasses = {
  sm: {
    trigger: 'h-10 pl-3 pr-3 text-sm',
    flag: 'sm' as const,
    item: 'px-3 py-2 text-sm',
    list: 'mt-1',
  },
  md: {
    trigger: 'h-14 pl-4 pr-4 text-base',
    flag: 'md' as const,
    item: 'px-4 py-2.5 text-sm',
    list: 'mt-1.5',
  },
  lg: {
    trigger: 'h-16 pl-5 pr-5 text-lg',
    flag: 'lg' as const,
    item: 'px-5 py-3 text-base',
    list: 'mt-2',
  },
};

export function CountrySelect({
  options,
  value,
  onChange,
  placeholder = 'Seleziona...',
  label,
  className,
  disabled = false,
  size = 'md',
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedOption = options.find((o) => o.code === value);
  const sizes = sizeClasses[size];

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
    <div ref={containerRef} className={cn('relative', className)}>
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
          'flex w-full items-center justify-between gap-2 rounded-2xl border transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]/20 focus-visible:ring-offset-0',
          sizes.trigger,
          disabled
            ? 'cursor-not-allowed border-black/10 bg-black/5 text-gray-400'
            : 'cursor-pointer border-black/10 bg-black/5 text-gray-900 hover:border-[#0066cc]/40 hover:bg-black/[0.07]'
        )}
      >
        <span className="flex items-center gap-3">
          {selectedOption ? (
            <>
              <FlagIcon country={selectedOption.flagCode} size={sizes.flag} />
              <span className="font-medium">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          aria-hidden
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute left-0 right-0 z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg',
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
                placeholder="Cerca paese..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#FF7300]/50 focus:outline-none focus:ring-1 focus:ring-[#FF7300]/30"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">
                Nessun paese trovato
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
                          ? 'bg-[#FF7300]/5 text-[#FF7300]'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <FlagIcon country={option.flagCode} size={sizes.flag} />
                      <span className={cn('flex-1', isSelected && 'font-medium')}>
                        {option.label}
                      </span>
                      {isSelected && <Check className="h-4 w-4 shrink-0" />}
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
