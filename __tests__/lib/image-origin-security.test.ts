import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('remote image origin boundary', () => {
  it('does not let arbitrary wildcard hosts reach the Next image optimizer', () => {
    const config = read('next.config.mjs');
    for (const wildcard of [
      "hostname: '*.cloudfront.net'",
      "hostname: '*.ebartex.com'",
      "hostname: '*.scryfall.io'",
      "hostname: '*.s3.amazonaws.com'",
      "hostname: '*.s3.eu-south-1.amazonaws.com'",
    ]) {
      expect(config).not.toContain(wildcard);
    }
    expect(config).toContain("hostname: 'cdn.ebartex.com'");
    expect(config).toContain("hostname: 'di0y87a9s8da9.cloudfront.net'");
  });

  it('filters user avatars before rendering and bypasses the server optimizer', () => {
    const avatar = read('components/feature/users/UserAvatar.tsx');
    expect(avatar).toContain('safePublicAvatarUrl(avatar_url)');
    expect(avatar).toContain('referrerPolicy="no-referrer"');
    expect(avatar).toMatch(/\bunoptimized\b/);
  });

  it('keeps the CSP free of broad remote-host wildcards', () => {
    const middleware = read('middleware.ts');
    for (const wildcard of [
      'https://*.cloudfront.net',
      'https://*.ebartex.com',
      'https://*.scryfall.io',
      'https://*.s3.amazonaws.com',
      'https://*.s3.eu-south-1.amazonaws.com',
    ]) {
      expect(middleware).not.toContain(wildcard);
    }
    expect(middleware).not.toContain('https://ebartex-brx-match-data.s3');
  });

  it('does not expose scanner diagnostics in production through a query flag', () => {
    const scannerPage = read('app/scanner/page.tsx');
    expect(scannerPage).toContain(
      "process.env.NODE_ENV !== 'production' && searchParams?.get('debug') === '1'",
    );
    expect(scannerPage).not.toContain(
      "process.env.NODE_ENV !== 'production' || searchParams?.get('debug') === '1'",
    );
  });
});
