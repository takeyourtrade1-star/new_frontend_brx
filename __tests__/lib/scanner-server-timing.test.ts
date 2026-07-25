import { describe, expect, it } from 'vitest';

import { parseScannerServerTiming } from '@/lib/scanner/server-timing';

describe('scanner Server-Timing parser', () => {
  it('estrae le durate delle fasi esposte dal BFF', () => {
    expect(
      parseScannerServerTiming(
        'scanner_body;dur=12.4, scanner_upstream;dur=843.1;desc="BRX Match"',
      ),
    ).toEqual({
      scanner_body: 12.4,
      scanner_upstream: 843.1,
    });
  });

  it('ignora metriche senza durata o con valori non validi', () => {
    expect(
      parseScannerServerTiming(
        'cache;desc="miss", invalid;dur=nope, negative;dur=-1, total;dur=900',
      ),
    ).toEqual({ total: 900 });
  });

  it('gestisce un header assente', () => {
    expect(parseScannerServerTiming(null)).toEqual({});
  });
});
