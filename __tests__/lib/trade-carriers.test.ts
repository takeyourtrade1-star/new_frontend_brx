import { describe, expect, it } from 'vitest';
import { tradeCarrierLabel, tradeTrackingUrl } from '@/lib/shipping/trade-carriers';

describe('trade carriers', () => {
  it('costruisce link tracking ufficiali con codice codificato', () => {
    expect(tradeTrackingUrl('ups', '1Z 123')).toBe(
      'https://www.ups.com/track?loc=it_IT&tracknum=1Z%20123'
    );
    expect(tradeTrackingUrl('poste', 'ZA123IT')).toContain('ZA123IT');
  });

  it('lascia non cliccabile il corriere personalizzato', () => {
    expect(tradeTrackingUrl('other', 'ABC123')).toBeNull();
    expect(tradeCarrierLabel('other', 'Altro')).toBe('Altro');
  });
});
