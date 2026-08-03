import 'server-only';

type EnvCandidate = Readonly<{
  name: string;
  value: string | undefined;
}>;

export type RuntimeEnvInput = Readonly<Record<string, string | undefined>>;

const warnedAliases = new Set<string>();

function warnOnce(message: string): void {
  if (process.env.NODE_ENV === 'test' || warnedAliases.has(message)) return;
  warnedAliases.add(message);
  // Names only: never include environment values in deployment logs.
  console.warn(`[runtime-env] ${message}`);
}

function firstConfigured(
  preferred: EnvCandidate,
  aliases: readonly EnvCandidate[],
): string {
  const preferredValue = preferred.value?.trim();
  if (preferredValue) return preferredValue;

  for (const alias of aliases) {
    const aliasValue = alias.value?.trim();
    if (!aliasValue) continue;
    warnOnce(
      `${alias.name} is a deprecated compatibility alias; configure ${preferred.name} server-side`,
    );
    return aliasValue;
  }
  return '';
}

/** Preserve surrounding whitespace so strict downstream grammars can reject it. */
function firstConfiguredRaw(
  preferred: EnvCandidate,
  aliases: readonly EnvCandidate[],
): string {
  if (preferred.value?.trim()) return preferred.value;

  for (const alias of aliases) {
    if (!alias.value?.trim()) continue;
    warnOnce(
      `${alias.name} is a deprecated compatibility alias; configure ${preferred.name} server-side`,
    );
    return alias.value;
  }
  return '';
}

/** Transitional aliases for service origins that were already public config. */
export function getAuthApiUrlEnv(env?: RuntimeEnvInput): string {
  return firstConfigured(
    { name: 'AUTH_API_URL', value: env ? env.AUTH_API_URL : process.env.AUTH_API_URL },
    [{
      name: 'NEXT_PUBLIC_AUTH_API_URL',
      value: env ? env.NEXT_PUBLIC_AUTH_API_URL : process.env.NEXT_PUBLIC_AUTH_API_URL,
    }],
  );
}

export function getAuctionApiUrlEnv(env?: RuntimeEnvInput): string {
  return firstConfigured(
    { name: 'AUCTION_API_URL', value: env ? env.AUCTION_API_URL : process.env.AUCTION_API_URL },
    [{
      name: 'NEXT_PUBLIC_AUCTION_API_URL',
      value: env ? env.NEXT_PUBLIC_AUCTION_API_URL : process.env.NEXT_PUBLIC_AUCTION_API_URL,
    }],
  );
}

export function getSyncApiUrlEnv(env?: RuntimeEnvInput): string {
  return firstConfigured(
    { name: 'SYNC_API_URL', value: env ? env.SYNC_API_URL : process.env.SYNC_API_URL },
    [{
      name: 'NEXT_PUBLIC_SYNC_API_URL',
      value: env ? env.NEXT_PUBLIC_SYNC_API_URL : process.env.NEXT_PUBLIC_SYNC_API_URL,
    }],
  );
}

export function getMarketplaceApiUrlEnv(env?: RuntimeEnvInput): string {
  return firstConfigured(
    {
      name: 'MARKETPLACE_API_URL',
      value: env ? env.MARKETPLACE_API_URL : process.env.MARKETPLACE_API_URL,
    },
    [{
      name: 'NEXT_PUBLIC_MARKETPLACE_API_URL',
      value: env
        ? env.NEXT_PUBLIC_MARKETPLACE_API_URL
        : process.env.NEXT_PUBLIC_MARKETPLACE_API_URL,
    }],
  );
}

export function getMeilisearchUrlEnv(env?: RuntimeEnvInput): string {
  return firstConfigured(
    {
      name: 'MEILISEARCH_URL',
      value: env
        ? env.MEILISEARCH_URL || env.MEILI_URL
        : process.env.MEILISEARCH_URL || process.env.MEILI_URL,
    },
    [
      {
        name: 'NEXT_PUBLIC_MEILISEARCH_URL',
        value: env ? env.NEXT_PUBLIC_MEILISEARCH_URL : process.env.NEXT_PUBLIC_MEILISEARCH_URL,
      },
      {
        name: 'NEXT_PUBLIC_MEILISEARCH_HOST',
        value: env ? env.NEXT_PUBLIC_MEILISEARCH_HOST : process.env.NEXT_PUBLIC_MEILISEARCH_HOST,
      },
    ],
  );
}

/**
 * The legacy value was already shipped to browsers and is accepted only as a
 * temporary search-only credential. It must never be replaced with a
 * master/admin key; deployments should migrate to a dedicated server-side key.
 */
export function getMeilisearchSearchApiKeyEnv(env?: RuntimeEnvInput): string {
  return firstConfigured(
    {
      name: 'MEILISEARCH_SEARCH_API_KEY',
      value: env
        ? env.MEILISEARCH_SEARCH_API_KEY
        : process.env.MEILISEARCH_SEARCH_API_KEY,
    },
    [
      {
        name: 'NEXT_PUBLIC_MEILISEARCH_API_KEY',
        value: env
          ? env.NEXT_PUBLIC_MEILISEARCH_API_KEY
          : process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY,
      },
    ],
  );
}

export function getMeilisearchIndexEnv(env?: RuntimeEnvInput): string {
  return firstConfiguredRaw(
    {
      name: 'MEILISEARCH_INDEX',
      value: env
        ? env.MEILISEARCH_INDEX || env.MEILISEARCH_INDEX_NAME || env.MEILI_INDEX
        : process.env.MEILISEARCH_INDEX ||
          process.env.MEILISEARCH_INDEX_NAME ||
          process.env.MEILI_INDEX,
    },
    [
      {
        name: 'NEXT_PUBLIC_MEILISEARCH_INDEX',
        value: env
          ? env.NEXT_PUBLIC_MEILISEARCH_INDEX
          : process.env.NEXT_PUBLIC_MEILISEARCH_INDEX,
      },
    ],
  );
}

export type AuthInternalIdentityEnv = Readonly<{
  caller: string;
  token: string;
}>;

/**
 * AUTH_INTERNAL_API_TOKEN is deliberately not aliased: the hardened Auth
 * backend requires a scoped caller/token pair in production and ignores the
 * legacy shared token. Treating it as equivalent would silently weaken scope.
 */
export function getAuthInternalIdentityEnv(env?: RuntimeEnvInput): AuthInternalIdentityEnv {
  const caller = (
    env ? env.AUTH_INTERNAL_CALLER : process.env.AUTH_INTERNAL_CALLER
  )?.trim() || '';
  const token = (
    env ? env.AUTH_INTERNAL_CALLER_TOKEN : process.env.AUTH_INTERNAL_CALLER_TOKEN
  )?.trim() || '';
  const legacyToken = env
    ? env.AUTH_INTERNAL_API_TOKEN
    : process.env.AUTH_INTERNAL_API_TOKEN;
  if ((!caller || !token) && legacyToken?.trim()) {
    warnOnce(
      'AUTH_INTERNAL_API_TOKEN cannot be used as AUTH_INTERNAL_CALLER_TOKEN; configure the scoped caller pair',
    );
  }
  return { caller, token };
}
