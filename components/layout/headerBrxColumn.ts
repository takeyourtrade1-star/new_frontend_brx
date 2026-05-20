/**
 * Stack logo + menu Prodotti: stessa larghezza layout (w-11), asse centrale condiviso.
 * Il logo sborda a destra senza allargare la colonna.
 */
export const HEADER_BRX_LOGO_COLUMN_CLASS =
  'relative flex h-[3.25rem] w-11 shrink-0 items-center justify-center overflow-visible md:h-[3.375rem]';

export const HEADER_BRX_MENU_COLUMN_CLASS =
  'relative flex h-11 w-11 shrink-0 items-center justify-center overflow-visible';

export const HEADER_BRX_LOGO_LINK_CLASS =
  'absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg transition-opacity hover:opacity-90';

/** Logo corto BRX — leggermente sotto h-14 per allineamento col pulsante */
export const HEADER_BRX_LOGO_IMAGE_CLASS =
  'h-[3.25rem] w-auto min-w-[3rem] max-h-[3.25rem] object-contain md:h-[3.375rem] md:max-h-[3.375rem] md:min-w-[3.25rem]';

/** Stesso inset sinistro del testo «Carte singole» (gap-2 + px-3 del ProductCategoryButton) */
export const HEADER_GAME_ROW_GAP_CLASS = 'gap-2';

export const HEADER_GAME_TEXT_INSET_CLASS = 'md:pl-3';
