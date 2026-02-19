/**
 * Mock data per carte collezionabili (Magic, Pokémon, One Piece)
 * Usato per navigazione e Product Detail Page quando non ci sono API reali
 */

export interface MockCard {
  slug: string;
  name: string;
  nameLocalized?: {
    it?: string;
    en?: string;
    de?: string;
    es?: string;
    fr?: string;
  };
  game: 'mtg' | 'pk' | 'op';
  set: string;
  setCode: string;
  collectorNumber?: string;
  type: string;
  rarity?: string;
  imageUrl: string;
  imageSmall?: string;
  setIcon?: string;
  price?: number;
  description?: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
}

/**
 * Genera uno slug da un nome carta
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Mock cards per suggerimenti ricerca
 */
export const MOCK_CARDS: MockCard[] = [
  {
    slug: 'black-lotus-alpha',
    name: 'Black Lotus',
    nameLocalized: {
      it: 'Loto Nero',
      en: 'Black Lotus',
    },
    game: 'mtg',
    set: 'Alpha',
    setCode: 'LEA',
    collectorNumber: '1',
    type: 'Artifact',
    rarity: 'Rare',
    imageUrl: '/images/kyurem.png',
    imageSmall: '/images/kyurem.png',
    price: 15000.0,
    description: 'La carta più rara e costosa di Magic: The Gathering',
    breadcrumbs: [
      { label: 'MAGIC: THE GATHERING', href: '/products?game=mtg' },
      { label: 'SINGLES', href: '/products?game=mtg&category=singles' },
      { label: 'ALPHA', href: '/products?game=mtg&set=alpha' },
      { label: 'BLACK LOTUS', href: '#' },
    ],
  },
  {
    slug: 'mowgli-cucciolo-duomo',
    name: "Mowgli - Cucciolo d'Uomo",
    nameLocalized: {
      it: "Mowgli - Cucciolo d'Uomo",
      en: 'Mowgli - Man Cub',
    },
    game: 'mtg',
    set: 'Sussurri nel Pozzo',
    setCode: 'WHO',
    collectorNumber: '123',
    type: 'Creature',
    rarity: 'Uncommon',
    imageUrl: '/images/kyurem.png',
    imageSmall: '/images/kyurem.png',
    price: 18.0,
    description: 'Carta creature da Sussurri nel Pozzo',
    breadcrumbs: [
      { label: 'MAGIC: THE GATHERING', href: '/products?game=mtg' },
      { label: 'SINGLES', href: '/products?game=mtg&category=singles' },
      { label: 'SUSSURRI NEL POZZO', href: '/products?game=mtg&set=who' },
      { label: "MOWGLI - CUCCIOLO D'UOMO", href: '#' },
    ],
  },
  {
    slug: 'pikachu-base-set',
    name: 'Pikachu',
    nameLocalized: {
      it: 'Pikachu',
      en: 'Pikachu',
    },
    game: 'pk',
    set: 'Base Set',
    setCode: 'BS',
    collectorNumber: '58',
    type: 'Lightning',
    rarity: 'Common',
    imageUrl: '/images/kyurem.png',
    imageSmall: '/images/kyurem.png',
    price: 25.0,
    description: 'Il Pokémon più famoso del mondo',
    breadcrumbs: [
      { label: 'POKÉMON', href: '/products?game=pk' },
      { label: 'SINGLES', href: '/products?game=pk&category=singles' },
      { label: 'BASE SET', href: '/products?game=pk&set=base' },
      { label: 'PIKACHU', href: '#' },
    ],
  },
  {
    slug: 'blue-eyes-white-dragon',
    name: 'Blue-Eyes White Dragon',
    nameLocalized: {
      it: 'Drago Bianco Occhi Blu',
      en: 'Blue-Eyes White Dragon',
    },
    game: 'op',
    set: 'Legends of Blue-Eyes White Dragon',
    setCode: 'LOB',
    collectorNumber: '001',
    type: 'Dragon',
    rarity: 'Ultra Rare',
    imageUrl: '/images/kyurem.png',
    imageSmall: '/images/kyurem.png',
    price: 500.0,
    description: 'La carta più iconica di Yu-Gi-Oh!',
    breadcrumbs: [
      { label: 'YU-GI-OH!', href: '/products?game=op' },
      { label: 'SINGLES', href: '/products?game=op&category=singles' },
      { label: 'LEGENDS OF BLUE-EYES', href: '/products?game=op&set=lob' },
      { label: 'BLUE-EYES WHITE DRAGON', href: '#' },
    ],
  },
  {
    slug: 'lightning-bolt-alpha',
    name: 'Lightning Bolt',
    nameLocalized: {
      it: 'Fulmine',
      en: 'Lightning Bolt',
    },
    game: 'mtg',
    set: 'Alpha',
    setCode: 'LEA',
    collectorNumber: '161',
    type: 'Instant',
    rarity: 'Common',
    imageUrl: '/images/kyurem.png',
    imageSmall: '/images/kyurem.png',
    price: 1200.0,
    description: 'Uno degli incantesimi più iconici di Magic',
    breadcrumbs: [
      { label: 'MAGIC: THE GATHERING', href: '/products?game=mtg' },
      { label: 'SINGLES', href: '/products?game=mtg&category=singles' },
      { label: 'ALPHA', href: '/products?game=mtg&set=alpha' },
      { label: 'LIGHTNING BOLT', href: '#' },
    ],
  },
  {
    slug: 'charizard-base-set',
    name: 'Charizard',
    nameLocalized: {
      it: 'Charizard',
      en: 'Charizard',
    },
    game: 'pk',
    set: 'Base Set',
    setCode: 'BS',
    collectorNumber: '4',
    type: 'Fire',
    rarity: 'Rare Holo',
    imageUrl: '/images/kyurem.png',
    imageSmall: '/images/kyurem.png',
    price: 300.0,
    description: 'Il Pokémon drago più desiderato',
    breadcrumbs: [
      { label: 'POKÉMON', href: '/products?game=pk' },
      { label: 'SINGLES', href: '/products?game=pk&category=singles' },
      { label: 'BASE SET', href: '/products?game=pk&set=base' },
      { label: 'CHARIZARD', href: '#' },
    ],
  },
  {
    slug: 'dark-magician',
    name: 'Dark Magician',
    nameLocalized: {
      it: 'Mago Oscuro',
      en: 'Dark Magician',
    },
    game: 'op',
    set: 'Legends of Blue-Eyes White Dragon',
    setCode: 'LOB',
    collectorNumber: '005',
    type: 'Spellcaster',
    rarity: 'Ultra Rare',
    imageUrl: '/images/kyurem.png',
    imageSmall: '/images/kyurem.png',
    price: 150.0,
    description: 'Il mago più potente di Yu-Gi-Oh!',
    breadcrumbs: [
      { label: 'YU-GI-OH!', href: '/products?game=op' },
      { label: 'SINGLES', href: '/products?game=op&category=singles' },
      { label: 'LEGENDS OF BLUE-EYES', href: '/products?game=op&set=lob' },
      { label: 'DARK MAGICIAN', href: '#' },
    ],
  },
];

