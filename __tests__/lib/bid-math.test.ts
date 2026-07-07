import { describe, expect, it } from 'vitest';

import { minNextBidEur, parseLocaleMoneyInput, roundUpToHalfStep } from '@/lib/auction/bid-math';

describe('parseLocaleMoneyInput', () => {
  it('notazione italiana con virgola: punto = migliaia, virgola = decimali', () => {
    expect(parseLocaleMoneyInput('10,50')).toBe(10.5);
    expect(parseLocaleMoneyInput('1.234,50')).toBe(1234.5);
    expect(parseLocaleMoneyInput('0,5')).toBe(0.5);
  });

  it('punti in gruppi di 3 senza virgola = separatore migliaia ("10.000" → 10000, non 10)', () => {
    expect(parseLocaleMoneyInput('1.000')).toBe(1000);
    expect(parseLocaleMoneyInput('10.000')).toBe(10000);
    expect(parseLocaleMoneyInput('12.345.678')).toBe(12345678);
  });

  it('punto non in gruppi di 3 = decimale', () => {
    expect(parseLocaleMoneyInput('10.5')).toBe(10.5);
    expect(parseLocaleMoneyInput('10.50')).toBe(10.5);
    expect(parseLocaleMoneyInput('1.5')).toBe(1.5);
  });

  it('"0.500" è decimale (nessuno scrive le migliaia partendo da 0)', () => {
    expect(parseLocaleMoneyInput('0.500')).toBe(0.5);
  });

  it('interi e input vuoti/invalidi', () => {
    expect(parseLocaleMoneyInput('42')).toBe(42);
    expect(parseLocaleMoneyInput('  15  ')).toBe(15);
    expect(parseLocaleMoneyInput('')).toBeNaN();
    expect(parseLocaleMoneyInput('abc')).toBeNaN();
  });
});

describe('roundUpToHalfStep', () => {
  it('rounds 14.2 to 14.5', () => {
    expect(roundUpToHalfStep(14.2)).toBe(14.5);
  });

  it('keeps 14.5 unchanged', () => {
    expect(roundUpToHalfStep(14.5)).toBe(14.5);
  });

  it('rounds 14.7 to 15', () => {
    expect(roundUpToHalfStep(14.7)).toBe(15);
  });
});

describe('minNextBidEur with half-step rounding', () => {
  it('rounds minimum from 4.02 to 4.5', () => {
    expect(roundUpToHalfStep(4.02)).toBe(4.5);
  });

  it('rounds minimum from 4.4 to 4.5', () => {
    expect(roundUpToHalfStep(4.4)).toBe(4.5);
  });

  it('keeps minNextBid aligned to half-step', () => {
    expect(minNextBidEur(3.51)).toBe(5);
  });
});
