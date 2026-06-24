import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const MESSAGES_DIR = path.join(process.cwd(), 'lib/i18n/messages');
const LOCALES = ['it', 'de', 'fr', 'es', 'pt'];

function extractKeys(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf8');
  return [...content.matchAll(/^\s+'([^']+)':/gm)].map((m) => m[1]!);
}

describe('i18n keys parity', () => {
  const enKeys = extractKeys(path.join(MESSAGES_DIR, 'en.ts'));
  const enSet = new Set(enKeys);

  it('english messages must not be empty', () => {
    expect(enKeys.length).toBeGreaterThan(0);
  });

  for (const locale of LOCALES) {
    it(`${locale}.ts must have the same keys as en.ts`, () => {
      const keys = extractKeys(path.join(MESSAGES_DIR, `${locale}.ts`));
      const localeSet = new Set(keys);
      const missing = enKeys.filter((k) => !localeSet.has(k));
      const extra = keys.filter((k) => !enSet.has(k));

      expect(
        missing,
        `Missing keys in ${locale}.ts: ${missing.join(', ')}`
      ).toEqual([]);
      expect(
        extra,
        `Extra keys in ${locale}.ts: ${extra.join(', ')}`
      ).toEqual([]);
    });
  }
});
