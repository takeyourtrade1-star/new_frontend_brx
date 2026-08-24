import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');

describe('idempotency key security contract', () => {
  it('uses the shared Web Crypto generator for auctions and trades', () => {
    const auction = readFileSync(resolve(root, 'lib/api/auction-client.ts'), 'utf8');
    const trades = readFileSync(resolve(root, 'lib/api/trades-client.ts'), 'utf8');
    const generator = readFileSync(
      resolve(root, 'lib/security/secure-idempotency-key.ts'),
      'utf8',
    );
    const randomSource = readFileSync(
      resolve(root, 'lib/security/secure-random-id.ts'),
      'utf8',
    );

    expect(auction).toContain('createSecureIdempotencyKey()');
    expect(trades).toContain('createSecureIdempotencyKey()');
    expect(auction).not.toContain('Math.random');
    expect(trades).not.toContain('Math.random');
    expect(generator).toContain('createSecureRandomUuid');
    expect(randomSource).toContain('getRandomValues');
    expect(generator).not.toContain('Date.now');
    expect(generator).not.toContain('Math.random');
    expect(randomSource).not.toContain('Math.random');
  });
});
