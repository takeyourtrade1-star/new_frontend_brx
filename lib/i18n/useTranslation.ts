'use client';

import { useCallback } from 'react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getMessage } from './getMessage';
import type { MessageKey } from './messages/en';

export function useTranslation() {
  const { selectedLang, dictVersion } = useLanguage();

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      // dictVersion lega l'identità di `t` al caricamento dei dizionari lazy:
      // nuovo `t` → re-render dei consumer memoizzati con la lingua reale.
      void dictVersion;
      return getMessage(selectedLang, key, vars);
    },
    [selectedLang, dictVersion]
  );

  return { t, locale: selectedLang };
}
