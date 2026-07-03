export type MockInventoryPrinting = 'standard' | 'foil' | 'signed' | 'altered' | 'graded';

export interface MockInventoryItem {
  id: string;
  name: string;
  image: string;
  condition: string;
  game: string;
  language: string;
  printing: MockInventoryPrinting;
}

export const MOCK_INVENTORY_A: MockInventoryItem[] = [
  { id: 'inv-a-1', name: 'Mox Pearl Beta', image: 'https://picsum.photos/seed/moxpearl/200/280', condition: 'SP', game: 'mtg', language: 'en', printing: 'altered' },
  { id: 'inv-a-2', name: 'Black Lotus Unlimited', image: 'https://picsum.photos/seed/blotus/200/280', condition: 'HP', game: 'mtg', language: 'en', printing: 'foil' },
  { id: 'inv-a-3', name: 'Charizard Base Set', image: 'https://picsum.photos/seed/charbase/200/280', condition: 'MP', game: 'pokemon', language: 'en', printing: 'standard' },
  { id: 'inv-a-4', name: 'Shanks OP-05', image: 'https://picsum.photos/seed/shanks/200/280', condition: 'NM', game: 'op', language: 'jp', printing: 'foil' },
  { id: 'inv-a-5', name: 'Blue-Eyes LOB', image: 'https://picsum.photos/seed/be/200/280', condition: 'LP', game: 'ygo', language: 'it', printing: 'standard' },
  { id: 'inv-a-6', name: 'Elsa Enchanted', image: 'https://picsum.photos/seed/elsa/200/280', condition: 'Mint', game: 'lorcana', language: 'en', printing: 'signed' },
  { id: 'inv-a-7', name: 'Time Walk Beta', image: 'https://picsum.photos/seed/timewalk/200/280', condition: 'SP', game: 'mtg', language: 'en', printing: 'standard' },
  { id: 'inv-a-8', name: 'Pikachu Illustrator', image: 'https://picsum.photos/seed/pikailluA/200/280', condition: 'NM', game: 'pokemon', language: 'jp', printing: 'signed' },
  { id: 'inv-a-9', name: 'Monkey D. Luffy OP-01', image: 'https://picsum.photos/seed/luffy01/200/280', condition: 'NM', game: 'op', language: 'jp', printing: 'standard' },
  { id: 'inv-a-10', name: 'Exodia the Forbidden One', image: 'https://picsum.photos/seed/exodia/200/280', condition: 'MP', game: 'ygo', language: 'it', printing: 'foil' },
  { id: 'inv-a-11', name: 'Maui Demigod', image: 'https://picsum.photos/seed/maui/200/280', condition: 'NM', game: 'lorcana', language: 'en', printing: 'altered' },
  { id: 'inv-a-12', name: 'Ancestral Recall Beta', image: 'https://picsum.photos/seed/ancestral/200/280', condition: 'HP', game: 'mtg', language: 'de', printing: 'graded' },
];

export const MOCK_INVENTORY_B: MockInventoryItem[] = [
  { id: 'inv-b-1', name: 'Mox Jet Beta', image: 'https://picsum.photos/seed/moxjet/200/280', condition: 'LP', game: 'mtg', language: 'en', printing: 'foil' },
  { id: 'inv-b-2', name: 'Tropical Island', image: 'https://picsum.photos/seed/tropical/200/280', condition: 'NM', game: 'mtg', language: 'en', printing: 'standard' },
  { id: 'inv-b-3', name: 'Venusaur 1st Ed', image: 'https://picsum.photos/seed/venusaur/200/280', condition: 'HP', game: 'pokemon', language: 'it', printing: 'altered' },
  { id: 'inv-b-4', name: 'Luffy Gear 5', image: 'https://picsum.photos/seed/luffy5/200/280', condition: 'Mint', game: 'op', language: 'jp', printing: 'signed' },
  { id: 'inv-b-5', name: 'Dark Magician', image: 'https://picsum.photos/seed/dm/200/280', condition: 'NM', game: 'ygo', language: 'it', printing: 'foil' },
  { id: 'inv-b-6', name: 'Mickey Brave', image: 'https://picsum.photos/seed/mickeyb/200/280', condition: 'LP', game: 'lorcana', language: 'en', printing: 'standard' },
  { id: 'inv-b-7', name: 'Underground Sea', image: 'https://picsum.photos/seed/usea/200/280', condition: 'SP', game: 'mtg', language: 'en', printing: 'altered' },
  { id: 'inv-b-8', name: 'Umbreon Gold Star', image: 'https://picsum.photos/seed/umbreon/200/280', condition: 'NM', game: 'pokemon', language: 'de', printing: 'foil' },
  { id: 'inv-b-9', name: 'Roronoa Zoro OP-01', image: 'https://picsum.photos/seed/zoro01/200/280', condition: 'NM', game: 'op', language: 'jp', printing: 'standard' },
  { id: 'inv-b-10', name: 'Blue-Eyes White Dragon SDK', image: 'https://picsum.photos/seed/bewdsdk/200/280', condition: 'LP', game: 'ygo', language: 'it', printing: 'signed' },
  { id: 'inv-b-11', name: 'Stitch Rock Star', image: 'https://picsum.photos/seed/stitch/200/280', condition: 'Mint', game: 'lorcana', language: 'en', printing: 'foil' },
  { id: 'inv-b-12', name: 'Volcanic Island', image: 'https://picsum.photos/seed/volcanic/200/280', condition: 'MP', game: 'mtg', language: 'fr', printing: 'graded' },
];

export function findMockInventoryItem(id: string): MockInventoryItem | undefined {
  return MOCK_INVENTORY_A.find((c) => c.id === id) ?? MOCK_INVENTORY_B.find((c) => c.id === id);
}
