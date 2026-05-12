/**
 * Paesi UE/SEE usati per la tariffa «resto Europa» (default) nel wizard aste.
 * Allineare alle policy marketplace; non è la lista ISO completa del mondo.
 */
export const EU_SHIPPING_ISO_CODES = new Set<string>([
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
]);

export function isEuShippingCountry(iso: string | null | undefined): boolean {
  const c = (iso ?? '').trim().toUpperCase();
  return c.length === 2 && EU_SHIPPING_ISO_CODES.has(c);
}

/** ISO alpha-2 «user-assigned» usato solo come chiave DB per il prezzo fuori UE (wizard). */
export const AUCTION_SHIPPING_REST_OF_WORLD_ISO = 'XZ' as const;
