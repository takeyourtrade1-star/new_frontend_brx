'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getLoadedDictionary, loadDictionary } from '@/lib/i18n/dictionaries';
import { isUiLocale } from '@/lib/i18n/locales';

const AVAILABLE_LANGS = ['en', 'de', 'es', 'fr', 'it', 'pt'] as const;
const LANGUAGE_STORAGE_KEY = 'ebartex_preferred_language';

export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  pt: 'Português',
};

interface LanguageContextValue {
  selectedLang: string;
  setSelectedLang: (lang: string) => void;
  availableLangs: readonly string[];
  isLangLoading: boolean;
  /** Incrementato quando un dizionario lazy finisce di caricare: forza il
   *  re-render dei consumer (useTranslation) per sostituire il fallback EN. */
  dictVersion: number;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function getInitialLanguage(): string {
  if (typeof window === 'undefined') return 'it';
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && AVAILABLE_LANGS.includes(saved as (typeof AVAILABLE_LANGS)[number])) {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'it';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Usa sempre l'hook (non può essere condizionale)
  const user = useAuthStore((s) => s.user);
  const [selectedLang, setSelectedLangState] = useState<string>('it');
  const [isLangLoading, setIsLangLoading] = useState(false);
  const [dictVersion, setDictVersion] = useState(0);

  useEffect(() => {
    setSelectedLangState(getInitialLanguage());
  }, []);

  // Carica on-demand il dizionario della lingua attiva se non è già in memoria
  // (en/it sono nel bundle iniziale; de/es/fr/pt sono lazy). Al termine forza
  // un re-render così i consumer passano dal fallback EN alla lingua reale.
  useEffect(() => {
    if (!isUiLocale(selectedLang)) return;
    if (getLoadedDictionary(selectedLang)) return;

    let cancelled = false;
    setIsLangLoading(true);
    loadDictionary(selectedLang)
      .then(() => {
        if (cancelled) return;
        setDictVersion((v) => v + 1);
      })
      .finally(() => {
        if (!cancelled) setIsLangLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedLang]);

  useEffect(() => {
    const pref = user?.preferences?.language;
    if (pref && AVAILABLE_LANGS.includes(pref as (typeof AVAILABLE_LANGS)[number])) {
      setSelectedLangState(pref);
      try {
        if (typeof window !== 'undefined') localStorage.setItem(LANGUAGE_STORAGE_KEY, pref);
      } catch {
        // ignore
      }
    }
  }, [user?.preferences?.language]);

  const setSelectedLang = useCallback((lang: string) => {
    if (!AVAILABLE_LANGS.includes(lang as (typeof AVAILABLE_LANGS)[number])) return;
    setSelectedLangState(lang);
    try {
      if (typeof window !== 'undefined') localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      selectedLang,
      setSelectedLang,
      availableLangs: AVAILABLE_LANGS,
      isLangLoading,
      dictVersion,
    }),
    [selectedLang, setSelectedLang, isLangLoading, dictVersion]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
