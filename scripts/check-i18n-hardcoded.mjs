import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = ['app', 'components'];
const EXCLUDED_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'coverage', 'api']);
const EXCLUDED_FILES = ['app/bidding/page.tsx'];

const TEXT_NODE_REGEX = />\s*([^<>{}\n][^<>{}\n]*)\s*</g;
const ATTR_REGEX = /\b(placeholder|title|alt|aria-label)\s*=\s*"([^"]*[A-Za-zÀ-ÖØ-öø-ÿ][^"]*)"/g;
const MAX_PRINTED = 300;

const results = [];

function normalizeRelPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function isExcludedPath(filePath) {
  const rel = normalizeRelPath(path.relative(ROOT, filePath));
  return EXCLUDED_FILES.includes(rel);
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      walk(fullPath);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!fullPath.endsWith('.tsx')) continue;
    if (isExcludedPath(fullPath)) continue;
    scanFile(fullPath);
  }
}

function isLikelyTranslatableText(value) {
  const text = value.trim();
  if (!text) return false;
  if (/^[0-9\s.,:;!?%€$+-]+$/.test(text)) return false;
  if (/^[A-Z0-9_\-.:/]+$/.test(text)) return false;
  if (/^#[0-9A-Fa-f]+$/.test(text)) return false;
  if (/^(http|https):\/\//.test(text)) return false;
  return /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(text);
}

function isLikelyCodeFragment(value) {
  const text = value.trim().replace(/\s+/g, ' ');
  if (!text) return false;

  if (/(=>|===|!==|&&|\|\||\?\s*\(|\)\s*:\s*)/.test(text)) return true;
  if (/[=><{}()[\]|]/.test(text)) return true;
  if (/\b(import|export|return|const|let|var|function|class)\b/.test(text)) return true;
  if (/[A-Za-z_]\w*\s*\(/.test(text) && !/[.!?]$/.test(text)) return true;

  return false;
}

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function pushResult(filePath, kind, value, index, content) {
  if (isLikelyCodeFragment(value)) return;
  if (!isLikelyTranslatableText(value)) return;
  const rel = normalizeRelPath(path.relative(ROOT, filePath));
  results.push({
    file: rel,
    line: getLineNumber(content, index),
    kind,
    value: value.trim().slice(0, 120),
  });
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  let match;
  while ((match = TEXT_NODE_REGEX.exec(content)) !== null) {
    const value = match[1] ?? '';
    pushResult(filePath, 'text', value, match.index, content);
  }

  while ((match = ATTR_REGEX.exec(content)) !== null) {
    const value = match[2] ?? '';
    pushResult(filePath, `attr:${match[1]}`, value, match.index, content);
  }
}

for (const dir of TARGET_DIRS) {
  const full = path.join(ROOT, dir);
  if (fs.existsSync(full)) walk(full);
}

if (results.length === 0) {
  console.log('✅ i18n check passed: no obvious hardcoded frontend strings found.');
  process.exit(0);
}

results.sort((a, b) => (a.file === b.file ? a.line - b.line : a.file.localeCompare(b.file)));

console.log('❌ i18n check failed: possible hardcoded strings found.');
console.log('Review these and move user-facing text to i18n keys where appropriate.\n');

for (const item of results.slice(0, MAX_PRINTED)) {
  console.log(`- ${item.file}:${item.line} [${item.kind}] ${item.value}`);
}

if (results.length > MAX_PRINTED) {
  console.log(`\n...and ${results.length - MAX_PRINTED} more results`);
}

process.exit(1);
