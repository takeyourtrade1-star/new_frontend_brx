import { GameHomeLayout } from '@/components/feature/GameHomeLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'One Piece Card Game | Marketplace OP',
  description:
    'Compra e vendi carte One Piece Card Game. Booster box, starter deck e carte singole.',
};

/** Home dedicata a One Piece — stessa struttura delle altre home, hero con logo One Piece. */
export default function HomeOnePiecePage() {
  return <GameHomeLayout gameSlug="op" />;
}
