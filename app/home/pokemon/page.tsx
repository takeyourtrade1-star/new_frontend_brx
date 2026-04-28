import { GameHomeLayout } from '@/components/feature/GameHomeLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pokémon TCG | Marketplace Carte Collezionabili',
  description:
    'Compra e vendi carte Pokémon TCG. Booster box, bustine, carte singole e aste dedicate.',
};

/** Home dedicata a Pokémon — stessa struttura delle altre home, hero con logo Pokémon. */
export default function HomePokemonPage() {
  return <GameHomeLayout gameSlug="pokemon" />;
}
