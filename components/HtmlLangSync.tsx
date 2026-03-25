'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/lib/contexts/LanguageContext';

/** Allinea `<html lang>` alla lingua UI (accessibilità + SEO). */
export function HtmlLangSync() {
  const { selectedLang } = useLanguage();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = selectedLang;
    }
  }, [selectedLang]);

  return null;
}
