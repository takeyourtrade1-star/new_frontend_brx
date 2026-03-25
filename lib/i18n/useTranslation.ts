'use client';

import { useCallback } from 'react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getMessage } from './getMessage';
import type { MessageKey } from './messages/en';

export function useTranslation() {
  const { selectedLang } = useLanguage();

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => getMessage(selectedLang, key, vars),
    [selectedLang]
  );

  return { t, locale: selectedLang };
}
