import type { UiLocale } from './locales';
import type { MessageKey } from './messages/en';
import { en } from './messages/en';
import { de } from './messages/de';
import { es } from './messages/es';
import { fr } from './messages/fr';
import { it } from './messages/it';
import { pt } from './messages/pt';

export type { MessageKey };

export const dictionaries: Record<UiLocale, Record<MessageKey, string>> = {
  en,
  de,
  es,
  fr,
  it,
  pt,
};
