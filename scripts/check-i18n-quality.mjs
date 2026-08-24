/**
 * Controllo QUALITÀ traduzioni (complemento di check-i18n-keys.mjs, che verifica
 * solo la PARITÀ delle chiavi). Qui confrontiamo i VALORI di de/fr/es/pt contro
 * en (fallback): una chiave con valore identico a en è "potenzialmente non
 * tradotta".
 *
 * Molti valori sono però LEGITTIMAMENTE identici (brand, gergo TCG, nomi giochi,
 * simboli, sole interpolazioni): una allowlist li esclude per evitare falsi
 * positivi. Vedi memoria plan-06-i18n-progress.
 *
 * Uso:
 *   node scripts/check-i18n-quality.mjs            # report, exit 0
 *   node scripts/check-i18n-quality.mjs --strict   # exit 1 se restano sospette
 *   node scripts/check-i18n-quality.mjs --list      # elenca tutte le sospette
 *   I18N_QUALITY_BUDGET=120 node ... --strict       # tollera fino a N sospette
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MESSAGES_DIR = path.join(ROOT, 'lib/i18n/messages');
const TARGET_LOCALES = ['de', 'fr', 'es', 'pt'];

const STRICT = process.argv.includes('--strict');
const LIST = process.argv.includes('--list');
const BUDGET = Number.parseInt(process.env.I18N_QUALITY_BUDGET ?? '0', 10);

/** Parsa `  'chiave': 'valore',` → Map(key → value). Gestisce \' e \\ . */
function parseMessages(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const map = new Map();
  const re = /^\s+'((?:[^'\\]|\\.)*)':\s*'((?:[^'\\]|\\.)*)'\s*,?\s*$/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    const key = m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
    const value = m[2].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
    map.set(key, value);
  }
  return map;
}

/**
 * Namespace tecnici/interni da ignorare del tutto (non sono prosa utente o sono
 * volutamente non tradotti).
 */
const SKIP_KEY_PREFIXES = [
  'asso.', // mascotte dev
  'country.', // nomi paese: spesso proper noun identici tra lingue
  'games.', // titoli/brand giochi (Magic, Pokémon, One Piece…)
  'phonePrefix.', // prefissi/sigle internazionali
];

/**
 * Valori che POSSONO legittimamente restare identici a en in tutte le lingue:
 * brand, nomi giochi, gergo TCG, sigle. Match case-insensitive sul valore intero.
 */
const ALLOW_EXACT = new Set(
  [
    // Brand / prodotti
    'BRX', 'BRX Express', 'Ebartex', 'Ebartex Boutique', 'PayPal', 'Authy',
    'Stripe', 'Google', 'Apple', 'iOS', 'Android',
    // Giochi
    'Magic', 'Magic: The Gathering', 'Pokémon', 'Pokemon', 'One Piece',
    'Yu-Gi-Oh!', 'Yu-Gi-Oh', 'MTG', 'TCG',
    // Gergo / sigle
    'Mint', 'NM', 'EX', 'LP', 'PL', 'PO', 'Foil', 'Etched', 'Glossy', 'Set',
    'Graded', 'Planeswalker', 'Land', 'Holo', 'Reverse', 'Promo',
    'ID', 'URL', 'Email', 'E-mail', 'PDF', 'OK', 'PIN', 'OTP', 'MFA', 'IVA',
    'QR', 'CSV', 'JSON', 'SKU',
    // Parole identiche in più lingue romanze/germaniche o feature-name
    'Menu', 'Scan', 'Online', 'Wishlist', 'Login', 'Logout',
    'Marketplace', 'Trading', 'Booster', 'Reset', 'Standard', 'Test', 'Demo',
  ].map((s) => s.toLowerCase())
);

/** Solo lettere? Se un valore non contiene lettere è sicuramente "non testo". */
function hasLetters(value) {
  return /\p{L}/u.test(value);
}

/** Rimuove interpolazioni {x} e markup per valutare il testo "nudo". */
function strip(value) {
  return value
    .replace(/\{[^}]*\}/g, '') // {count}, {date}, …
    .replace(/<[^>]*>/g, '') // tag html
    .replace(/[#@€$%·•|/\\\-–—:.,!?()[\]"'`*+=_~\s\d]/g, '')
    .trim();
}

/** Una chiave è "scusata" (identica a en ma legittima)? */
function isExcused(value) {
  const v = value.trim();
  if (!hasLetters(v)) return true; // simboli/numeri/emoji
  if (ALLOW_EXACT.has(v.toLowerCase())) return true; // brand/gergo
  const bare = strip(v);
  if (bare.length <= 2) return true; // dopo aver tolto interpolazioni resta ~nulla
  // valore composto solo da token in allowlist (es. "Magic / Pokémon")
  const tokens = v.split(/[\s/,·•|]+/).filter(Boolean);
  if (tokens.length > 0 && tokens.every((t) => ALLOW_EXACT.has(t.toLowerCase()))) {
    return true;
  }
  return false;
}

function shouldSkipKey(key) {
  return SKIP_KEY_PREFIXES.some((p) => key.startsWith(p));
}

const en = parseMessages(path.join(MESSAGES_DIR, 'en.ts'));

let totalSuspect = 0;
const perLocale = {};

for (const locale of TARGET_LOCALES) {
  const loc = parseMessages(path.join(MESSAGES_DIR, `${locale}.ts`));
  const suspects = [];
  for (const [key, enValue] of en) {
    if (shouldSkipKey(key)) continue;
    const locValue = loc.get(key);
    if (locValue === undefined) continue; // parità chiavi è compito di i18n:keys
    if (locValue.trim() !== enValue.trim()) continue; // tradotto: ok
    if (isExcused(enValue)) continue; // identico ma legittimo
    suspects.push({ key, value: enValue });
  }
  perLocale[locale] = suspects;
  totalSuspect += suspects.length;
}

console.log('i18n quality — chiavi potenzialmente non tradotte (escluse brand/gergo):');
for (const locale of TARGET_LOCALES) {
  const suspects = perLocale[locale];
  console.log(`  ${locale}: ${suspects.length}`);
  if (LIST) {
    for (const s of suspects) console.log(`      - ${s.key} :: "${s.value}"`);
  }
}
console.log(`  totale: ${totalSuspect}${BUDGET ? ` (budget ${BUDGET})` : ''}`);

if (STRICT && totalSuspect > BUDGET) {
  console.error(
    `\ni18n quality FAIL: ${totalSuspect} valori non tradotti oltre il budget (${BUDGET}).`
  );
  console.error('Usa --list per vederli, oppure traduci in de/fr/es/pt.');
  process.exit(1);
}

if (!STRICT) {
  console.log('\n(report informativo — usa --strict per far fallire la CI)');
}
