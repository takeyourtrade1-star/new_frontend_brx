/**
 * Meilisearch config for Next.js server routes (API routes, RSC loaders).
 * Only server-only variables are accepted. The credential must be a dedicated
 * Meilisearch key whose actions are limited to `search` and whose indexes are
 * limited to the public catalogue. Never put a master/admin key in this app.
 */

import 'server-only';

import { trustedMeilisearchServiceOrigin } from '@/app/api/_lib/upstream-url';
import {
  getMeilisearchIndexEnv,
  getMeilisearchSearchApiKeyEnv,
  getMeilisearchUrlEnv,
  type RuntimeEnvInput,
} from '@/lib/server-runtime-env';

export type MeilisearchServerConfig = {
  url: string;
  apiKey: string;
  index: string;
};

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

function canonicalIndexUid(
  rawValue: string | undefined,
  nodeEnv: string | undefined,
): string {
  if (!rawValue) return nodeEnv === 'production' ? '' : 'cards';
  if (rawValue !== rawValue.trim()) return '';
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(rawValue) ? rawValue : '';
}

export function getMeilisearchServerConfig(
  env?: RuntimeEnvInput,
): MeilisearchServerConfig {
  const url = trustedMeilisearchServiceOrigin(trimTrailingSlashes(
    getMeilisearchUrlEnv(env)
  ), env);

  // Generic master-key aliases remain forbidden. The one compatibility alias
  // was already browser-visible and must stay restricted to search actions.
  const apiKey = getMeilisearchSearchApiKeyEnv(env);

  const index = canonicalIndexUid(
    getMeilisearchIndexEnv(env),
    env ? env.NODE_ENV : process.env.NODE_ENV,
  );

  return { url, apiKey, index };
}
