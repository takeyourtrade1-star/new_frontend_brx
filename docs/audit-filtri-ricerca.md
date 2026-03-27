# Audit Filtri Ricerca Prodotti — Ebartex

## 1. Audit Tecnico Sintetico

### 1.1 File Coinvolti

| File | Ruolo | Problema identificato |
|------|-------|----------------------|
| `app/api/search/route.ts` | API proxy verso Meilisearch | Supporta solo `category_id` singolo (stringa), non array |
| `components/feature/search/SearchResults.tsx` | UI filtri + rendering risultati | Categorie hardcoded, logica sporca (solo category_id=1 mappato), filtri disabilitati |
| `components/layout/GlobalSearchBar.tsx` | Ricerca globale header | Usa `type` Meilisearch invece di `category_id` (approccio diverso!) |
| `lib/product-categories.ts` | Config categorie statiche | Nessun collegamento a category_id reali, solo label UI |
| `app/search/page.tsx` | Page wrapper | Non passa category ai componenti, solo query/game |

### 1.2 Flusso Attuale End-to-End

```
[UI Header/Search]
    │
    ├─► GameContext (selectedGame: 'mtg'|'pokemon'|'op')
    │
    ├─► Filtro categoria: hardcoded 'carte-singole' → category_id=1
    │
    ▼
[URL Query Params]
    q, game, set, category_id (singolo), page, sort
    │
    ▼
[/api/search/route.ts]
    Legge: game → game_slug, category_id → category_id (singolo)
    Build filter: `game_slug = "X" AND category_id = Y`
    │
    ▼
[Meilisearch]
    Ritorna hits con category_id numerico
    │
    ▼
[SearchResults.tsx]
    Rendering lista/griglia, mostra category_name se presente
```

### 1.3 Problemi Reali

| # | Problema | Impatto |
|---|----------|---------|
| P1 | API supporta solo `category_id` singolo | Non si possono raggruppare categorie simili (es. Singles = id 1+2+3) |
| P2 | SearchResults.tsx ha logica sporca | `categoryId === '1' ? 'carte-singole' : ''` — solo Magic Singles mappato |
| P3 | GlobalSearchBar vs SearchResults usano filtri diversi | Header usa `type` Meilisearch, Search usa `category_id` — inconsistenza |
| P4 | Categorie hardcoded seno gioco selezionato | Mostra "Carte singole" anche se gioco non è Magic |
| P5 | Default a "singles" non implementato | Nessun filtro default attivo all'apertura pagina |
| P6 | Label non neutrali | "Magic Carta Singola" invece di "Carte singole" |

### 1.4 Stato Attuale Query Model

```typescript
// Parametri URL attuali:
interface CurrentQueryParams {
  q?: string;           // query testuale
  game?: string;        // 'mtg' | 'pokemon' | 'one-piece'
  set?: string;         // nome set
  category_id?: string; // ❌ singolo id numerico
  page?: string;
  sort?: string;
}

// Filtri Meilisearch generati:
// game_slug = "mtg" AND category_id = 1
```

---

## 2. Proposta Architettura Filtri

### 2.1 Principi guida

1. **Gioco-first**: Il gioco è il context. Tutti i filtri sono contestuali al gioco selezionato.
2. **Category key neutrali**: Label senza nome gioco. "Carte singole", non "Magic Carte Singole".
3. **Macro-categorie**: Una chiave logica mappa N category_id fisici.
4. **Default sensato**: Apertura pagina = filtro "singles" attivo automaticamente.
5. **Backward compatibility**: URL esistenti continuano a funzionare.

### 2.2 Nuovo Query Model

```typescript
// Nuovi parametri URL (proposta):
interface NewQueryParams {
  q?: string;                    // query testuale
  game?: string;                 // 'mtg' | 'pokemon' | 'one-piece'
  set?: string;                  // nome set
  category_key?: string;        // ✅ nuovo: 'singles' | 'boosters' | 'booster_box' | ...
  // Legacy support:
  category_id?: string;          // mantenuto per compatibilità (mappa a category_key internamente)
  page?: string;
  sort?: string;
}

// API route supporta (opzionale):
category_ids?: string;  // "1,2,3" per macro-categorie multi-id
```

### 2.3 Stati UI Proposti

