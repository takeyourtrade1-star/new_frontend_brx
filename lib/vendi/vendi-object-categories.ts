import type { MessageKey } from '@/lib/i18n/messages/en';
import { getVendiCatalogHref } from '@/lib/sell-flow/sell-flow';

export type VendiObjectCategoryConfig = {
  id: string;
  href: string;
  imageSrc: string;
  titleKey: MessageKey;
};

/** Secondo step «Oggetti»: sottocategorie che portano alle pagine catalogo dedicate. */
export const VENDI_OBJECT_CATEGORIES: VendiObjectCategoryConfig[] = [
  {
    id: 'boosters',
    href: getVendiCatalogHref('/products/boosters'),
    imageSrc: '/vendi/oggetti-boosters.svg',
    titleKey: 'products.boosters',
  },
  {
    id: 'booster-boxes',
    href: getVendiCatalogHref('/products/booster-boxes'),
    imageSrc: '/vendi/oggetti-booster-boxes.svg',
    titleKey: 'products.boosterBoxes',
  },
  {
    id: 'set-lotti-collezioni',
    href: getVendiCatalogHref('/products/set-lotti-collezioni'),
    imageSrc: '/vendi/oggetti-set-lotti.svg',
    titleKey: 'products.setLots',
  },
  {
    id: 'sigillati',
    href: getVendiCatalogHref('/products/sigillati'),
    imageSrc: '/vendi/oggetti-sigillati.svg',
    titleKey: 'products.sealed',
  },
  {
    id: 'accessori',
    href: getVendiCatalogHref('/products/accessori'),
    imageSrc: '/vendi/oggetti-accessori.svg',
    titleKey: 'products.accessories',
  },
];
