import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx|js|jsx)$/.test(entry.name) ? [path] : [];
  });
}

describe('font supply-chain boundary', () => {
  it('non usa provider di font scaricati durante la build', () => {
    const sourceRoots = ['app', 'components', 'lib'].map((name) =>
      join(process.cwd(), name),
    );
    const source = sourceRoots
      .flatMap(sourceFiles)
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n');

    expect(source).not.toContain('next/font/google');
    expect(source).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
  });
});
