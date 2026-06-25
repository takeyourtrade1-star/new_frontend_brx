import type { LucideIcon } from 'lucide-react';
import type { AuctionGavelIcon } from '@/components/ui/AuctionGavelIcon';
import type { CardDocument } from '@/lib/product-detail';

export const PRIMARY_BLUE = '#1D3160';
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export const ACCENT_ORANGE = '#f97316';

export type ProductDetailViewProps =
  | {
      card: CardDocument;
      slug?: string;
      title?: string;
      subtitle?: string;
      breadcrumbs?: { label: string; href?: string }[];
      imageSrc?: string;
    }
  | {
      card?: never;
      slug: string;
      title?: string;
      subtitle?: string;
      breadcrumbs?: { label: string; href?: string }[];
      imageSrc?: string;
    };

export type ReprintCard = {
  id: string;
  imageSrc: string | null;
  setName: string;
  rarity: string;
  setIconSrc: string | null;
  setCode: string;
  gameSlug?: string;
};

/** Numero massimo di ristampe mostrate nel dettaglio carta: oltre, si usa "Vedi tutte". */
export const MAX_VISIBLE_REPRINTS = 6;

/** 2 colonne × 3 righe = 6 ristampe visibili; celle h-20 fisse (non si schiacciano). */
export const REPRINT_TILE_CLASS = 'h-20 min-h-20 shrink-0';
export const REPRINT_GRID_SCROLL_CLASS =
  'max-h-[calc(5rem*3+0.5rem*2)] min-h-[calc(5rem*3+0.5rem*2)]';
export const REPRINT_LIST_SCROLL_CLASS =
  'max-h-[calc(3.5rem*6+0.25rem*5)] min-h-[calc(3.5rem*6+0.25rem*5)]';

export type ProductDetailTabId = 'INFO' | 'VENDI' | 'ASTA' | 'GRAFICO';

export type ProductDetailTabConfig = {
  id: ProductDetailTabId;
  label: string;
  mobileLabel: string;
  icon: LucideIcon | typeof AuctionGavelIcon;
};

export const EBARTEX_LOGO_PLACEHOLDER = '/images/Logo%20Principale%20EBARTEX.png';
