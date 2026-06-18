'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage, LANGUAGE_NAMES } from '@/lib/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { langFlagUrl } from '@/lib/i18n/language-flags';

interface SiteLanguagePickerProps {
  /** Pill compatto per schermate auth; default per menu/impostazioni. */
  variant?: 'auth' | 'default';
  /** Versione ancora più piccola (landing login). */
  compact?: boolean;
  className?: string;
}

export function SiteLanguagePicker({
  variant = 'default',
  compact = false,
  className,
}: SiteLanguagePickerProps) {
  const { t } = useTranslation();
  const { selectedLang, setSelectedLang, availableLangs } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const selectedName = LANGUAGE_NAMES[selectedLang] ?? selectedLang;

  if (variant === 'auth') {
    return (
      <div ref={containerRef} className={cn('relative', compact ? 'inline-block' : 'relative', className)}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex items-center justify-center rounded-full border border-black/10 bg-[#f0f0f2] shadow-sm transition-colors hover:bg-[#e8e8ed]',
            compact ? 'gap-1.5 px-3 py-1.5' : 'gap-2 px-4 py-2'
          )}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={t('common.languageSelectAria')}
        >
          <Image
            src={langFlagUrl(selectedLang)}
            alt=""
            width={20}
            height={14}
            className={cn('rounded-sm object-cover', compact ? 'h-3 w-[1.125rem]' : 'h-3.5 w-5')}
            unoptimized
          />
          <span className="text-[13px] font-semibold text-gray-800">
            {selectedName}
          </span>
          <ChevronDown
            className={cn(
              'text-gray-500 transition-transform',
              compact ? 'h-3 w-3' : 'h-3.5 w-3.5',
              open && 'rotate-180'
            )}
            aria-hidden
          />
        </button>

        {open && (
          <ul
            role="listbox"
            className={cn(
              'absolute top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-gray-200/90 bg-white py-0.5 shadow-lg',
              compact ? 'left-1/2 min-w-[10rem] -translate-x-1/2' : 'left-0 right-0 mt-2 rounded-2xl py-1'
            )}
          >
            {availableLangs.map((lang) => {
              const isSelected = lang === selectedLang;
              return (
                <li key={lang} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLang(lang);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 text-left transition-colors hover:bg-gray-50',
                      compact ? 'px-3 py-2 text-[12px]' : 'gap-3 px-4 py-2.5 text-[13px]',
                      isSelected ? 'bg-global-bg-start/5 font-semibold text-global-bg-start' : 'text-gray-800'
                    )}
                  >
                    <Image
                      src={langFlagUrl(lang)}
                      alt=""
                      width={20}
                      height={14}
                      className="h-3.5 w-5 shrink-0 rounded-sm object-cover"
                      unoptimized
                    />
                    <span className="flex-1">{LANGUAGE_NAMES[lang] ?? lang}</span>
                    {isSelected && <Check className="h-4 w-4 shrink-0" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-base font-semibold text-gray-900 transition-colors hover:border-primary hover:bg-primary/5"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('common.languageSelectAria')}
      >
        <Image
          src={langFlagUrl(selectedLang)}
          alt=""
          width={20}
          height={14}
          className="h-3.5 w-5 rounded-sm object-cover"
          unoptimized
        />
        <span>{selectedName}</span>
        <ChevronDown
          className={cn('h-5 w-5 text-gray-600 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {availableLangs.map((lang) => {
            const isSelected = lang === selectedLang;
            return (
              <li key={lang} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLang(lang);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100',
                    isSelected ? 'bg-primary/10 font-medium text-primary' : 'text-gray-900'
                  )}
                >
                  <Image
                    src={langFlagUrl(lang)}
                    alt=""
                    width={20}
                    height={14}
                    className="h-3.5 w-5 shrink-0 rounded-sm object-cover"
                    unoptimized
                  />
                  <span className="flex-1">{LANGUAGE_NAMES[lang] ?? lang}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
