import { describe, expect, it } from 'vitest';

import { minNextBidEur, roundUpToHalfStep } from '@/lib/auction/bid-math';

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
