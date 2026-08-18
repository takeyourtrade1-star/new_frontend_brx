import { describe, it, expect } from 'vitest';
import {
  isValidPhone,
  getCountryCodeFromPrefix,
  cleanPhoneDigits,
  toE164Format,
} from '@/lib/validations/phone';

describe('Phone Validation & Normalization with libphonenumber', () => {
  describe('getCountryCodeFromPrefix', () => {
    it('returns correct ISO country code for standard prefixes', () => {
      expect(getCountryCodeFromPrefix('+39')).toBe('IT');
      expect(getCountryCodeFromPrefix('+49')).toBe('DE');
      expect(getCountryCodeFromPrefix('+33')).toBe('FR');
      expect(getCountryCodeFromPrefix('+34')).toBe('ES');
      expect(getCountryCodeFromPrefix('+44')).toBe('GB');
      expect(getCountryCodeFromPrefix('+1')).toBe('US');
      expect(getCountryCodeFromPrefix('+41')).toBe('CH');
      expect(getCountryCodeFromPrefix('+43')).toBe('AT');
    });

    it('handles prefixes without leading plus', () => {
      expect(getCountryCodeFromPrefix('39')).toBe('IT');
      expect(getCountryCodeFromPrefix('49')).toBe('DE');
    });
  });

  describe('isValidPhone - Italian Numbers (+39)', () => {
    it('accepts valid Italian mobile numbers', () => {
      expect(isValidPhone('3401234567', '+39', 'IT')).toBe(true);
      expect(isValidPhone('3331234567', '+39', 'IT')).toBe(true);
      expect(isValidPhone('348 123 4567', '+39')).toBe(true);
      expect(isValidPhone('320-1234567', '+39')).toBe(true);
    });

    it('rejects fake, too short, or impossible numbers', () => {
      expect(isValidPhone('12345', '+39', 'IT')).toBe(false);
      expect(isValidPhone('0000000000', '+39', 'IT')).toBe(false);
      expect(isValidPhone('1111111111', '+39', 'IT')).toBe(false);
      expect(isValidPhone('99999999999999', '+39', 'IT')).toBe(false);
      expect(isValidPhone('abcdefghij', '+39', 'IT')).toBe(false);
      expect(isValidPhone('', '+39', 'IT')).toBe(false);
    });
  });

  describe('isValidPhone - International Numbers', () => {
    it('accepts valid German numbers (+49)', () => {
      expect(isValidPhone('15123456789', '+49', 'DE')).toBe(true);
    });

    it('accepts valid French numbers (+33)', () => {
      expect(isValidPhone('612345678', '+33', 'FR')).toBe(true);
    });

    it('accepts valid Spanish numbers (+34)', () => {
      expect(isValidPhone('612345678', '+34', 'ES')).toBe(true);
    });

    it('accepts valid UK numbers (+44)', () => {
      expect(isValidPhone('7123456789', '+44', 'GB')).toBe(true);
    });

    it('accepts valid US numbers (+1)', () => {
      expect(isValidPhone('2025550143', '+1', 'US')).toBe(true);
    });
  });

  describe('toE164Format', () => {
    it('formats numbers into standard E.164 string', () => {
      expect(toE164Format('340 123 4567', '+39')).toBe('+393401234567');
      expect(toE164Format('202-555-0143', '+1')).toBe('+12025550143');
    });
  });

  describe('cleanPhoneDigits', () => {
    it('strips all non-digit characters', () => {
      expect(cleanPhoneDigits('(340) 123-4567')).toBe('3401234567');
      expect(cleanPhoneDigits('+39 340 123')).toBe('+39340123');
    });
  });

  describe('Integration with registerDemoSchema', () => {
    // Dynamically import to ensure test isolation
    it('passes for a valid phone number', async () => {
      const { registerDemoSchema } = await import('@/lib/registrati/schema');
      const validData = {
        username: 'validuser',
        email: 'test@example.com',
        password: 'ValidPassword1',
        phone: '3401234567',
        phone_prefix: '+39',
        country: 'IT',
        termsAccepted: true,
        specificClausesAccepted: true,
        privacyAccepted: true,
        cancellationAccepted: true,
        adultConfirmed: true,
      };
      const result = registerDemoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('fails when phone is a random fake number', async () => {
      const { registerDemoSchema } = await import('@/lib/registrati/schema');
      const invalidData = {
        username: 'validuser',
        email: 'test@example.com',
        password: 'ValidPassword1',
        phone: '12345',
        phone_prefix: '+39',
        country: 'IT',
        termsAccepted: true,
        specificClausesAccepted: true,
        privacyAccepted: true,
        cancellationAccepted: true,
        adultConfirmed: true,
      };
      const result = registerDemoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const phoneError = result.error.errors.find((e) => e.path.includes('phone'));
        expect(phoneError).toBeDefined();
        expect(phoneError?.message).toBe('Inserisci un numero di telefono valido');
      }
    });
  });
});
