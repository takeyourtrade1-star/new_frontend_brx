import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ASSETS } from '@/lib/config';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Formats a price expressed in euro-cents to a locale-aware EUR string. */
export function formatEurCents(cents: number): string {
  return new Intl.NumberFormat('it-IT', {
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
  if (raw == null || raw === '') return null;
  const trimmed = String(raw).trim();
  if (trimmed.startsWith('http')) return trimmed;
  const path = trimmed.replace(/^\/img\//, '').replace(/^img\//, '');
  if (!path) return null;
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return ASSETS.cdnUrl ? `${ASSETS.cdnUrl}${withSlash}` : withSlash;
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
