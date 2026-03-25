/** Emoji bandiera da codice ISO 3166-1 alpha-2 (es. IT → 🇮🇹). */
export function countryFlagEmoji(code: string): string {
  if (!code || code.length !== 2) return '';
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join('');
}