```typescript
type GameSlug = 'mtg' | 'pokemon' | 'one-piece';

type CategoryKey = 
  | 'singles'           // Carte singole
  | 'boosters'          // Buste singole
  | 'booster_box'       // Box di buste
  | 'starter_precon'    // Mazzi precostruiti
  | 'bundle_set'        // Bundle / Complete sets
  | 'tins'              // Tin boxes
  | 'accessori'         // Sleeve, playmat, deck box, album, etc.
  | 'collezionabili'    // Memorabilia, uncut sheets, etc.
  | 'all';              // Tutte le categorie

interface FilterState {
  game: GameSlug | null;
  categoryKey: CategoryKey;
  categoryIds: number[];  // risolti da mapping
}

// Comportamento:
// - game = null: nessun filtro categoria mostrato (o disabilitato)
// - game = 'mtg', categoryKey = 'singles': mostra "Carte singole", usa ids [1,2,3]
```

### 2.4 Flow Utente

```
[Apertura /search]
    │
    ├─► Se game presente in URL: usa quello
    ├─► Altrimenti: default a 'mtg' (Magic)
    │
    ├─► Se category_key presente: usa quello
    ├─► Altrimenti: default a 'singles'
    │
    ▼
[UI Filtri]
    Mostra dropdown "Categoria" con opzioni contestuali al game:
    - Carte singole (selected)
    - Booster
    - Booster box
    - Mazzi precostruiti
    - ...
    │
    ▼
[Chiamata API]
    /api/search?game=mtg&category_ids=1,2,3&q=...
```

### 2.5 Fallback & Edge Cases

| Scenario | Comportamento |
|----------|---------------|
| Game non selezionato | Dropdown categorie disabilitato o con placeholder "Seleziona un gioco" |
| category_key non valido per game | Fallback a 'all' (nessun filtro categoria) |
| URL con category_id legacy | Mappa a category_key se possibile, altrimenti usa direttamente |
| Ricerca da header (GlobalSearchBar) | Usa stesso mapping, passa game + category_key |
| Cambio gioco | Reset category_key a 'singles' (default) |

---

## 3. JSON Mapping Production-Ready

```json
{
  "_meta": {
    "version": "1.0.0",
    "description": "Mapping category_key → category_id per gioco. Label neutrali (senza nome gioco).",
    "last_updated": "2025-03-27"
  },
  "mtg": {
    "singles": {
      "label_it": "Carte singole",
      "label_en": "Single cards",
      "ids": [1, 2, 3]
    },
    "boosters": {
      "label_it": "Booster",
      "label_en": "Boosters",
      "ids": [5]
    },
    "booster_box": {
      "label_it": "Booster box",
      "label_en": "Booster boxes",
      "ids": [4]
    },
    "starter_precon": {
      "label_it": "Mazzi precostruiti",
      "label_en": "Preconstructed decks",
      "ids": [7, 17]
    },
    "bundle_set": {
      "label_it": "Bundle e set",
      "label_en": "Bundles and sets",
      "ids": [6, 10, 13, 23, 24]
    },
    "tins": {
      "label_it": "Tin box",
      "label_en": "Tin boxes",
      "ids": [271]
    },
    "accessori": {
      "label_it": "Accessori",
      "label_en": "Accessories",
      "ids": [12, 15, 16, 19, 20, 21, 22, 25, 26, 203, 205, 211]
    },
    "collezionabili": {
      "label_it": "Collezionabili",
      "label_en": "Collectibles",
      "ids": [8, 9, 18, 43, 164]
    }
  },
  "pokemon": {
    "singles": {
      "label_it": "Carte singole",
      "label_en": "Single cards",
      "ids": [73, 78]
    },
    "boosters": {
      "label_it": "Booster",
      "label_en": "Boosters",
      "ids": [66, 190]
    },
    "booster_box": {
      "label_it": "Booster box",
      "label_en": "Booster boxes",
      "ids": [67]
    },
    "starter_precon": {
      "label_it": "Mazzi precostruiti",
      "label_en": "Preconstructed decks",
      "ids": [69]
    },
    "bundle_set": {
      "label_it": "Bundle e set",
      "label_en": "Bundles and sets",
      "ids": [68, 136]
    },
    "tins": {
      "label_it": "Tin box",
      "label_en": "Tin boxes",
      "ids": [59]
    },
    "accessori": {
      "label_it": "Accessori",
      "label_en": "Accessories",
      "ids": [62, 63, 64, 65, 74, 86, 118, 203, 205, 211]
    },
    "collezionabili": {
      "label_it": "Collezionabili",
      "label_en": "Collectibles",
      "ids": [60, 61, 117]
    }
  },
  "one-piece": {
    "singles": {
      "label_it": "Carte singole",
      "label_en": "Single cards",
      "ids": [255]
    },
    "boosters": {
      "label_it": "Booster",
      "label_en": "Boosters",
      "ids": [194]
    },
    "booster_box": {
      "label_it": "Booster box",
      "label_en": "Booster boxes",
      "ids": [193]
    },
    "starter_precon": {
      "label_it": "Mazzi precostruiti",
      "label_en": "Preconstructed decks",
      "ids": [195]
    },
    "bundle_set": {
      "label_it": "Bundle e set",
      "label_en": "Bundles and sets",
      "ids": [200, 201]
    },
    "tins": {
      "label_it": "Tin box",
      "label_en": "Tin boxes",
      "ids": [256]
    },
    "accessori": {
      "label_it": "Accessori",
      "label_en": "Accessories",
      "ids": [196, 197, 198, 199, 203, 205, 211]
    },
    "collezionabili": {
      "label_it": "Collezionabili",
      "label_en": "Collectibles",
      "ids": [253, 257]
    }
  },
  "yugioh": {
    "singles": {
      "label_it": "Carte singole",
      "label_en": "Single cards",
      "ids": [44, 76]
    },
    "boosters": {
      "label_it": "Booster",
      "label_en": "Boosters",
      "ids": [53, 117]
    },
    "booster_box": {
      "label_it": "Booster box",
      "label_en": "Booster boxes",
      "ids": [54]
    },
    "starter_precon": {
      "label_it": "Mazzi precostruiti",
      "label_en": "Preconstructed decks",
      "ids": [47, 70]
    },
    "bundle_set": {
      "label_it": "Bundle e set",
      "label_en": "Bundles and sets",
      "ids": [72]
    },
    "tins": {
      "label_it": "Tin box",
      "label_en": "Tin boxes",
      "ids": [55]
    },
    "accessori": {
      "label_it": "Accessori",
      "label_en": "Accessories",
      "ids": [45, 46, 49, 50, 75, 56, 203, 205, 211]
    },
    "collezionabili": {
      "label_it": "Collezionabili",
      "label_en": "Collectibles",
      "ids": [52]
    }
  }
}
```

