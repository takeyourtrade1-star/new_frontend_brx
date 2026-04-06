import { GameHomeLayout } from '@/components/feature/GameHomeLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Magic: The Gathering | Marketplace MTG',
  description:
    'Compra, vendi e scambia carte Magic: The Gathering. Commander, Modern, Standard, booster e carte singole.',
};

/** Home dedicata a Magic: The Gathering — stessa struttura delle altre home, hero con logo Magic. */
export default function HomeMagicPage() {
  return <GameHomeLayout gameSlug="mtg" />;
}
