# Componenti Tabella Venditori Moderna

Questa cartella contiene i nuovi componenti per la tabella venditori modernizzata, ispirata al design di Card Market.

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

### `ModernSellerFilters.tsx`
Pannello filtri moderno integrato con:
- Ordinamento avanzato (prezzo, venditore, condizione, quantità)
- Filtri per paese venditore
- Filtri per tipo venditore (Privato, Professionale, PowerSeller)
- Toggle per BRX Express, Foil, carte firmate
- Condizione minima selezionabile
- Design espandibile con indicatori filtri attivi

### `BrxExpressIcon.tsx`
Icona personalizzata per BRX Express:
- Fulmine moderno e elegante
- Dimensioni responsive (sm, md, lg)
- Badge completo per BRX Express
- Coerente con il design system

## Caratteristiche Principali

### 🎨 Design Moderno
- Ispirato a Card Market
- Layout card-based pulito
- Gradiente per elementi BRX Express
- Animazioni fluide e transizioni

### 🔧 Funzionalità Complete
- Filtri avanzati integrati
- Ordinamento multiplo
- Supporto mobile responsive
- Stati di caricamento eleganti

### ⚡ BRX Express
- Badge prominente per articoli con spedizione rapida
- Icona fulmine personalizzata
- Evidenziazione visiva con gradiente arancione

### 🏷️ Grading & Badge
- Sistema di grading `ConditionBadge` integrato
- Badge per PowerSeller, Professionali
- Indicatori per carte firmate
- Supporto completo foil

### 🌍 Internazionalizzazione
- Bandiere nazionali per venditori
- Supporto multi-lingua
- Formattazione valuta locale

## Integrazione

I nuovi componenti sono integrati in `ProductDetailView.tsx` sostituendo completamente la vecchia tabella e sidebar filtri.

### Stati Filtri
```typescript
const [sortBy, setSortBy] = useState('price_asc');
const [selectedCountry, setSelectedCountry] = useState('all');
const [showPrivate, setShowPrivate] = useState(true);
const [showProfessional, setShowProfessional] = useState(true);
const [showPowerSeller, setShowPowerSeller] = useState(true);
const [onlyFoil, setOnlyFoil] = useState(false);
const [onlyBrxExpress, setOnlyBrxExpress] = useState(false);
const [onlySignedCards, setOnlySignedCards] = useState(false);
const [minCondition, setMinCondition] = useState('any');
```

### Mock Data
Per testing e sviluppo, il primo elemento nella lista ha sempre BRX Express attivo. In produzione, questo sarà determinato dai dati dell'API.

## Demo

Visita `/demo-seller-table` per vedere una demo interattiva dei nuovi componenti con dati mock.