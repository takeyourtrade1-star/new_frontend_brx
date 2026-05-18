/**
 * copy-ort-wasm.mjs — postinstall script
 *
 * Copies the onnxruntime-web WASM files to public/ort-wasm/ so Next.js
 * serves them as static assets at /ort-wasm/*.wasm.
 *
 * The hook sets:
 *   ort.env.wasm.wasmPaths = '/ort-wasm/';
 *
 * Runs automatically after `npm install` via the "postinstall" script.
 * Safe to re-run: existing files are overwritten silently.
 */

import { existsSync, mkdirSync, copyFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const srcDir = join(root, 'node_modules', 'onnxruntime-web', 'dist');
const destDir = join(root, 'public', 'ort-wasm');

if (!existsSync(srcDir)) {
  console.warn('[copy-ort-wasm] onnxruntime-web not found at', srcDir, '— skipping');
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });

let copied = 0;
let skipped = 0;

for (const file of readdirSync(srcDir)) {
  if (!file.endsWith('.wasm')) continue;
  try {
    copyFileSync(join(srcDir, file), join(destDir, file));
    console.log('[copy-ort-wasm] copied:', file);
    copied++;
  } catch (err) {
    console.warn('[copy-ort-wasm] skip', file, '—', err.message);
    skipped++;
  }
}

console.log(`[copy-ort-wasm] done: ${copied} copied, ${skipped} skipped → ${destDir}`);
