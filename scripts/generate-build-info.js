const { execSync } = require('child_process');
const { writeFileSync } = require('fs');
const path = require('path');

function getGitInfo() {
  try {
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8', cwd: process.cwd() }).trim();
    const timestamp = parseInt(execSync('git log -1 --format=%ct', { encoding: 'utf-8', cwd: process.cwd() }).trim(), 10);
    return { hash, timestamp };
  } catch (error) {
    console.warn('⚠️  Impossibile leggere info git, fallback a dev:', error.message);
    return { hash: 'dev', timestamp: null };
  }
}

const info = getGitInfo();
const outPath = path.join(process.cwd(), 'public', 'build-info.json');
writeFileSync(outPath, JSON.stringify(info, null, 2));
console.log('✅ Build info scritto:', info);