### 3.1 Note sul Mapping

| Categoria | Note |
|-----------|------|
| **singles** | Include carte singole + token + oversized per completezza |
| **bundle_set** | Aggrega Bundle, Complete Sets, Box Sets, Prerelease (MTG) |
| **accessori** | Include anche "All Games" (id 203, 205, 211) cross-game |
| **collezionabili** | Memorabilia, Uncut Sheets, Wall Scrolls, Empty Packaging, Books |
| **starter_precon** | Starter Decks + Preconstructed (spesso sovrapposti) |

---

## 4. Piano Implementativo Step-by-Step

### Fase 0: Preparazione (Safe)

1. **Creare file di mapping**: `lib/search/category-mapping.ts`
   - Esporta tipo `CategoryKey`
   - Esporta oggetto `CATEGORY_MAPPING`
   - Funzione `getCategoryIds(game: GameSlug, key: CategoryKey): number[]`
   - Funzione `getCategoryKeys(game: GameSlug): CategoryKey[]`

2. **Aggiungere supporto API per category_ids** (opzionale ma raccomandato):
   - Modifica `app/api/search/route.ts`: accetta `category_ids=1,2,3`
   - Se presente, usa `category_id IN [1,2,3]` invece di `=`
   - Fallback a `category_id` singolo se solo quello presente

### Fase 1: Refactor SearchResults.tsx

3. **Nuovo hook `useSearchFilters`**:
   ```typescript
   const { categoryKey, categoryIds, setCategoryKey, availableKeys } = 
     useSearchFilters(game, /* default */ 'singles');
   ```

4. **Rimuovere hardcoded category options**:
   - Sostituire `<select>` categorie con opzioni dinamiche da mapping
   - Label da `CATEGORY_MAPPING[game][key].label_it`

5. **Default a singles**:
   - Se URL non ha `category_key` → redirect/rewrite con `category_key=singles`

### Fase 2: Integrazione GlobalSearchBar

6. **Allineare GlobalSearchBar**:
   - Usare stesso mapping invece di `CATEGORY_TO_MEILI_TYPE`
   - Passare `category_key` invece di `type`

### Fase 3: URL & Routing

7. **Helper `buildSearchUrl`** aggiornato:
   - Genera URL con `category_key` invece/in aggiunta a `category_id`

8. **Backward compatibility**:
   - Se `category_id` presente in URL, mappare a `category_key` internamente
   - Non rompere URL esistenti indicizzati

### Fase 4: Testing & Rollout

9. **Test manuali** (vedi sezione 5)
10. **Deploy graduale**: feature flag opzionale

---

## 5. Casi Test Manuali

### 5.1 Flusso Base