/**
 * Cerca una carta per slug
 */
export function getCardBySlug(slug: string): MockCard | undefined {
  return MOCK_CARDS.find((card) => card.slug === slug);
}

/**
 * Cerca carte per query (nome, set, tipo)
 */
export function searchCards(query: string, game?: 'mtg' | 'pk' | 'op'): MockCard[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return [];

  let results = MOCK_CARDS;

  // Filtra per gioco se specificato
  if (game) {
    results = results.filter((card) => card.game === game);
  }

  // Cerca nel nome, set, tipo
  return results.filter((card) => {
    const searchableText = [
      card.name,
      card.nameLocalized?.it,
      card.nameLocalized?.en,
      card.set,
      card.setCode,
      card.type,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchableText.includes(lowerQuery);
  });
}

/**
 * Converte MockCard in CardSearchHit per compatibilità con GlobalSearchBar
 */
export function mockCardToSearchHit(card: MockCard): any {
  return {
    objectID: `${card.game}_${card.slug}`,
    id: `${card.game}_${card.slug}`,
    card_print_id: `${card.game}_${card.slug}`,
    game_slug: card.game,
    name: card.name,
    set_name: card.set,
    set_code: card.setCode,
    collector_number: card.collectorNumber,
    image_uri_small: card.imageSmall || card.imageUrl,
    image_uri_normal: card.imageUrl,
    set_icon_uri: card.setIcon,
    type: card.type,
    keywords_localized: card.nameLocalized,
  };
}
