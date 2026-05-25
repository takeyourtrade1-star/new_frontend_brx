import type { MessageKey } from '@/lib/i18n/messages/en';

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
    href: '/products/boosters',
    imageSrc: '/vendi/oggetti-boosters.svg',
    titleKey: 'products.boosters',
  },
  {
    id: 'booster-boxes',
    href: '/products/booster-boxes',
    imageSrc: '/vendi/oggetti-booster-boxes.svg',
    titleKey: 'products.boosterBoxes',
  },
  {
    id: 'set-lotti-collezioni',
    href: '/products/set-lotti-collezioni',
    imageSrc: '/vendi/oggetti-set-lotti.svg',
    titleKey: 'products.setLots',
  },
  {
    id: 'sigillati',
    href: '/products/sigillati',
    imageSrc: '/vendi/oggetti-sigillati.svg',
    titleKey: 'products.sealed',
  },
  {
    id: 'accessori',
    href: '/products/accessori',
    imageSrc: '/vendi/oggetti-accessori.svg',
    titleKey: 'products.accessories',
  },
];
