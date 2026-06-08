/**
 * Meilisearch config for Next.js server routes (API routes, RSC loaders).
 * Prefer server-only env vars so search keys are not required in the browser bundle.
 */

export type MeilisearchServerConfig = {
  url: string;
  apiKey: string;
  index: string;
};

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

export function getMeilisearchServerConfig(): MeilisearchServerConfig {
  const url = trimTrailingSlashes(
    process.env.MEILISEARCH_URL ||
      process.env.MEILI_URL ||
      process.env.NEXT_PUBLIC_MEILISEARCH_URL ||
      process.env.NEXT_PUBLIC_MEILISEARCH_HOST ||
      process.env.VITE_MEILISEARCH_URL ||
      process.env.VITE_MEILISEARCH_HOST ||
      ''
  );

  const apiKey =
    process.env.MEILISEARCH_API_KEY ||
    process.env.MEILI_API_KEY ||
    process.env.MEILISEARCH_SEARCH_KEY ||
    process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY ||
    process.env.VITE_MEILISEARCH_API_KEY ||
    '';

  const index =
    process.env.MEILISEARCH_INDEX ||
    process.env.MEILISEARCH_INDEX_NAME ||
    process.env.MEILI_INDEX ||
    process.env.NEXT_PUBLIC_MEILISEARCH_INDEX ||
    'cards';

  return { url, apiKey, index };
}
