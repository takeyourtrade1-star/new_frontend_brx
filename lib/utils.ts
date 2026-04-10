import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
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
