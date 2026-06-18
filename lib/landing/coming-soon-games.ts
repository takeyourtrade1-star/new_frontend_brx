import { getCdnImageUrl } from '@/lib/config';

export interface ComingSoonGame {
  src: string;
  alt: string;
  label: string;
}

/** Giochi in arrivo mostrati in landing e showcase auth. */
export const COMING_SOON_GAMES: ComingSoonGame[] = [
  {
    src: getCdnImageUrl('loghi-giochi/pokèmon.png'),
    alt: 'Pokémon Trading Card Game',
    label: 'Pokémon',
  },
  {
    src: getCdnImageUrl('loghi-giochi/yu-gi-oh.png'),
    alt: 'Yu-Gi-Oh! Trading Card Game',
    label: 'Yu-Gi-Oh!',
  },
  {
    src: getCdnImageUrl('loghi-giochi/One_Piece_Card_Game_Logo%201.png'),
    alt: 'One Piece Card Game',
    label: 'One Piece',
  },
  {
    src: getCdnImageUrl('loghi-giochi/Disney_Lorcana_480x480%201.png'),
    alt: 'Disney Lorcana',
    label: 'Lorcana',
  },
  {
    src: getCdnImageUrl('star_wars.jpg'),
    alt: 'Star Wars: Unlimited',
    label: 'Star Wars',
  },
];
