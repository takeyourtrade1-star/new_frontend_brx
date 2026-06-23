import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import {
  INITIAL_PRODUCT_FILTERS,
  productFiltersReducer,
  useProductFilters,
} from '@/hooks/product/useProductFilters';

describe('productFiltersReducer', () => {
  it('aggiorna un campo con SET preservando il resto dello stato', () => {
    const next = productFiltersReducer(INITIAL_PRODUCT_FILTERS, {
      type: 'set',
      key: 'soloFoil',
      value: true,
    });
    expect(next.soloFoil).toBe(true);
    expect(next.firmata).toBe('ENTRAMBI');
    // immutabilità: nuovo riferimento
    expect(next).not.toBe(INITIAL_PRODUCT_FILTERS);
  });

  it('non crea un nuovo stato se il valore è invariato (Object.is)', () => {
    const same = productFiltersReducer(INITIAL_PRODUCT_FILTERS, {
      type: 'set',
      key: 'firmata',
      value: 'ENTRAMBI',
    });
    expect(same).toBe(INITIAL_PRODUCT_FILTERS);
  });
});

describe('useProductFilters', () => {
  it('deriva marketplaceFilters e aggiorna i campi tramite i setter', () => {
    const { result } = renderHook(() =>
      useProductFilters({ userCountry: undefined, detectedCountry: undefined })
    );

    expect(result.current.marketplaceFilters.quantitaMin).toBe(1);
    expect(result.current.hideAuctions).toBe(false);

    act(() => {
      result.current.setQuantita(3);
      result.current.setHideAuctions(true);
    });

    expect(result.current.quantita).toBe(3);
    expect(result.current.marketplaceFilters.quantitaMin).toBe(3);
    expect(result.current.marketplaceFilters.hideAuctions).toBe(true);
  });

  it('inizializza posizioneVenditore una sola volta dal paese utente', async () => {
    const { result, rerender } = renderHook(
      (props: { userCountry?: string; detectedCountry?: string }) =>
        useProductFilters({
          userCountry: props.userCountry,
          detectedCountry: props.detectedCountry,
        }),
      { initialProps: { userCountry: undefined as string | undefined, detectedCountry: 'IT' as string | undefined } }
    );

    await waitFor(() => expect(result.current.posizioneVenditore).toBe('IT'));

    // un cambio tardivo non deve sovrascrivere la prima inizializzazione
    rerender({ userCountry: 'FR', detectedCountry: 'IT' });
    expect(result.current.posizioneVenditore).toBe('IT');
  });
});
