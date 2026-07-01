# Componenti Tabella Venditori Moderna

Questa cartella contiene i componenti per la tabella venditori modernizzata, ispirata al design di Card Market.

## Componenti

### `ModernSellerTable.tsx`
Tabella moderna e pulita per visualizzare i venditori con:
- Design card-based pulito e moderno
- Supporto completo per mobile e desktop
- Badge per BRX Express, carte firmate, PowerSeller
- Grading visibile con `ConditionBadge`
- Bandiere nazionali per ogni venditore
- Indicatori per aste con countdown
- Stati di loading e errore

Usata da `components/feature/product/detail/ProductDetailMarketplaceSection.tsx`,
insieme al pannello filtri gestito da `hooks/product/useProductFilters.ts`
(sort, posizione/tipo venditore, condizione minima, lingua, firmata/alterata,
foil, quantità).
