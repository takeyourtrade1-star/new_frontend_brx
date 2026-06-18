import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const nextDir = path.join(root, '.next');

const limits = {
  maxChunkKiB: Number(process.env.BUNDLE_BUDGET_CHUNK_KB ?? 500),
  maxAppRouteKiB: Number(process.env.BUNDLE_BUDGET_APP_ROUTE_KB ?? 1400),
  maxCssKiB: Number(process.env.BUNDLE_BUDGET_CSS_KB ?? 350),
  maxPublicAssetKiB: Number(process.env.BUNDLE_BUDGET_PUBLIC_ASSET_KB ?? 10240),
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function fileSize(file) {
  try {
    return fs.statSync(file).size;
  } catch {
    return 0;
  }
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

function toKiB(bytes) {
  return bytes / 1024;
}

function formatKiB(bytes) {
  return `${Math.round(toKiB(bytes))} KiB`;
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

const failures = [];

const staticDir = path.join(nextDir, 'static');
if (!fs.existsSync(staticDir)) {
  console.error('Missing .next/static. Run `npm run build` before `npm run bundle:budget`.');
  process.exit(1);
}

const jsChunks = walkFiles(path.join(staticDir, 'chunks'))
  .filter((file) => file.endsWith('.js'))
  .map((file) => ({ file, size: fileSize(file) }))
  .sort((a, b) => b.size - a.size);

const cssFiles = walkFiles(path.join(staticDir, 'css'))
  .filter((file) => file.endsWith('.css'))
  .map((file) => ({ file, size: fileSize(file) }))
  .sort((a, b) => b.size - a.size);

for (const chunk of jsChunks) {
  if (toKiB(chunk.size) > limits.maxChunkKiB) {
    failures.push(
      `JS chunk over ${limits.maxChunkKiB} KiB: ${formatKiB(chunk.size)} ${rel(chunk.file)}`
    );
  }
}

for (const css of cssFiles) {
  if (toKiB(css.size) > limits.maxCssKiB) {
    failures.push(
      `CSS file over ${limits.maxCssKiB} KiB: ${formatKiB(css.size)} ${rel(css.file)}`
    );
  }
}

const appManifestPath = path.join(nextDir, 'app-build-manifest.json');
let routeRows = [];
if (fs.existsSync(appManifestPath)) {
  const manifest = readJson(appManifestPath);
  routeRows = Object.entries(manifest.pages ?? {})
    .filter(([route]) => !route.startsWith('/api/'))
    .map(([route, files]) => {
      const jsFiles = [...new Set(files.filter((file) => file.endsWith('.js')))];
      const size = jsFiles.reduce(
        (sum, file) => sum + fileSize(path.join(nextDir, file)),
        0
      );
      return { route, size };
    })
    .sort((a, b) => b.size - a.size);

  for (const row of routeRows) {
    if (toKiB(row.size) > limits.maxAppRouteKiB) {
      failures.push(
        `App route JS over ${limits.maxAppRouteKiB} KiB: ${formatKiB(row.size)} ${row.route}`
      );
    }
  }
}

const publicAssets = walkFiles(path.join(root, 'public'))
  .map((file) => ({ file, size: fileSize(file) }))
  .filter((row) => toKiB(row.size) > limits.maxPublicAssetKiB)
  .sort((a, b) => b.size - a.size);

for (const asset of publicAssets) {
  failures.push(
    `Public asset over ${limits.maxPublicAssetKiB} KiB: ${formatKiB(asset.size)} ${rel(asset.file)}`
  );
}

console.log('Bundle budget report');
console.log(`- largest JS chunks:`);
for (const row of jsChunks.slice(0, 8)) {
  console.log(`  ${formatKiB(row.size).padStart(8)}  ${rel(row.file)}`);
}
if (routeRows.length) {
  console.log(`- largest app routes:`);
  for (const row of routeRows.slice(0, 8)) {
    console.log(`  ${formatKiB(row.size).padStart(8)}  ${row.route}`);
  }
}
if (cssFiles.length) {
  console.log(`- CSS files:`);
  for (const row of cssFiles.slice(0, 4)) {
    console.log(`  ${formatKiB(row.size).padStart(8)}  ${rel(row.file)}`);
  }
}

if (failures.length) {
  console.error('\nBundle budget failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('\nBundle budget passed.');
