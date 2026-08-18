import fs from 'node:fs';
import path from 'node:path';

const ALLOWED_PREFIXES = [
  'SSO_',
  'AUTH_',
  'MARKETPLACE_',
  'AUCTION_',
  'SYNC_',
  'BRX_',
  'TRUSTED_',
  'RATE_LIMIT_',
  'NEXT_PUBLIC_',
];

const lines = [];
for (const [key, value] of Object.entries(process.env)) {
  if (value === undefined || value === '') continue;
  if (ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    // Escape standard characters for dotenv
    const cleanValue = value.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    lines.push(`${key}="${cleanValue}"`);
  }
}

const rootPath = path.join(process.cwd(), '.env.production');
fs.writeFileSync(rootPath, lines.join('\n') + '\n', 'utf8');

// Also write to .env so any loader picks it up
const dotEnvPath = path.join(process.cwd(), '.env');
fs.writeFileSync(dotEnvPath, lines.join('\n') + '\n', 'utf8');

console.log(`[export-runtime-env] Successfully exported ${lines.length} variables to .env.production and .env`);
