import {
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';

/**
 * Mappatura predefinita da prefisso telefonico a codice paese ISO 3166-1 alpha-2.
 */
export const PREFIX_TO_DEFAULT_COUNTRY: Record<string, CountryCode> = {
  '+39': 'IT',
  '+1': 'US',
  '+33': 'FR',
  '+34': 'ES',
  '+49': 'DE',
  '+41': 'CH',
  '+43': 'AT',
  '+44': 'GB',
};

/**
 * Ottiene il codice paese ISO a partire da un prefisso telefonico (es. '+39' -> 'IT').
 */
export function getCountryCodeFromPrefix(prefix: string): CountryCode | undefined {
  if (!prefix) return undefined;
  const cleanPrefix = prefix.startsWith('+') ? prefix : `+${prefix}`;
  return PREFIX_TO_DEFAULT_COUNTRY[cleanPrefix];
}

/**
 * Verifica se un numero di telefono è valido per il prefisso/paese specificato.
 * Gestisce rimozione automatica di spazi, trattini e caratteri non numerici.
 */
export function isValidPhone(phone: string, prefix: string, country?: string): boolean {
  if (!phone || typeof phone !== 'string') return false;

  const cleanDigits = phone.trim().replace(/[\s\-().]/g, '');
  if (!cleanDigits) return false;

  const cleanPrefix = prefix ? (prefix.startsWith('+') ? prefix : `+${prefix}`) : '+39';

  // Se l'utente ha inserito il prefisso direttamente nel campo telefono
  if (cleanDigits.startsWith('+')) {
    const parsed = parsePhoneNumberFromString(cleanDigits);
    return Boolean(parsed && parsed.isValid());
  }

  // Risolve il paese dal codice passato o dal prefisso
  const countryCode = (country?.toUpperCase() as CountryCode) || getCountryCodeFromPrefix(cleanPrefix);
  const fullNumber = `${cleanPrefix}${cleanDigits}`;

  const parsed = parsePhoneNumberFromString(fullNumber, countryCode);
  return Boolean(parsed && parsed.isValid());
}

/**
 * Pulisce e normalizza il numero di telefono (solo cifre).
 */
export function cleanPhoneDigits(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Normalizza il numero al formato E.164 internazionale (es. '+393401234567').
 */
export function toE164Format(phone: string, prefix: string, country?: string): string {
  if (!phone) return '';
  const cleanDigits = phone.trim().replace(/[\s\-().]/g, '');
  const cleanPrefix = prefix ? (prefix.startsWith('+') ? prefix : `+${prefix}`) : '+39';

  if (cleanDigits.startsWith('+')) {
    const parsed = parsePhoneNumberFromString(cleanDigits);
    return parsed && parsed.isValid() ? parsed.number : cleanDigits;
  }

  const countryCode = (country?.toUpperCase() as CountryCode) || getCountryCodeFromPrefix(cleanPrefix);
  const fullNumber = `${cleanPrefix}${cleanDigits}`;
  const parsed = parsePhoneNumberFromString(fullNumber, countryCode);

  return parsed && parsed.isValid() ? parsed.number : fullNumber;
}
