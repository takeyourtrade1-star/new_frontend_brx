import { FlagIcon } from '@/components/ui/FlagIcon';
import type { CountryCode } from '@/components/ui/FlagIcon';

/** SVG bandiera da codice ISO 3166-1 alpha-2 (es. IT → 🇮🇹 come SVG). */
export function countryFlagEmoji(code: string): string {
  if (!code || code.length !== 2) return '';
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join('');
}

/** Componente React per bandiera SVG (preferito). */
export { FlagIcon };

/** Dropdown custom per selezione paese con SVG flags. */
export { CountrySelect } from '@/components/ui/CountrySelect';
export type { CountryOption } from '@/components/ui/CountrySelect';

/** Hook per usare le bandiere SVG nei componenti. */
export { useCountryFlag } from '@/components/ui/FlagIcon';

/** Tipo per i codici paese supportati. */
export type { CountryCode };
