export type HighlightValue = { value: string; matchLevel: string };
export type HighlightResult = Record<string, HighlightValue | HighlightValue[]>;

export interface CardSearchHit {
  objectID?: string;
  id?: string;
  card_print_id?: string;
  game_slug?: string;
  name: string;
  set_name?: string;
  set_code?: string;
  collector_number?: string;
  /** Path dall'indice Meilisearch (es. cards/4/158647.webp o img/cards/4/158647.webp; il prefisso img/ viene rimosso) */
  image?: string | null;
  image_path?: string | null;
  image_uri_small?: string | null;
  image_uri_normal?: string | null;
  icon_svg_uri?: string | null;
  set_icon_uri?: string | null;
  type?: string;
  keywords_localized?: string | string[] | Record<string, string>;
  _highlightResult?: HighlightResult;
  _snippetResult?: HighlightResult;
  __position?: number;
}

export interface SetResult {
  set_name: string;
  set_code: string | null;
  set_icon_uri: string | null;
  game_slug: string;
  release_date: string | null;
}

export type SupportedLang = 'en' | 'de' | 'es' | 'fr' | 'it' | 'pt';

export type CategoryDropdownRect = { top: number; left: number; width: number };

export type FixedPanelRect = { top: number; left: number; width: number; height?: number };
