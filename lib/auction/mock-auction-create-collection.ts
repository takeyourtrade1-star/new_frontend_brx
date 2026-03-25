/**
 * Carte finte per "La mia collezione" nel flusso creazione asta (demo).
 */

export type MockAuctionCreateCollectionItem = {
  id: string;
  title: string;
  image: string;
  set_name: string;
};

export const MOCK_CREATE_COLLECTION_ITEMS: MockAuctionCreateCollectionItem[] = [
  {
    id: 'mock-coll-1',
    title: 'Lightning Bolt',
    image: 'cards/mtg/alpha/lightning-bolt.webp',
    set_name: 'Limited Edition Alpha',
  },
  {
    id: 'mock-coll-2',
    title: 'Charizard',
    image: 'cards/pokemon/base/charizard.webp',
    set_name: 'Base Set',
  },
  {
    id: 'mock-coll-3',
    title: 'Black Lotus',
    image: 'cards/mtg/alpha/black-lotus.webp',
    set_name: 'Limited Edition Alpha',
  },
  {
    id: 'mock-coll-4',
    title: 'Luffy ST01-001',
    image: 'cards/op/st01/luffy.webp',
    set_name: 'Starter Deck',
  },
  {
    id: 'mock-coll-5',
    title: 'Elsa — Spirit of Winter',
    image: 'cards/lorcana/elsa.webp',
    set_name: 'The First Chapter',
  },
  {
    id: 'mock-coll-6',
    title: 'Blue-Eyes White Dragon',
    image: 'cards/ygo/lob/blue-eyes.webp',
    set_name: 'Legend of Blue Eyes',
  },
  {
    id: 'mock-coll-7',
    title: 'Snapcaster Mage',
    image: 'cards/mtg/inn/snapcaster.webp',
    set_name: 'Innistrad',
  },
];
