import { useEffect, useMemo, useReducer } from 'react';
import { type ConditionCode } from '@/components/ui/ConditionBadge';
import {
  type MarketplaceFilterState,
  type MarketplaceSort,
  type SellerTypeFilter,
} from '@/lib/product-detail/marketplace-rows';

/**
 * Piano 1.3 — seam "filtri marketplace" estratto da ProductDetailView.
 * Tutto lo stato dei filtri vive qui in un singolo `useReducer` (al posto di
 * ~11 `useState` sparsi), più la memo `marketplaceFilters` derivata, l'effetto
 * di chiusura automatica del pannello e l'inizializzazione una-tantum del paese.
 * I setter esposti hanno la stessa firma value-only usata da
 * ProductDetailMarketplaceSection, quindi il cablaggio del componente è invariato.
 */

export type TriState = 'SÌ' | 'NO' | 'ENTRAMBI';
export type SellerSubTab = 'VENDITORI' | 'ASTE' | 'TCG_EXPRESS';

export interface ProductFiltersState {
  hideAuctions: boolean;
  condizioneMinima: ConditionCode | null;
  linguaCarta: string | null;
  soloFoil: boolean;
  firmata: TriState;
  alterata: TriState;
  quantita: number;
  posizioneVenditore: string;
  tipoVenditore: string | null;
  listingsSort: MarketplaceSort;
  sellerSubTab: SellerSubTab;
  filtersOpen: boolean;
}

export const INITIAL_PRODUCT_FILTERS: ProductFiltersState = {
  hideAuctions: false,
  condizioneMinima: null,
  linguaCarta: null,
  soloFoil: false,
  firmata: 'ENTRAMBI',
  alterata: 'ENTRAMBI',
  quantita: 1,
  posizioneVenditore: '',
  tipoVenditore: null,
  listingsSort: 'price_asc',
  sellerSubTab: 'VENDITORI',
  filtersOpen: true,
};

type SetAction = {
  [K in keyof ProductFiltersState]: { type: 'set'; key: K; value: ProductFiltersState[K] };
}[keyof ProductFiltersState];

export type ProductFiltersAction = SetAction;

export function productFiltersReducer(
  state: ProductFiltersState,
  action: ProductFiltersAction
): ProductFiltersState {
  switch (action.type) {
    case 'set':
      if (Object.is(state[action.key], action.value)) return state;
      return { ...state, [action.key]: action.value };
    default:
      return state;
  }
}

interface UseProductFiltersArgs {
  userCountry: string | null | undefined;
  detectedCountry: string | null | undefined;
  /** Id del prodotto corrente: al suo cambio il filtro paese torna a "tutti i paesi". */
  productId?: string | null;
}

export function useProductFilters({ productId }: UseProductFiltersArgs) {
  const [state, dispatch] = useReducer(productFiltersReducer, INITIAL_PRODUCT_FILTERS);

  // Il filtro "Posizione venditore" parte sempre da "tutti i paesi" ('') — non viene
  // pre-selezionato il paese dell'utente — e ci torna ogni volta che si apre un prodotto
  // diverso: la selezione non deve trascinarsi tra una carta e l'altra (la route
  // /products/[slug] riusa la stessa istanza del componente, quindi lo stato
  // sopravvivrebbe alla navigazione). A sito chiuso/riaperto lo stato è comunque nuovo,
  // quindi resta "tutti i paesi".
  useEffect(() => {
    dispatch({ type: 'set', key: 'posizioneVenditore', value: '' });
  }, [productId]);

  // Chiusura automatica del pannello filtri dopo 1s dal mount.
  useEffect(() => {
    const timer = setTimeout(
      () => dispatch({ type: 'set', key: 'filtersOpen', value: false }),
      1000
    );
    return () => clearTimeout(timer);
  }, []);

  const setters = useMemo(
    () => ({
      setHideAuctions: (v: boolean) => dispatch({ type: 'set', key: 'hideAuctions', value: v }),
      setCondizioneMinima: (v: ConditionCode | null) =>
        dispatch({ type: 'set', key: 'condizioneMinima', value: v }),
      setLinguaCarta: (v: string | null) => dispatch({ type: 'set', key: 'linguaCarta', value: v }),
      setSoloFoil: (v: boolean) => dispatch({ type: 'set', key: 'soloFoil', value: v }),
      setFirmata: (v: TriState) => dispatch({ type: 'set', key: 'firmata', value: v }),
      setAlterata: (v: TriState) => dispatch({ type: 'set', key: 'alterata', value: v }),
      setQuantita: (v: number) => dispatch({ type: 'set', key: 'quantita', value: v }),
      setPosizioneVenditore: (v: string) =>
        dispatch({ type: 'set', key: 'posizioneVenditore', value: v }),
      setTipoVenditore: (v: string | null) =>
        dispatch({ type: 'set', key: 'tipoVenditore', value: v }),
      setListingsSort: (v: MarketplaceSort) =>
        dispatch({ type: 'set', key: 'listingsSort', value: v }),
      setSellerSubTab: (v: SellerSubTab) =>
        dispatch({ type: 'set', key: 'sellerSubTab', value: v }),
      setFiltersOpen: (v: boolean) => dispatch({ type: 'set', key: 'filtersOpen', value: v }),
    }),
    []
  );

  const marketplaceFilters: MarketplaceFilterState = useMemo(
    () => ({
      hideAuctions: state.hideAuctions,
      condizioneMinima: state.condizioneMinima,
      linguaCarta: state.linguaCarta,
      soloFoil: state.soloFoil,
      firmata: state.firmata,
      alterata: state.alterata,
      quantitaMin: state.quantita,
      posizioneVenditore: state.posizioneVenditore,
      tipoVenditore: state.tipoVenditore as SellerTypeFilter | null,
    }),
    [
      state.hideAuctions,
      state.condizioneMinima,
      state.linguaCarta,
      state.soloFoil,
      state.firmata,
      state.alterata,
      state.quantita,
      state.posizioneVenditore,
      state.tipoVenditore,
    ]
  );

  return { ...state, ...setters, marketplaceFilters };
}
