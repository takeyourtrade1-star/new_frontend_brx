import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('server-only secret boundaries', () => {
  it('separa config e fetch Meilisearch dagli helper importati dai client', () => {
    const shared = readFileSync(join(process.cwd(), 'lib/product-detail.ts'), 'utf8');
    const server = readFileSync(join(process.cwd(), 'lib/product-detail-server.ts'), 'utf8');
    const config = readFileSync(join(process.cwd(), 'lib/meilisearch-server-env.ts'), 'utf8');

    expect(shared).not.toContain('getMeilisearchServerConfig');
    expect(shared).not.toContain('process.env');
    expect(server).toContain("import 'server-only'");
    expect(config).toContain("import 'server-only'");
  });
});
