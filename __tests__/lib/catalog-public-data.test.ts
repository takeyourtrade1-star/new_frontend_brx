import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildCatalogIdFilter,
  normalizeCatalogProductId,
  safePublicImageUrl,
  sanitizeCatalogImageFields,
} from '@/lib/security/catalog-public-data';

describe('catalogue public-data boundary', () => {
  const originalCdn = process.env.NEXT_PUBLIC_CDN_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_CDN_URL = 'https://cdn.ebartex.com';
  });

  afterEach(() => {
    if (originalCdn === undefined) delete process.env.NEXT_PUBLIC_CDN_URL;
    else process.env.NEXT_PUBLIC_CDN_URL = originalCdn;
  });

  it('accepts only canonical index ids and builds a non-injectable filter', () => {
    expect(normalizeCatalogProductId('mtg_123')).toBe('mtg_123');
    expect(normalizeCatalogProductId('sealed_10')).toBe('sealed_10');
    expect(buildCatalogIdFilter('pk_9')).toBe('id = "pk_9"');
    expect(buildCatalogIdFilter('mtg_1" OR id EXISTS')).toBeNull();
    expect(buildCatalogIdFilter('mtg_1\\"')).toBeNull();
    expect(buildCatalogIdFilter('mtg_0')).toBeNull();
  });

  it('allows only exact HTTPS image origins and safe CDN-relative paths', () => {
    expect(safePublicImageUrl('/img/cards/4/card.webp')).toBe(
      'https://cdn.ebartex.com/cards/4/card.webp',
    );
    expect(safePublicImageUrl('https://cards.scryfall.io/normal/card.jpg')).toBe(
      'https://cards.scryfall.io/normal/card.jpg',
    );
    expect(safePublicImageUrl('https://svgs.scryfall.io/sets/mom.svg', 'set-icon')).toBe(
      'https://svgs.scryfall.io/sets/mom.svg',
    );
    expect(safePublicImageUrl('https://tracker.example/card.jpg')).toBeNull();
    expect(safePublicImageUrl('https://cards.scryfall.io.attacker.test/card.jpg')).toBeNull();
    expect(safePublicImageUrl('http://cdn.ebartex.com/card.jpg')).toBeNull();
    expect(safePublicImageUrl('../api/auth/refresh')).toBeNull();
    expect(safePublicImageUrl('data:image/svg+xml,<svg/>')).toBeNull();
  });

  it('redacts unsafe Meilisearch image fields before returning hits', () => {
    expect(
      sanitizeCatalogImageFields({
        id: 'mtg_1',
        image: 'https://tracker.example/pixel',
        set_icon_uri: 'https://svgs.scryfall.io/sets/mom.svg',
      }),
    ).toEqual({
      id: 'mtg_1',
      image: null,
      set_icon_uri: 'https://svgs.scryfall.io/sets/mom.svg',
    });
  });
});
