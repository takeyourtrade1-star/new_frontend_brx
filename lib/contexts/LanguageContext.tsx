'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';

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
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function getInitialLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && AVAILABLE_LANGS.includes(saved as (typeof AVAILABLE_LANGS)[number])) {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Usa sempre l'hook (non può essere condizionale)
  const user = useAuthStore((s) => s.user);
  const [selectedLang, setSelectedLangState] = useState<string>('en');
  const [isLangLoading, setIsLangLoading] = useState(false);

  useEffect(() => {
    setSelectedLangState(getInitialLanguage());
  }, []);

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

  const value: LanguageContextValue = {
    selectedLang,
    setSelectedLang,
    availableLangs: [...AVAILABLE_LANGS],
    isLangLoading,
  };

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
