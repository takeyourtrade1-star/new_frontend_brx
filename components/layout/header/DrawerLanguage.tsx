'use client';

import type { RefObject } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LANGUAGE_NAMES } from '@/lib/contexts/LanguageContext';
import { FLAG_BASE, LANG_TO_COUNTRY } from './lang-flags';
import type { MessageKey } from '@/lib/i18n/messages/en';

type T = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** Piano 1.6 — selettore lingua del drawer mobile, estratto da HamburgerMenu. */
export function DrawerLanguage({
  containerRef,
  isOpen,
  onToggle,
  onSelectLang,
  currentCountryCode,
  selectedLang,
  availableLangs,
  navLinkClass,
  t,
}: {
  containerRef: RefObject<HTMLDivElement>;
  isOpen: boolean;
  onToggle: () => void;
  onSelectLang: (lang: string) => void;
  currentCountryCode: string;
  selectedLang: string;
  availableLangs: readonly string[];
  navLinkClass: string;
  t: T;
}) {
  return (
            <div ref={containerRef} className="relative">
              <button
                type="button"
                onClick={onToggle}
                className={cn(navLinkClass, 'w-full justify-between')}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-label={t('common.languageSelectAria')}
              >
                <div className="flex items-center gap-3.5">
                  <Image
                    src={`${FLAG_BASE}/w40/${currentCountryCode}.png`}
                    alt=""
                    width={20}
                    height={14}
                    className="h-3.5 w-5 rounded-sm object-cover"
                    unoptimized
                  />
                  <span>{LANGUAGE_NAMES[selectedLang] ?? selectedLang}</span>
                </div>
                <ChevronDown
                  className={cn('h-4 w-4 text-gray-400 transition-transform', isOpen && 'rotate-180')}
                  aria-hidden
                />
              </button>
              {isOpen && (
                <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-100 bg-white py-1 shadow-lg" role="listbox">
                  {availableLangs.map((lang) => (
                    <li key={lang} role="option" aria-selected={selectedLang === lang}>
                      <button
                        type="button"
                        onClick={() => onSelectLang(lang)}
                        className={cn(
                          'flex w-full items-center gap-3 px-5 py-2.5 text-left text-[13px] text-gray-700 transition-colors hover:bg-gray-100',
                          selectedLang === lang && 'font-medium text-[#1D3160]'
                        )}
                      >
                        <Image
                          src={`${FLAG_BASE}/w40/${LANG_TO_COUNTRY[lang] ?? lang}.png`}
                          alt=""
                          width={20}
                          height={14}
                          className="h-3.5 w-5 shrink-0 rounded-sm object-cover"
                          unoptimized
                        />
                        {LANGUAGE_NAMES[lang] ?? lang}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
  );
}
