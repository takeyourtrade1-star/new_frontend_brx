import 'server-only';

import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { getMeilisearchServerConfig } from '@/lib/meilisearch-server-env';
import type { CardDocument, ProductDetailData } from '@/lib/product-detail';
import {
  buildCatalogIdFilter,
  normalizeCatalogProductId,
  safePublicImageUrl,
} from '@/lib/security/catalog-public-data';

const MAX_CATALOG_RESPONSE_BYTES = 2 * 1_024 * 1_024;

/** Fetch a card through the search-only credential; never import from a Client Component. */
export async function getCardDocumentById(id: string): Promise<CardDocument | null> {
  const rawId = normalizeCatalogProductId(id);
  const filter = buildCatalogIdFilter(id);
  const { url, apiKey, index } = getMeilisearchServerConfig();
  if (!rawId || !filter || !url || !apiKey) return null;

  try {
    const response = await fetch(`${url}/indexes/${index}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'identity',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        filter,
        limit: 1,
      }),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return null;
    const payload = (await readJsonResponseWithLimit(
      response,
      MAX_CATALOG_RESPONSE_BYTES,
    )) as { hits?: CardDocument[] };
    const hit = payload.hits?.[0] ?? null;
    return hit?.id === rawId ? hit : null;
  } catch {
    return null;
  }
}

export async function getProductById(id: string): Promise<ProductDetailData | null> {
  const doc = await getCardDocumentById(id);
  if (!doc) return null;
  return {
    id: doc.id,
    name: doc.name ?? '',
    set_name: doc.set_name ?? '',
    game_slug: doc.game_slug ?? 'mtg',
    category_name: doc.category_name,
    imageUrl: safePublicImageUrl(doc.image ?? null, 'card'),
    keywords_localized: doc.keywords_localized,
    collector_number: doc.collector_number,
    rarity: doc.rarity,
    available_languages: doc.available_languages,
  };
}
