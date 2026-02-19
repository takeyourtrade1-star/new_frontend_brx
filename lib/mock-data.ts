/**
 * Mock data for TCG e-commerce homepage (Italian UI).
 */

export const MOCK_RANKING_PRODUCTS = [
  { id: '1', src: '/carousel/slide1.jpg', label: 'Carta Pikachu', price: '3$', rank: 1 },
  { id: '2', src: '/carousel/slide2.jpg', label: 'Carta Pikachu', price: '3$', rank: 2 },
  { id: '3', src: '/carousel/slide3.jpg', label: 'Carta Pikachu', price: '3$', rank: 3 },
] as const;

export const MOCK_LIST_ITEM = { label: 'Il gattopardo magico', price: '3$' } as const;
export const MOCK_RANKS_4_6 = Array(3).fill(MOCK_LIST_ITEM);

export const MOCK_COMING_SOON_ITEMS = Array(12)
  .fill(null)
  .map((_, i) => ({ id: String(i + 4), label: 'Il gattopardo magico', price: '3$', rank: i + 4 }));

export const MOCK_CATEGORIES = [
  { id: 'singles', label: 'SINGLES' },
  { id: 'boosters', label: 'BOOSTERS' },
  { id: 'booster-box', label: 'BOOSTER BOX' },
  { id: 'set-lotti', label: 'SET/LOTTI/COLLEZIONI' },
  { id: 'accessori', label: 'ACCESSORI' },
  { id: 'sigillati', label: 'PRODOTTI SIGILLATI' },
] as const;

export const MOCK_PRODUCT_SHOWCASE = [
  { id: 'dadi', label: 'DADI MAGICI' },
  { id: 'buste', label: 'BUSTE' },
  { id: 'album', label: 'ALBUM' },
  { id: 'tappetini', label: 'TAPPETINI' },
  { id: 'game-kits', label: 'GAME KITS' },
] as const;

export const THEME = {
  bgSlate: '#1e293b',
  accentOrange: '#f97316',
  purple: { from: '#4C1D95', to: '#312E81', header: '#1E1B4B' },
  orange: { from: '#EA580C', to: '#C2410C', header: '#D97706' },
  teal: { from: '#0D9488', to: '#0F766E', header: '#0D9488' },
} as const;
