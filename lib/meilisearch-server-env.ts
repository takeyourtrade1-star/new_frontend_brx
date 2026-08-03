/**
 * Meilisearch config for Next.js server routes (API routes, RSC loaders).
 * Only server-only variables are accepted. The credential must be a dedicated
 * Meilisearch key whose actions are limited to `search` and whose indexes are
 * limited to the public catalogue. Never put a master/admin key in this app.
 */

import 'server-only';

import { trustedServiceOrigin } from '@/app/api/_lib/upstream-url';

export type MeilisearchServerConfig = {
  url: string;
  apiKey: string;
  index: string;
};

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

function canonicalIndexUid(rawValue: string | undefined): string {
  if (!rawValue) return process.env.NODE_ENV === 'production' ? '' : 'cards';
  if (rawValue !== rawValue.trim()) return '';
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(rawValue) ? rawValue : '';
}

export function getMeilisearchServerConfig(): MeilisearchServerConfig {
  const url = trustedServiceOrigin(trimTrailingSlashes(
    process.env.MEILISEARCH_URL ||
      process.env.MEILI_URL ||
      ''
  ));

  // Intentionally no fallback to generic/master-key variable names: accepting
  // those makes an accidental high-privilege deployment far too easy.
  const apiKey = process.env.MEILISEARCH_SEARCH_API_KEY || '';

  const index = canonicalIndexUid(
    process.env.MEILISEARCH_INDEX ||
    process.env.MEILISEARCH_INDEX_NAME ||
    process.env.MEILI_INDEX
  );

  return { url, apiKey, index };
}
