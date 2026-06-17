import type { MessageKey } from '@/lib/i18n/messages/en';
import { getVendiCatalogHref } from '@/lib/sell-flow/sell-flow';
import { getVendiCardStyle } from './vendi-card-styles';
import type { VendiCardStyle } from './vendi-card-styles';

export type VendiObjectCategoryConfig = {
  id: string;
  href: string;
  imageSrc: string;
  titleKey: MessageKey;
  style?: VendiCardStyle;
  fullCard?: boolean;
};

/** Secondo step «Oggetti»: sottocategorie che portano alle pagine catalogo dedicate. */
export const VENDI_OBJECT_CATEGORIES: VendiObjectCategoryConfig[] = [
  {
    id: 'boosters',
    href: getVendiCatalogHref('/products/boosters'),
    imageSrc: '/vendi/oggetti-boosters2.svg',
    titleKey: 'products.boosters',
    style: getVendiCardStyle('boosters'),
  },
  {
    id: 'booster-boxes',
    href: getVendiCatalogHref('/products/booster-boxes'),
    imageSrc: '/vendi/oggetti-booster-boxes2.svg',
    titleKey: 'products.boosterBoxes',
    style: getVendiCardStyle('booster-boxes'),
  },
  {
    id: 'set-lotti-collezioni',
    href: getVendiCatalogHref('/products/set-lotti-collezioni'),
    imageSrc: '/vendi/oggetti-set-lotti2.svg',
    titleKey: 'products.setLots',
    style: getVendiCardStyle('set-lotti-collezioni'),
  },
  {
    id: 'sigillati',
    href: getVendiCatalogHref('/products/sigillati'),
    imageSrc: '/vendi/oggetti-sigillati2.svg',
    titleKey: 'products.sealed',
    style: getVendiCardStyle('sigillati'),
  },
];
