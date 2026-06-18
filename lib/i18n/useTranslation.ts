'use client';

import { useCallback } from 'react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getMessage } from './getMessage';
import type { MessageKey } from './messages/en';

export function useTranslation() {
  const { selectedLang, dictVersion } = useLanguage();

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => getMessage(selectedLang, key, vars),
    // dictVersion forza un nuovo `t` quando un dizionario lazy finisce di caricare.
    [selectedLang, dictVersion]
  );

  return { t, locale: selectedLang };
}
