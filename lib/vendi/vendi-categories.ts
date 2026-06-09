import type { MessageKey } from '@/lib/i18n/messages/en';
import { getVendiCatalogHref } from '@/lib/sell-flow/sell-flow';
import { getVendiCardStyle } from './vendi-card-styles';
import type { VendiCardStyle } from './vendi-card-styles';

export type VendiCategoryId = 'singole' | 'oggetti';

export type VendiCategoryConfig = {
  id: VendiCategoryId;
  href: string;
  imageSrc: string;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  style?: VendiCardStyle;
  fullCard?: boolean;
};

export const VENDI_CATEGORIES: VendiCategoryConfig[] = [
  {
    id: 'singole',
    href: getVendiCatalogHref('/products/singles'),
    imageSrc: '/vendi/singole2.svg',
    titleKey: 'vendi.category.singles',
    descriptionKey: 'vendi.category.singlesDesc',
    style: getVendiCardStyle('singole'),
  },
  {
    id: 'oggetti',
    href: getVendiCatalogHref('/vendi/oggetti'),
    imageSrc: '/vendi/oggetti2.webp',
    titleKey: 'vendi.category.products',
    descriptionKey: 'vendi.category.productsDesc',
    style: getVendiCardStyle('oggetti'),
    fullCard: true,
  },

];

export function getVendiCategoryById(id: string): VendiCategoryConfig | undefined {
  return VENDI_CATEGORIES.find((c) => c.id === id);
}
