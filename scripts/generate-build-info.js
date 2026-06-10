const { execSync } = require('child_process');
const { writeFileSync } = require('fs');
const path = require('path');

function getGitInfo() {
  try {
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8', cwd: process.cwd() }).trim();
    const dateStr = execSync('git log -1 --format=%ci', { encoding: 'utf-8', cwd: process.cwd() }).trim();
    const date = new Date(dateStr);
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    return { hash, date: formattedDate };
  } catch (error) {
    console.warn('⚠️  Impossibile leggere info git, fallback a dev:', error.message);
    return { hash: 'dev', date: null };
  }
}

const info = getGitInfo();
const outPath = path.join(process.cwd(), 'public', 'build-info.json');
writeFileSync(outPath, JSON.stringify(info, null, 2));
console.log('✅ Build info scritto:', info);
