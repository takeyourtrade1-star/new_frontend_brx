import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Amplify release gates', () => {
  const config = readFileSync(join(process.cwd(), 'amplify.yml'), 'utf8');
  const ci = readFileSync(join(process.cwd(), '.github/workflows/ci.yml'), 'utf8');

  it('usa runtime bloccato, installazione riproducibile e gate bloccanti', () => {
    expect(config).toContain('nvm install 24.18.1');
    expect(config).toContain('test "$(node --version)" = "v24.18.1"');
    expect(config).toContain('npm ci --ignore-scripts');
    expect(config).toContain('npm audit --audit-level=high');
    expect(config).toContain('npm run lint');
    expect(config).toContain('npm run typecheck');
    expect(config).toContain('npm run i18n:keys');
    expect(config).toContain('npm test -- --run');
    expect(config).not.toContain('npm install\n');
    expect(config).not.toContain('node_modules/**/*');
  });

  it('mantiene anche CI su dipendenze locali bloccate', () => {
    expect(ci).not.toContain('run: npx vitest');
    expect(ci).toContain('run: npm test -- --run');
    expect(ci).toContain('npm ci --ignore-scripts');
    expect(ci).toContain('npm audit --audit-level=high');
    expect(ci).toContain('name: Production build (blocking)');
    expect(ci).toContain('run: test "$(node --version)" = "v24.18.1"');
    expect(ci).toContain('run: npm run build');
    const blockingBuild = ci.split('  build:\n', 2)[1]?.split('  # Report del budget', 1)[0] ?? '';
    expect(blockingBuild).not.toContain('continue-on-error: true');
  });
});
