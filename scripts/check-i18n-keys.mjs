/**
 * Verifica che ogni locale abbia le stesse chiavi di en.ts (source of truth).
 * Exit 1 se mancano o sono in eccesso chiavi in it/de/fr/es/pt.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MESSAGES_DIR = path.join(ROOT, 'lib/i18n/messages');
const LOCALES = ['it', 'de', 'fr', 'es', 'pt'];

function extractKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return [...content.matchAll(/^\s+'([^']+)':/gm)].map((m) => m[1]);
}

const enKeys = extractKeys(path.join(MESSAGES_DIR, 'en.ts'));
const enSet = new Set(enKeys);

let failed = false;

for (const locale of LOCALES) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.ts`);
  const keys = extractKeys(filePath);
  const localeSet = new Set(keys);
  const missing = enKeys.filter((k) => !localeSet.has(k));
  const extra = keys.filter((k) => !enSet.has(k));

  if (missing.length === 0 && extra.length === 0) continue;

  failed = true;
  console.error(`\n[${locale}]`);
  if (missing.length > 0) {
    console.error(`  missing (${missing.length}):`);
    for (const k of missing) console.error(`    - ${k}`);
  }
  if (extra.length > 0) {
    console.error(`  extra (${extra.length}):`);
    for (const k of extra) console.error(`    - ${k}`);
  }
}

if (failed) {
  console.error('\ni18n key mismatch: all locales must match lib/i18n/messages/en.ts');
  process.exit(1);
}

console.log(`i18n keys OK (${enKeys.length} keys × ${LOCALES.length + 1} locales)`);
