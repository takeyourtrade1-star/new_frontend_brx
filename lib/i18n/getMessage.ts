import { dictionaries } from './dictionaries';
import { DEFAULT_LOCALE, isUiLocale } from './locales';
import type { MessageKey } from './messages/en';

export function getMessage(
  locale: string,
  key: MessageKey,
  vars?: Record<string, string | number>
): string {
  const loc = isUiLocale(locale) ? locale : DEFAULT_LOCALE;
  const table = dictionaries[loc] ?? dictionaries[DEFAULT_LOCALE];
  let raw = table[key] ?? dictionaries[DEFAULT_LOCALE][key] ?? String(key);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      raw = raw.split(`{${k}}`).join(String(v));
    }
  }
  return raw;
}
