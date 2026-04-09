'use client';

import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { FlagIcon } from '@/components/ui/FlagIcon';
import type { CountryCode } from '@/components/ui/FlagIcon';

const LANGUAGES: { code: string; name: string; flagCode: CountryCode }[] = [
  { code: 'it', name: 'Italiano', flagCode: 'IT' },
  { code: 'en', name: 'English', flagCode: 'GB' },
  { code: 'de', name: 'Deutsch', flagCode: 'DE' },
  { code: 'es', name: 'Español', flagCode: 'ES' },
  { code: 'fr', name: 'Français', flagCode: 'FR' },
  { code: 'pt', name: 'Português', flagCode: 'PT' },
] as const;

interface LanguageDropdownProps {
  value: string;
  onChange: (lang: string) => void;
  label: string;
}

function LanguageDropdown({ value, onChange, label }: LanguageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLang = LANGUAGES.find((l) => l.code === value) || LANGUAGES[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-base font-semibold text-gray-900 transition-colors hover:border-[#FF7300] hover:bg-[#FF7300]/5"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label}
      >
        <span>{selectedLang.name}</span>
        <FlagIcon country={selectedLang.flagCode} size="md" />
        <ChevronDown className={`h-5 w-5 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <ul
            role="listbox"
            className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === value;
              return (
                <li key={lang.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(lang.code);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
                      isSelected ? 'bg-[#FF7300]/10 text-[#FF7300]' : 'text-gray-900'
                    }`}
                  >
                    <FlagIcon country={lang.flagCode} size="sm" />
                    <span className="flex-1">{lang.name}</span>
                    {isSelected && <Check className="h-4 w-4" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export default function ImpostazioniLinguaPage() {
  const { t } = useTranslation();
  const { selectedLang, setSelectedLang } = useLanguage();
  const [emailLang, setEmailLang] = useState(selectedLang);

  return (
    <div className="font-sans text-gray-900">
      <p className="mb-10 max-w-2xl text-lg leading-relaxed text-gray-700">
        {t('accountPage.langSettingsIntro')}
      </p>

      <form className="max-w-2xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <label className="text-lg font-medium text-gray-900">{t('accountPage.langSite')}</label>
          <LanguageDropdown
            value={selectedLang}
            onChange={setSelectedLang}
            label={t('accountPage.langSite')}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <label className="text-lg font-medium text-gray-900">{t('accountPage.langEmail')}</label>
          <LanguageDropdown
            value={emailLang}
            onChange={setEmailLang}
            label={t('accountPage.langEmail')}
          />
        </div>
      </form>

      <p className="mt-10 max-w-2xl text-sm leading-relaxed text-gray-500">{t('accountPage.langFootnote')}</p>
    </div>
  );
}
