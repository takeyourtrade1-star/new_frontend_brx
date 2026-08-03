import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { safePublicImageUrl } from '@/lib/security/catalog-public-data';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formatta un importo già in EUR (no arrotondamento), locale-aware con spazio.
 * Es: 10.5 → "10,50 €". Variante base; per cents usa {@link formatEurCents},
 * senza spazio {@link formatEuroNoSpace}. Passa `locale` (BCP 47, es. da
 * {@link useIntlLocale}) per rispettare la lingua attiva; default 'it-IT'.
 */
export function formatEur(n: number, locale: string = 'it-IT'): string {
  return n.toLocaleString(locale, { style: 'currency', currency: 'EUR' });
}

/** Formats a price expressed in euro-cents to a locale-aware EUR string. */
export function formatEurCents(cents: number, locale: string = 'it-IT'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Resolves a raw image path/URL to an absolute URL using the CDN base when
 * available. Returns null for empty/missing values.
 */
export function buildImageUrl(raw: string | null | undefined): string | null {
  return safePublicImageUrl(raw, 'card');
}

/**
 * Formatta un numero in EUR senza spazio tra cifra e simbolo
 * Es: 10.5 → "10,50€" invece di "10,50 €"
 * Gestisce sia spazi normali (U+0020) che non-breaking spaces (U+00A0)
 */
export function formatEuroNoSpace(n: number, locale: string = 'it-IT'): string {
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(n);
  // Rimuove spazio normale (U+0020) o non-breaking space (U+00A0) prima di €
  return formatted.replace(/[\s\xa0]€/, '€');
}
