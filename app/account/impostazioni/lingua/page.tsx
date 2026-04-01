'use client';

import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useLanguage } from '@/lib/contexts/LanguageContext';

const LANGUAGES = [
  { code: 'it', name: 'Italiano', flag: FlagIt },
  { code: 'en', name: 'English', flag: FlagEn },
  { code: 'de', name: 'Deutsch', flag: FlagDe },
  { code: 'es', name: 'Español', flag: FlagEs },
  { code: 'fr', name: 'Français', flag: FlagFr },
  { code: 'pt', name: 'Português', flag: FlagPt },
] as const;

function FlagIt() {
  return (
    <span className="inline-block h-5 w-7 overflow-hidden rounded-sm border border-gray-300 shadow-sm" aria-hidden>
      <span className="flex h-full w-full">
        <span className="w-1/3 bg-[#009246]" />
        <span className="w-1/3 bg-white" />
        <span className="w-1/3 bg-[#CE2B37]" />
      </span>
    </span>
  );
}

function FlagEn() {
  return (
    <span className="inline-block h-5 w-7 overflow-hidden rounded-sm border border-gray-300 shadow-sm bg-[#012169]" aria-hidden>
      <svg viewBox="0 0 60 40" className="h-full w-full">
        <rect width="60" height="40" fill="#012169"/>
        <path d="M0 0 L60 40 M60 0 L0 40" stroke="white" strokeWidth="6"/>
        <path d="M30 0 V40 M0 20 H60" stroke="white" strokeWidth="10"/>
        <path d="M30 0 V40 M0 20 H60" stroke="#C8102E" strokeWidth="6"/>
        <path d="M0 0 L60 40 M60 0 L0 40" stroke="#C8102E" strokeWidth="4"/>
      </svg>
    </span>
  );
}

function FlagDe() {
  return (
    <span className="inline-block h-5 w-7 overflow-hidden rounded-sm border border-gray-300 shadow-sm" aria-hidden>
      <span className="flex h-full w-full flex-col">
        <span className="h-1/3 bg-black" />
        <span className="h-1/3 bg-[#DD0000]" />
        <span className="h-1/3 bg-[#FFCE00]" />
      </span>
    </span>
  );
}

function FlagEs() {
  return (
    <span className="inline-block h-5 w-7 overflow-hidden rounded-sm border border-gray-300 shadow-sm" aria-hidden>
      <span className="flex h-full w-full flex-col">
        <span className="h-1/4 bg-[#AA151B]" />
        <span className="h-1/2 bg-[#F1BF00]" />
        <span className="h-1/4 bg-[#AA151B]" />
      </span>
    </span>
  );
}

function FlagFr() {
  return (
    <span className="inline-block h-5 w-7 overflow-hidden rounded-sm border border-gray-300 shadow-sm" aria-hidden>
      <span className="flex h-full w-full">
        <span className="w-1/3 bg-[#0055A4]" />
        <span className="w-1/3 bg-white" />
        <span className="w-1/3 bg-[#EF4135]" />
      </span>
    </span>
  );
}

function FlagPt() {
  return (
    <span className="inline-block h-5 w-7 overflow-hidden rounded-sm border border-gray-300 shadow-sm" aria-hidden>
      <span className="flex h-full w-full">
        <span className="w-2/5 bg-[#006600]" />
        <span className="w-3/5 bg-[#FF0000]" />
      </span>
    </span>
  );
}

interface LanguageDropdownProps {
  value: string;
  onChange: (lang: string) => void;
  label: string;
}

function LanguageDropdown({ value, onChange, label }: LanguageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLang = LANGUAGES.find((l) => l.code === value) || LANGUAGES[0];
  const FlagComponent = selectedLang.flag;

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
        <FlagComponent />
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
              const Flag = lang.flag;
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
                    <Flag />
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
