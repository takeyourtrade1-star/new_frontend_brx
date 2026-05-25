import type { MessageKey } from '@/lib/i18n/messages/en';

export type VendiCategoryId = 'singole' | 'oggetti' | 'set-edizioni';

export type VendiCategoryConfig = {
  id: VendiCategoryId;
  href: string;
  imageSrc: string;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
};

export const VENDI_CATEGORIES: VendiCategoryConfig[] = [
  {
    id: 'singole',
    href: '/products/singles',
    imageSrc: '/vendi/singole.svg',
    titleKey: 'vendi.category.singles',
    descriptionKey: 'vendi.category.singlesDesc',
  },
  {
    id: 'oggetti',
    href: '/vendi/oggetti',
    imageSrc: '/vendi/oggetti.svg',
    titleKey: 'vendi.category.products',
    descriptionKey: 'vendi.category.productsDesc',
  },
  {
    id: 'set-edizioni',
    href: '/products/set-lotti-collezioni',
    imageSrc: '/vendi/set-edizioni.svg',
    titleKey: 'vendi.category.sets',
    descriptionKey: 'vendi.category.setsDesc',
  },
];

export function getVendiCategoryById(id: string): VendiCategoryConfig | undefined {
  return VENDI_CATEGORIES.find((c) => c.id === id);
}