| # | Test | Input | Expected Result |
|---|------|-------|-----------------|
| T1 | Default singles | `/search?game=mtg` | Redirect a `?game=mtg&category_key=singles`, risultati id 1,2,3 |
| T2 | Cambio categoria | Select "Booster" | URL aggiorna a `category_key=boosters`, risultati id 5 |
| T3 | Cambio gioco | Switch a Pokemon | URL `game=pokemon&category_key=singles`, risultati id 73,78 |
| T4 | Categoria accessori MTG | `category_key=accessori` | Mostra risultati id 12,15,16,19,20,21,22,25,26,203,205,211 |
| T5 | Categoria all | `category_key=all` | Nessun filtro category_id applicato |

### 5.2 Edge Cases

| # | Test | Input | Expected Result |
|---|------|-------|-----------------|
| T6 | Legacy URL | `/search?game=mtg&category_id=1` | Funziona, mappa a singles |
| T7 | Categoria non valida | `category_key=xyz` | Fallback a 'all' |
| T8 | Gioco non valido | `game=invalid` | Filtri categorie disabilitati/placeholder |
| T9 | No gioco selezionato | `/search` | Default a mtg + singles |
| T10 | Category_key + category_id | `?category_key=singles&category_id=5` | category_key vince, ignora category_id |

### 5.3 Cross-Game Consistency

| # | Test | Verifica |
|---|------|----------|
| T11 | Label MTG | "Carte singole" (non "Magic Carte singole") |
| T12 | Label Pokemon | "Carte singole" (non "Pokémon Singles") |
| T13 | Label One Piece | "Carte singole" (non "One Piece...") |
| T14 | Accessori cross-game | Include id 203, 205, 211 per tutti i giochi |
| T15 | Tins disponibili | Solo per giochi che hanno tins (MTG, Pokemon, One Piece, YuGiOh) |

---

## 6. Rischi Residui e Decisioni Aperte

### 6.1 Rischi Identificati

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| **R1**: API non supporta `category_id IN` | Media | Alta | Verificare sintassi Meilisearch; se non supportata, fare N query o usare OR |
| **R2**: ID categorie ambigui/errati in DB | Bassa | Media | Validare con query di test prima del deploy |
| **R3**: Performance con molti ID in OR | Bassa | Media | Testare con IDs più lunghi (es. accessori) |
| **R4**: GlobalSearchBar usa `type` non `category_id` | Alta | Bassa | Decidere se unificare approccio o mantenere dualità |

### 6.2 Decisioni Aperte (da confermare con stakeholder)

| # | Domanda | Opzioni | Raccomandazione |
|---|---------|---------|-----------------|
| D1 | Booster vs Booster Box confusione | Unire o separare? | **Separare** — sono distinti per utenti |
| D2 | Starter vs Precon | Distinguere o unire? | **Unire** — "Mazzi precostruiti" copre entrambi |
| D3 | Cross-game "All Games" accessori | Includere sempre? | **Sì** — utile per browsing |
| D4 | Complete Sets dove metterli? | Bundle o Collezionabili? | **Bundle** — sono prodotti acquistabili |
| D5 | YuGiOh! includere? | Sì/No | **Sì** — dati già presenti, coerenza |
| D6 | Ordine categorie in dropdown? | Alfabetico o per priorità? | **Per priorità**: Singles, Booster, Booster Box, Precon, Bundle, Tins, Accessori, Collezionabili |

### 6.3 ID Categorie Da Verificare (Ambiguità)

| ID | Nome originale | Assegnato a | Note |
|----|----------------|-------------|------|
| 10 | "Magic Extra - Box Sets & Displays" | bundle_set | Potrebbe essere "collezionabili"? |
| 24 | "Magic Tournament Prerelease Packs" | bundle_set | Confermare se bundle o boosters |
| 117 | "Special & Deluxe Editions" | Pokemon? No, è YuGiOh | Verificare se boosters o bundle |
| 136 | "Pokémon Complete Set" | bundle_set | Confermare — è un bundle |
| 190 | "Pokémon Blisters" | boosters | I blister sono boosters singoli? |
| 203, 205, 211 | "All Games..." | accessori | Confermare che esistano in tutti i giochi |

---

## 7. Sintesi Output Richiesti

| # | Output | Stato | File/Locazione |
|---|--------|-------|----------------|
| 1 | Audit tecnico | ✅ Completato | Questo documento, sezione 1 |
| 2 | Architettura filtri | ✅ Completata | Sezione 2 |
| 3 | JSON mapping | ✅ Completato | Sezione 3 |
| 4 | Piano implementativo | ✅ Completato | Sezione 4 |
| 5 | Casi test | ✅ Completati | Sezione 5 |
| 6 | Rischi e decisioni | ✅ Completati | Sezione 6 |

---

*Documento preparato per Ebartex — Refactoring logica filtri ricerca prodotti*
