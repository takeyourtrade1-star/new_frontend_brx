/**
 * Categorie di ricerca per la SearchBar
 * File separato per essere importabile sia da Server Components che Client Components
 */

export interface SearchCategory {
  value: string;
  label: string;
}

export const SEARCH_CATEGORIES: SearchCategory[] = [
  { value: '', label: 'Categorie' },
  { value: 'carte-singole', label: 'Carte singole' },
  { value: 'mazzi', label: 'Mazzi' },
  { value: 'accessori', label: 'Accessori' },
  { value: 'boosters', label: 'Boosters' },
];
