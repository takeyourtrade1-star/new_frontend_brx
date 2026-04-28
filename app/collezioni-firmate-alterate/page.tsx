import type { Metadata } from 'next';
import { SignedAlteredCollectionPage } from './signed-altered-client';

export const metadata: Metadata = {
  title: 'Collezioni Firmate e Alterate | Ebartex',
  description:
    'Scopri le carte firmate dagli artisti e le alterazioni artistiche uniche. Le pi preziose collezioni di Magic: The Gathering, Pokmon e altri giochi di carte.',
  keywords: ['carte firmate', 'signed cards', 'altered cards', 'carte alterate', ' Magic artist', 'collectible cards'],
};

export default function CollezioniFirmateAlteratePage() {
  return <SignedAlteredCollectionPage />;
}
