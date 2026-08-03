import { describe, expect, it } from 'vitest';
import {
  canonicalEbartexPageUrl,
  isValidScreenshotDataUrl,
  screenshotUploadsEnabled,
} from '@/app/api/_lib/bug-report-input';

function minimalJpeg(width: number, height: number): string {
  const bytes = Buffer.from([
    0xff, 0xd8,
    0xff, 0xc0, 0x00, 0x11, 0x08,
    (height >> 8) & 0xff, height & 0xff,
    (width >> 8) & 0xff, width & 0xff,
    0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x00, 0x03, 0x11, 0x00,
    0xff, 0xd9,
  ]);
  return `data:image/jpeg;base64,${bytes.toString('base64')}`;
}

describe('bug-report untrusted inputs', () => {
  it('canonicalizza soltanto URL HTTPS del sito e rimuove query/fragment', () => {
    expect(
      canonicalEbartexPageUrl('https://www.ebartex.com/products/123?token=secret#panel'),
    ).toBe('https://www.ebartex.com/products/123');
    expect(canonicalEbartexPageUrl('javascript:alert(1)')).toBeNull();
    expect(canonicalEbartexPageUrl('https://ebartex.com.attacker.test/path')).toBeNull();
    expect(canonicalEbartexPageUrl('https://tracker.ebartex.com/path')).toBeNull();
    expect(canonicalEbartexPageUrl('https://user:pass@www.ebartex.com/path')).toBeNull();
  });

  it('richiede JPEG canonico con magic bytes e dimensioni limitate', () => {
    expect(isValidScreenshotDataUrl(minimalJpeg(800, 600))).toBe(true);
    expect(isValidScreenshotDataUrl('data:image/jpeg;base64,PHN2Zz48L3N2Zz4=')).toBe(false);
    expect(isValidScreenshotDataUrl(minimalJpeg(8_193, 10))).toBe(false);
    expect(isValidScreenshotDataUrl(minimalJpeg(5_000, 5_000))).toBe(false);
  });

  it('disabilita gli screenshot nel runtime di produzione finché manca re-encoding', () => {
    const previous = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = 'production';
    expect(screenshotUploadsEnabled()).toBe(false);
    (process.env as Record<string, string>).NODE_ENV = previous ?? 'test';
  });
});
