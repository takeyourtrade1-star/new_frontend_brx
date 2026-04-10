import { describe, it, expect } from 'vitest';
import { formatEuroNoSpace, cn } from '@/lib/utils';

describe('formatEuroNoSpace', () => {
  it('formats integer without space', () => {
    const result10 = formatEuroNoSpace(10, 'it-IT');
    expect(result10).toMatch(/^\d+[,.]\d{2}€$/); // Ends with €, no space
    expect(result10).not.toContain(' €');
    expect(result10).not.toContain('\xa0€'); // No non-breaking space

    const result100 = formatEuroNoSpace(100, 'it-IT');
    expect(result100).toMatch(/^\d+[,.]\d{2}€$/);
    expect(result100).not.toContain(' €');
  });

  it('formats decimal without space', () => {
    const result = formatEuroNoSpace(10.5, 'it-IT');
    expect(result).toMatch(/^\d+[,.]\d{2}€$/);
    expect(result).not.toContain(' €');
    expect(result).not.toContain('\xa0€');

    expect(formatEuroNoSpace(10.99, 'it-IT')).not.toContain(' €');
    expect(formatEuroNoSpace(0.01, 'it-IT')).not.toContain(' €');
  });

  it('formats zero correctly', () => {
    const result = formatEuroNoSpace(0, 'it-IT');
    expect(result).toMatch(/0[,.]00€$/);
    expect(result).not.toContain(' €');
  });

  it('handles different locales', () => {
    // German locale
    const german = formatEuroNoSpace(1234.56, 'de-DE');
    expect(german).not.toContain(' €');
    expect(german).not.toContain('\xa0€');
    expect(german).toContain('€');

    // French locale
    const french = formatEuroNoSpace(1234.56, 'fr-FR');
    expect(french).not.toContain(' €');
    expect(french).not.toContain('\xa0€');
    expect(french).toContain('€');

    // English locale (€ comes first in some Node.js versions)
    const english = formatEuroNoSpace(1234.56, 'en-US');
    expect(english).not.toContain(' €');
    expect(english).not.toContain('\xa0€');
    expect(english).toContain('€');
  });

  it('uses it-IT as default locale', () => {
    const result = formatEuroNoSpace(10);
    expect(result).toContain('€');
    expect(result).not.toContain(' €');
  });

  it('handles negative numbers', () => {
    const neg10 = formatEuroNoSpace(-10, 'it-IT');
    expect(neg10).toContain('€');
    expect(neg10).not.toContain(' €');
    expect(neg10).toMatch(/-\d+[,.]\d{2}€$/);

    expect(formatEuroNoSpace(-10.5, 'it-IT')).not.toContain(' €');
  });

  it('handles very large numbers', () => {
    const large = formatEuroNoSpace(1000000.99, 'it-IT');
    expect(large).toContain('€');
    expect(large).not.toContain(' €');
    expect(large).not.toContain('\xa0€');
  });
});

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
  });

  it('handles tailwind conflicts', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    expect(cn('base', isActive && 'active')).toBe('base active');
    expect(cn('base', false && 'hidden')).toBe('base');
  });
});
