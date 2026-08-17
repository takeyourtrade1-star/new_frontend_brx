import { describe, expect, it } from 'vitest';
import { getTradeBalanceSummary } from '@/components/feature/scambi/TradeBalanceIndicator';

describe('getTradeBalanceSummary', () => {
  it('resta neutra senza valori', () => {
    expect(getTradeBalanceSummary(0, 0)).toEqual({
      direction: 'empty',
      differenceCents: 0,
      differencePercent: 0,
      tiltDeg: 0,
    });
  });

  it('considera bilanciato uno scarto entro il cinque percento', () => {
    const summary = getTradeBalanceSummary(9_500, 10_000);
    expect(summary.direction).toBe('balanced');
    expect(summary.differenceCents).toBe(500);
    expect(summary.differencePercent).toBe(0.05);
    expect(summary.tiltDeg).toBeGreaterThan(0);
  });

  it('pende verso il lato richiesto quando vale di più', () => {
    const summary = getTradeBalanceSummary(4_000, 10_000);
    expect(summary.direction).toBe('requested');
    expect(summary.differenceCents).toBe(6_000);
    expect(summary.tiltDeg).toBeGreaterThan(0);
  });

  it('pende verso il lato offerto quando vale di più', () => {
    const summary = getTradeBalanceSummary(10_000, 2_500);
    expect(summary.direction).toBe('offered');
    expect(summary.differenceCents).toBe(7_500);
    expect(summary.tiltDeg).toBeLessThan(0);
  });

  it('normalizza valori negativi provenienti da dati corrotti', () => {
    const summary = getTradeBalanceSummary(-100, 2_000);
    expect(summary.direction).toBe('requested');
    expect(summary.differenceCents).toBe(2_000);
    expect(summary.tiltDeg).toBe(17);
  });
});
