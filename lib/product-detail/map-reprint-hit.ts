import { getCardImageUrl, getSetIconUrl } from '@/lib/assets';
import type { ReprintSearchHit } from '@/lib/reprints-search';
import type { ReprintCard } from '@/lib/product-detail/product-detail-view-types';

export function mapReprintHit(hit: ReprintSearchHit, cardGameSlug?: string): ReprintCard | null {
  if (!hit.id) return null;
  const rawImage = hit.image ?? hit.image_uri_normal ?? hit.image_uri_small ?? hit.image_path ?? null;
  const setName = hit.set_name ?? 'Set sconosciuto';
  const setCode =
    hit.set_code ??
    setName
      .split(' ')
      .filter(Boolean)
      .map((token) => token[0])
      .join('')
      .slice(0, 3)
      .toUpperCase();
  return {
    id: hit.id,
    imageSrc: getCardImageUrl(rawImage),
    setName,
    rarity: hit.rarity ?? 'N/D',
    setIconSrc: getSetIconUrl(hit.set_icon_uri ?? hit.icon_svg_uri, {
      gameSlug: hit.game_slug ?? cardGameSlug,
      setCode: hit.set_code ?? undefined,
    }),
    setCode,
    gameSlug: hit.game_slug ?? cardGameSlug,
  };
}
