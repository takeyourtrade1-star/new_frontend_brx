# Plan refactoring — Client-Side Bloat → Server-Side

> **Modalità**: analisi read-only completata. Questo file elenca SOLO le problematiche,
> organizzate in blocchi operativi indipendenti. Nessun fix è incluso: ogni blocco è
> pronto per essere aperto come task separato da Claude Code (o da sessioni diverse).
>
> **Decisioni di governance già confermate dall'utente**:
> 1. Le aste restano visibili anche da non loggati (cache SC aggressiva ammessa).
> 2. Validazione: **doppia** (server obbligatorio, client resta per UX immediata).
> 3. `dynamic({ ssr: false })` su pagine account: scelta "best practice" = TUTTE le pagine `/account/*`.
> 4. `framer-motion`: stato attuale confermato, nessuna sostituzione globale. Lavorare solo dove è sovraccarico esplicito (es. sostituibile con CSS senza perdere UX percepita).

---

## Indice dei blocchi

| Blocco | Tema | # items | Impatto prevalente |
|--------|------|---------|---------------------|
| **BLOC-1** | Inventario utente (download + filtri + bulk + export) | 5 | HIGH |
| **BLOC-2** | Aste (lista, dettaglio, personali, simili) | 8 | HIGH |
| **BLOC-3** | Marketplace listings per product page | 2 | HIGH |
| **BLOC-4** | Search e Set Page (paginazione + autocomplete) | 3 | HIGH/MEDIUM |
| **BLOC-5** | Pre-fetching server-side (RSC) | 7 | HIGH |
| **BLOC-6** | `dynamic({ ssr: false })` pagine pesanti | 3 | MEDIUM |
| **BLOC-7** | Bundle: rimozione dipendenze morte | 2 | LOW |
| **BLOC-8** | Bundle: framer-motion dove sostituibile con CSS | 3 | MEDIUM |
| **BLOC-9** | Bundle: html2canvas / onnxruntime / cropper / image-compression | 4 | MEDIUM |
| **BLOC-10** | Bundle: axios / zod / country-flag-icons / qrcode | 4 | MEDIUM |
| **BLOC-11** | Componenti SC-eligible oggi `'use client'` | 2 | LOW |
| **BLOC-12** | Account pages: dynamic import + pre-fetching | 1 | MEDIUM |
| **BLOC-13** | Pattern vietati `useEffect + fetch + setState` | 3 | LOW/MEDIUM |
| **BLOC-14** | Anti-pattern minori (mock chart, sort ridondanti) | 3 | LOW |

Totale items operativi: **50**.

---

# BLOC-1 — Inventario utente (download, filtri, bulk, export)

> Hot path per un venditore. Oggi scarica tutto in RAM, applica filtri O(N²), fa bulk 1-by-1,
> genera CSV in memoria. Tutto da spostare server-side.

## 1.1 — `useAccountInventory` scarica l'intero inventario in loop

- **Path:** `lib/hooks/use-account-inventory.ts:62-101` (hook React Query)
- **Helper corrotto:** `lib/inventory/fetch-account-inventory-raw.ts:13-42` (loop `do/while` con `INVENTORY_API_CHUNK = 200`)
- **Chiamato da:** `components/feature/account/OggettiContent.tsx:80`
- **API coinvolta:** `GET /api/v1/sync/inventory/{userId}?limit=200&offset=...`
- **Effetto osservato:** fino a 100 round-trip seriali per un venditore 20k items; ~10 MB JSON in RAM; `loadCatalogInBackground` (linee 19-60) aggiunge batch Meili da 80 per TUTTI i `blueprint_id` unici.
- **Pattern vietato (CLAUDE.md §2):** `useEffect` su `dataUpdatedAt` che fa fetch in background di dati "arricchimento" dentro lo stesso hook.

## 1.2 — `applyInventoryFilters` con smart "duplicates" = O(N²)

- **Path:** `lib/inventory/inventory-filter-utils.ts:211-268` (`applyInventoryFilters`)
- **Chiamato da:** `components/feature/account/OggettiContent.tsx:114-117` (in `useMemo`)
- **Sub-problemi interni:**
  - Riga 226-230: `fullList.filter((i) => i.blueprint_id === item.blueprint_id)` annidato in `list.filter` → O(N²).
  - Riga 234-235: `matchInventorySearch` su tutti gli item ad ogni keystroke del campo search.
  - `sortInventoryItems` (riga 167): `getInventoryConditionCode` per ogni coppia di confronto in `condition-*/name-*` → `localeCompare` su tutta la lista.
- **Effetto osservato:** centinaia di ms bloccanti su main thread per inventario >1k.

## 1.3 — `buildInventoryFacets` ricalcolato su full inventory ad ogni render

- **Path:** `lib/inventory/inventory-filter-utils.ts:278+` (`buildInventoryFacets`)
- **Chiamato da:** `components/feature/account/OggettiContent.tsx:112`
- **Effetto osservato:** 5 passaggi di `getInventoryGameKey` / `getInventoryConditionCode` su TUTTO `inventoryItems` ad ogni refresh. Combinato con 1.2, ogni mutazione di facet ricalcola l'intera pipeline.
- **Accessorio:** `JSON.stringify(sanitized) === JSON.stringify(prev)` in `OggettiContent.tsx:119-124` (confronto pesante).

## 1.4 — Bulk delete e bulk price update 1-by-1 in serie

- **Path:** `components/feature/account/OggettiContent.tsx:361-410` (bulk delete) e `:412-453` (bulk price apply)
- **Sub-problemi:**
  - Loop `for` con `await deleteInventoryOrListing` / `await updateInventoryOrListing` per ogni id.
  - `inventoryRaw.find((row) => row.id === ids[i])` dentro il loop → O(n²) su 100+ selezioni.
  - Logica di business (markup %, fallback `condition` / `mtg_language`) interamente client.
- **Stesso pattern:** `components/feature/account/oggetti/OggettiTable.tsx:116-144` (poll sync 1-by-1).
- **Effetto osservato:** 100 items × ~200ms RTT = ~20s bloccanti.

## 1.5 — Export CSV / JSON inventario in memoria

- **Path:** `components/feature/account/OggettiContent.tsx:519-566` (`handleExportCSV` / `handleExportJson`)
- **Helper:** `lib/inventory/inventory-export-utils.ts:29-57`
- **Sub-problemi:**
  - `filteredInventoryItems.map(itemToExportRow)` su TUTTO il dataset filtrato.
  - `JSON.stringify(data, null, 2)` per export JSON → doppio lavoro (CSV + JSON).
  - `URL.createObjectURL(blob)` senza `URL.revokeObjectURL` → memory leak.
- **Anteprima mobile:** `components/feature/account/oggetti/InventoryFiltersPanel.tsx:139` chiama `applyInventoryFilters(...).length` ad ogni digit del filtro.

---

# BLOC-2 — Aste (lista, dettaglio, personali, simili)

## 2.1 — `useSetPageCards` loop su TUTTE le pagine del set

- **Path:** `lib/hooks/use-search.ts:86-120`
- **Chiamato da:** `components/feature/product/SetPageClient.tsx:107`
- **API:** `GET /api/search?set=...&limit=100&page=...` (BFF: `app/api/search/route.ts`)
- **Effetto osservato:** per set MTG da 400+ carte, scarica `totalPages` richieste seriali e porta in RAM ~0.5-1 MB di hit. Nessuna virtualizzazione.

## 2.2 — `AsteHubPage` "load more" = increase limit, no offset

- **Path:** `components/feature/aste/AsteHubPage.tsx:232-385`
- **Hook:** `use-auctions.ts` → `useAuctionList`
- **API:** `GET /api/auctions/?limit=N&offset=0&status=...&q=...` (proxy `app/api/auctions/route.ts:50-53`)
- **Sub-problemi:**
  - Riga 379-385: `setApiBatchCount((c) => c + 1)` → dopo 10 click, scarica 200 aste da offset 0.
  - Filtri `browseTab` / `filterPriceMax` / `filterMinBids` applicati client (riga 340-354).
  - `refetchInterval: 10_000` → costo raddoppiato.
  - `useEnrichedAuctions` ricarica profili venditore ogni 10s per 100 aste → 100 chiavi cache su `/api/auth/users/.../public-profile`.

## 2.3 — Aste personali: `limit: 100` + filter `created_by_user_id` / `highest_bidder_id` client

- **Path A:** `components/feature/aste/AsteMyListingsPage.tsx:34, 43-48`
  - `useAuctionList({ limit: 100 })` → `listData.data.filter((a) => a.created_by_user_id === userId)`
- **Path B:** `components/feature/aste/AsteParticipationsPage.tsx:28, 40-60`
  - `useAuctionList({ limit: 100 })` → loop su `listData.data` che tiene `isCreator` o `isBidder`.
- **Path C:** `components/feature/users/UserProfileAuctionsPanel.tsx:31-34`
  - `useAuctionList({ created_by_user_id: userId, limit: 100 })` — già passa `created_by_user_id` ma **limite hardcoded 100**.
- **Effetto osservato:** 3 componenti con stesso anti-pattern; clamp nascosto a 100 record.

## 2.4 — `AsteInCorsoCarousel` / `ProductAuctionsPanel`: doppia `useAuctionList` con filter `isAuctionEndedUI` client

- **Path A:** `components/feature/aste/AsteInCorsoCarousel.tsx:167-189`
  - `useAuctionList({ status: 'ACTIVE', limit: 60 })` → `.filter((a) => !isAuctionEndedUI(a))` nonostante `status: 'ACTIVE'`.
  - `featuredAuctionIds`: `.filter(isEndingSoonUI).slice(0, 3)` → featured set + sort fatto in RAM.
- **Path B:** `components/feature/product/ProductAuctionsPanel.tsx:25-56`
  - **Doppia query**: `cardQuery` (per la card) + `recommendedQuery` (`limit: 12` poi `.slice(0, 6)`).
  - `.filter((a) => !shownIds.has(a.numericId)).slice(0, 6)` su recommended.

## 2.5 — `AsteDetailView`: 4 query + WebSocket + "simili" dopo dettaglio

- **Path:** `components/feature/aste/AsteDetailView.tsx` (49.3 KB)
- **Sub-problemi:**
  - 4 React Query partono dopo hydration: `useAuctionDetail`, `useAuctionBids`, `useAuctionList` (per "simili"), `useAuctionWebSocket` (WS).
  - WebSocket si connette solo dopo hydration.
  - "Aste simili" (riga 215-222): `useAuctionList({ limit: 3 })` poi `.filter((a) => a.id !== numericId).slice(0, 3)` (ridondante, `limit: 3` + `slice(0, 3)`).
  - `useEnrichedAuctions` su 3 elementi chiama `enrichAuctionsWithPublicUsers` → fetch profili pubblici 1-by-1.

## 2.6 — `useEnrichedAuctions` arricchisce 1-by-1 dopo ogni `useAuctionList`

- **Path:** `lib/hooks/use-enriched-auctions.ts:13-30, 34-72`
- **Helper:** `lib/auction/public-user-enrichment.ts`
- **Effetto osservato:** per 100 aste, 100 chiavi cache su `/api/auth/users/.../public-profile`. Rifatto ad ogni `refetchInterval: 10_000` di `AsteHubPage`.
- **Hook fratello:** `lib/hooks/use-enriched-card-auctions.ts:6-17` (stesso pattern su product page).

## 2.7 — `resolve-auction-search-query`: traduzione IT→EN + filter client

- **Path:** `lib/auction/resolve-auction-search-query.ts:43-103` + uso in `components/feature/aste/AsteHubPage.tsx:36-38`
- **Effetto osservato:** per ogni ricerca `/aste` chiama `/api/search` per tradurre, poi `auctionMatchesSearchTerms` con `String.includes` su TUTTE le aste in RAM.

## 2.8 — `minNextBidEur` + pricing rules: business logic lato client spoofabile

- **Path A:** `lib/auction/bid-math.ts:1-39` (`minNextBidEur`, `roundUpToHalfStep`)
- **Path B:** `lib/auction/auction-create-validation.ts:74-98` (validazione `start`/`buyNow`/`shippingNational`)
- **Path C:** `lib/auction/build-auction-create-payload.ts:24-96` (costruzione payload da draft)
- **Effetto osservato:** regole `anti-snipe`, `reserve price`, `bid increment step` calcolate sul client e spedite al server. Spoofable.

---

# BLOC-3 — Marketplace listings per product page

## 3.1 — `useMarketplaceListings`: 2 endpoint paralleli + merge + 9 filtri + 4 sort client

- **Path hook:** `lib/hooks/use-marketplace-listings.ts:14-57` (Promise.allSettled su sync + marketplace)
- **Path consumer:** `components/feature/product/ProductDetailView.tsx:228-234, 496-525`
- **Path filtri/sort:** `lib/product-detail/marketplace-rows.ts:96-194`
- **BFF:** `app/api/listings/route.ts` + `app/api/listings/blueprint/[blueprintId]/route.ts` (nessun `limit/offset`)
- **Sub-problemi:**
  - 2 sorgenti (sync + public) scaricate integre; nessuna paginazione server.
  - `filterMarketplaceRows` (riga 96-132): 9 condizioni annidate (foil, firmata, alterata, quantità, posizione, tipo venditore, lingua, condizione).
  - `sortMarketplaceRows` (riga 174-194): 2 `.filter` + 2 `.sort` con `localeCompare` (case `seller` riga 165) + 2 sort copia.
  - `cardsInSaleCount` (ProductDetailView:539-563): `listings.reduce` ricalcolato in `useMemo` ad ogni deps change.

## 3.2 — `ModernSellerTable`: N fetch foto in serie per riga

- **Path:** `components/feature/product/ModernSellerTable.tsx:207` (`useListingRowImageUrls`)
- **Sub-problema:** dentro `useEffect` per ogni riga marketplace fa `getListingPhotos(item.marketplace_listing_id)`. N round-trip in serie dopo hydration.
- **Violazione:** pattern vietato `useEffect + fetch + useState` (CLAUDE.md §2).

---

# BLOC-4 — Search e Set Page

## 4.1 — `useSetPageCards` (vedi 2.1, replicato in questo blocco per completezza di scope search)

## 4.2 — `react-instantsearch` + `@meilisearch/instant-meilisearch` bundle pesante

- **Path A:** `components/layout/search/SearchWithInstantSearch.tsx:7` (`useSearchBox`)
- **Path B:** `components/layout/GlobalSearchBar.tsx:11` (`InstantSearch`, `Configure`)
- **Path C:** `components/layout/search/SearchResultsDropdown.tsx:8` (`useSearchBox`, `useHits`)
- **Path D:** `components/layout/search/CardHit.tsx:7` (`Highlight`)
- **Path E:** `lib/meilisearchClient.ts:8` (`instantMeiliSearch`)
- **Bundle stimato:** ~70-120 kB gz in chunk "search" (già `dynamic` da `Header.tsx:18` ma resta grosso).
- **Esiste già il BFF:** `app/api/search/autocomplete/route.ts` (protocollo "Algolia multi-query").

## 4.3 — `SinglesView` riordino 30 hit lato client (logica di ranking)

- **Path:** `components/feature/product/SinglesView.tsx:344-412`
- **Hook:** `useSearchCards`
- **Effetto osservato:** replica lato client del ranking "exact match" che potrebbe stare nel backend Meili (ranking `exact > prefix > fuzzy`).

---

# BLOC-5 — Pre-fetching server-side (RSC)

> Pagine che oggi sono SC async ma passano solo l'`id` al client component, che rifà tutto dopo hydration.

## 5.1 — `app/products/[slug]/page.tsx` non pre-fetcha per ProductDetailView

- **Wrapper SC:** `app/products/[slug]/page.tsx` (già SC async)
- **Client corrotto:** `components/feature/product/ProductDetailView.tsx` (47.8 KB)
- **5 query che potrebbero essere pre-fatchate:** `useAuctionBlueprintInventory`, `useMarketplaceListings`, `useProductReprints`, `useAuctionList`, `useEnrichedCardAuctions`.

## 5.2 — `app/aste/[id]/page.tsx` non pre-fetcha per AsteDetailView

- **Wrapper SC:** `app/aste/[id]/page.tsx` (già SC async)
- **Client corrotto:** `components/feature/aste/AsteDetailView.tsx` (49.3 KB)
- **3 fetch + WS pre-fetcheabili:** `getAuction`, `getBids`, `getSimilarAuctions`.

## 5.3 — `app/aste/page.tsx` non pre-fetcha la prima pagina di AsteHubPage

- **Wrapper SC:** `app/aste/page.tsx` (già SC, async)
- **Client corrotto:** `components/feature/aste/AsteHubPage.tsx` (21 KB)
- **Mancata pre-fetch:** prime 20 aste `status=ACTIVE` con `initialData`.

## 5.4 — `app/users/[username]/page.tsx` non pre-fetcha i 3 dati per UserProfileClient

- **Wrapper SC:** `app/users/[username]/page.tsx` (già SC async, fa già `fetch` per `generateMetadata`)
- **Client corrotto:** `app/users/[username]/UserProfileClient.tsx` (15 KB)
- **3 fetch in waterfall:** `loadProfile` (useEffect) → `usePublicUserCollection` (gated) → `useAuctionList` (gated).
- **Sub-problemi:** entrambe le query figlie sono `enabled: profileLoaded` → seriali.

## 5.5 — `app/page.tsx` e `app/home/page.tsx`: figli tutti client senza pre-fetch

- **Wrapper SC:** `app/page.tsx` (20 righe, SC), `app/home/page.tsx`
- **Figli tutti client:** `LandingWelcome`, `MarketplaceDashboard`, `CategoriesGrid`, `EbartexProductsSection`, `HeroCarousel`, `FeaturesSection`, `GameHeroSection`, `GameHomeLayout`.
- **Effetto osservato:** la prima pagina di un visitatore anonimo carica: LandingWelcome (34 KB + framer-motion) + MarketplaceDashboard (~5 fetch client per game) + CategoriesGrid + EbartexProductsSection + HeroCarousel + FeaturesSection. Tutto in un colpo.

## 5.6 — `app/search/page.tsx` (esiste?) — verificare pre-fetching

- **Da ispezionare:** `app/search/page.tsx` (se esiste) + `app/search/advanced/page.tsx` + `app/search/user/page.tsx`.

## 5.7 — Pagine ordini non pre-fetchan

- **Path A:** `app/ordini/acquisti/page.tsx` + `components/feature/acquisti/AcquistiContent.tsx:259-329` (vedi 5.7a)
- **Path B:** `app/ordini/vendite/page.tsx` + `components/feature/vendite/...`
- **Path C:** `app/ordini/contestazioni/page.tsx` + `components/feature/dispute/...`
- **Sub-problema 5.7a — AcquistiContent doppia query:** `useBuyerOrders` chiamato 2 volte (tab attivo + `?limit=100` per contatori) + `useMyMarketplaceOrders` (page_size 50). Status raggruppato lato client con `mapApiStatusToTab` (riga 127) e `mapMarketplaceStatusToTab`.

---

# BLOC-6 — `dynamic({ ssr: false })` pagine pesanti

> Pattern positivo già in `app/aste/nuova/page.tsx`. Da replicare.

## 6.1 — `app/scanner/page.tsx` non dietro `dynamic()`

- **Path:** `app/scanner/page.tsx` (972 righe, monolitico, `'use client'`)
- **Incluso:** camera API + WASM + `useBrxScanner`.
- **Costo spedito inutilmente:** ~35 KB+ di bundle per visitatori che non scannerizzano.

## 6.2 — `app/brx-express/page.tsx` non dietro `dynamic()`

- **Path:** `app/brx-express/page.tsx`
- **Incluso:** `BrxExpressLanding` (62.9 KB) + framer-motion (~40 KB gz) + `ReadyOneDayMockup` + calcoli path SVG Catmull-Rom.
- **Pattern proposto:** shell SC (testo, layout) + `dynamic(BrxExpressLandingAnimation, { ssr: false })`.

## 6.3 — `app/c/asta-foto/page.tsx` e `app/c/vendi-foto/page.tsx` non dietro `dynamic()`

- **Path A:** `app/c/asta-foto/page.tsx` (AuctionMobilePairingUpload)
- **Path B:** `app/c/vendi-foto/page.tsx` (46 righe)
- **Incluso:** WebSocket + camera + `react-advanced-cropper` (vedi 9.2).
- **Nota:** differire il JS fino al click sul QR.

---

# BLOC-7 — Bundle: rimozione dipendenze morte

## 7.1 — `isomorphic-dompurify` mai importato

- **package.json:** riga 37
- **Verifica:** nessun `import` in tutto il codebase.
- **Tool di conferma:** `npm run deadcode` (knip).

## 7.2 — `react-easy-crop` mai importato

- **package.json:** riga 45
- **Verifica:** nessun `import` in tutto il codebase.
- **Nota:** candidato a sostituzione di `react-advanced-cropper` (vedi 9.2) oppure rimozione.

---

# BLOC-8 — Bundle: framer-motion dove sostituibile con CSS

> Decisione governance: NON sostituire globalmente. Interventi puntuali dove c'è un chiaro
> sovraccarico e la sostituzione CSS non perde UX percepita.

## 8.1 — `LandingHeroCarousel` (CSS transition può bastare)

- **Path:** `components/home/LandingHeroCarousel.tsx:10`
- **Cosa fa:** `AnimatePresence` + `motion.div` su cambio slide.
- **Sostituibile con:** `useState(idx)` + `transition-opacity duration-500` su `<div className="absolute inset-0">`.

## 8.2 — `HamburgerMenu` (transizioni CSS)

- **Path:** `components/layout/HamburgerMenu.tsx:26`
- **Cosa fa:** `AnimatePresence` su apertura/chiusura pannello.
- **Sostituibile con:** `max-height` + `opacity` transition (overflow hidden).

## 8.3 — `IOSInstallPrompt` / `IOSInstallTutorial` (animazioni one-shot)

- **Path A:** `components/pwa/IOSInstallPrompt.tsx:7`
- **Path B:** `components/pwa/IOSInstallTutorial.tsx:4`
- **Cosa fanno:** fade-in al mount + slide leggero.
- **Sostituibile con:** CSS keyframes o `view-transition-api`.

---

# BLOC-9 — Bundle: html2canvas / onnxruntime / cropper / image-compression

## 9.1 — `html2canvas` import statico in `BugReportButton`

- **Path A:** `components/dev/BugReportButton.tsx:6` → `import html2canvas from 'html2canvas'` (**statico**)
- **Path B:** `components/dev/CardMascotte.tsx:1305-1325` → `(await import('html2canvas')).default` (già dynamic, OK)
- **Effetto osservato:** BugReportButton è un dev tool ma se montato lato client in produzione (verificare) entra nel chunk iniziale.
- **Bundle:** ~60-100 kB gz.
- **Alternativa server-side (opzionale):** sostituibile con backend puppeteer/playwright al submit del bug report.

## 9.2 — `react-advanced-cropper` pesante

- **Path:** `components/feature/aste/create/MobileCardCropper.tsx:4-5` (statico + CSS)
- **Bundle:** ~80-120 kB gz + CSS.
- **Alternativa 1 (più leggera):** `react-easy-crop` (già in package.json, non usato) → ~30 kB gz, drop-in.
- **Alternativa 2 (server-side):** spedire immagine originale al desktop via WebSocket/QR, crop lato desktop.

## 9.3 — `onnxruntime-web` + bootstrap ad ogni mount

- **Path:** `hooks/useBrxScanner.ts:9` (type-only), `:278` (dynamic, OK)
- **Worker:** `hooks/scannerEmbed.worker.ts:6` (`import * as ort from 'onnxruntime-web'`)
- **Bundle ORT WASM:** ~1.1 MB minified (ort.min.js + ort-wasm*.wasm, già copiati in `public/ort-wasm/` da `scripts/copy-ort-wasm.mjs`).
- **Sub-problemi:**
  - Modello DINOv2 224×224 → 5-30 MB scaricato ad ogni mount del wizard.
  - `InferenceSession.create` + warmup rieseguito ad ogni mount.
  - `postinstall: "node scripts/copy-ort-wasm.mjs"` indica consapevolezza del peso.

## 9.4 — `browser-image-compression` import statico

- **Path A:** `lib/api/auction-photo-client.ts:16` (statico)
- **Path B:** `lib/auction-pairing-guest-upload.ts:12` (statico)
- **Bundle:** ~25-35 kB gz.
- **Sub-problemi:**
  - `useWebWorker: false` → re-encode WebP blocca main thread.
  - `sha256Hex` (`auction-photo-client.ts:133-168`) su buffer binario client-side.
  - Stessa pipeline in `lib/auction-pairing-guest-upload.ts:18-37, 174-180, 270`.
  - Inutilità di SHA-256 prima di PUT se backend accetta checksum opzionale.

---

# BLOC-10 — Bundle: axios / zod / country-flag-icons / qrcode

## 10.1 — `axios` per il solo refresh-token interceptor

- **Path:** `lib/api/auth-client.ts:11` (multi-import runtime)
- **Path:** `lib/api/auth-error.ts:6` (type-only, cancellato in build)
- **Bundle:** ~13-15 kB gz.
- **Nota:** `lib/api/refresh-token.ts:89-95` usa già `await import('./auth-client')` per evitare cicli → pattern replicabile.

## 10.2 — `zod` 9 file con validazione statica

- **Path A:** `lib/registrati/schema.ts:6` (schema riusato client+server)
- **Path B:** `lib/validations/auth.ts:1`
- **Path C-I (form client):** `components/feature/registrati/registrati-form.tsx:5`, `registrati/indirizzo-form.tsx:5`, `registrati/account-form.tsx:5`, `components/feature/registrati/RegistratiDemoForm.tsx`
- **Path D-F:** `components/feature/account/CreditoContent.tsx:7`, `components/feature/account/SicurezzaContent.tsx:21`, `app/login/verify-mfa/page.tsx:15`, `components/feature/login/recupera-credenziali-form.tsx:7`
- **Bundle:** ~14 kB gz (zod 3) / ~50 kB gz (zod 4).
- **Decisione governance (confermata):** validazione DOPPIA. Server obbligatorio; client resta per UX immediata.
- **Variante leggera client:** se gli schemi diventano grossi, valutare `zod/v4-mini` o validazione inline leggera.

## 10.3 — `country-flag-icons` 19 import inline

- **Path:** `lib/card-language-flag-icons.tsx:2-19` (19 import espliciti di componenti 3x2)
- **Path propagato:** `components/feature/registrati/RegistratiDemoForm.tsx:19` (via `lib/auction/country-flag`)
- **Bundle:** ~30-60 kB gz.
- **Effetto osservato:** incluso in molte pagine prodotto/dettaglio (bandiere lingua carta).

## 10.4 — `qrcode.react` 5 import statici

- **Path A:** `components/feature/aste/create/wizard/AuctionCreatePhoneQrModal.tsx:3`
- **Path B:** `components/feature/vendi/singles/SellSingleWizard.tsx:6`
- **Path C:** `components/layout/HamburgerMenu.tsx:27` (anche framer-motion)
- **Path D:** `components/feature/aste/create/PhotoPairingInlinePanel.tsx:3`
- **Path E:** `components/feature/aste/AuctionQrButton.tsx:13`
- **Bundle:** ~5-8 kB gz. `HamburgerMenu` contribuisce al chunk iniziale.

---

# BLOC-11 — Componenti SC-eligible oggi `'use client'`

## 11.1 — Componenti puramente presentational in `/product/detail`

- **Path A:** `components/feature/product/detail/ReprintCardPreview.tsx` (39 righe, solo `<Image>` + `<div>`)
- **Path B:** `components/feature/product/detail/MobileChartKpiRow.tsx` (23 righe, solo props + `<span>`)
- **Path C:** `components/feature/product/detail/MobileCardGeneralInfo.tsx` (62 righe, solo props + `<Link>`)
- **Verifica da fare:** se non usano hook/handler, rimuovere `'use client'`. I `<Link>` di `next/link` non richiedono client.

## 11.2 — Componenti puramente presentational in `/ordini` e `/account`

- **Path A:** `components/feature/ordini/OrdersPageHeader.tsx` (82 righe, solo `AppBreadcrumb` + `<Link>`)
- **Path B:** `components/feature/ordini/OrdersEmptyState.tsx` (40 righe, solo `<Link>` e JSX)
- **Path C:** `components/feature/ordini/OrderBadges.tsx` (119 righe, solo `<span>`/`Icon`)
- **Path D:** `components/feature/account/AccountBreadcrumb.tsx` (41 righe, solo `useTranslation()`)
- **Bundle stimato:** ~10-15 KB cumulato.

---

# BLOC-12 — Account pages: dynamic import + pre-fetching

> Decisione governance (confermata): TUTTE le pagine `/account/*` dietro `dynamic({ ssr: false })`.

## 12.1 — Lista pagine `/account/*` candidate a `dynamic({ ssr: false })`

- `app/account/page.tsx` (dashboard)
- `app/account/oggetti/page.tsx` (con `OggettiContent` ~1126 righe — la più pesante)
- `app/account/credito/page.tsx`
- `app/account/transazioni/page.tsx`
- `app/account/downloads/page.tsx`
- `app/account/coupon/page.tsx`
- `app/account/sincronizzazione/page.tsx`
- `app/account/messaggi/page.tsx`
- `app/account/indirizzi/page.tsx`
- `app/account/profilo/page.tsx`
- `app/account/statistiche/page.tsx`
- `app/account/aste-salvate/page.tsx`
- `app/account/lista-desideri/page.tsx`
- `app/account/sicurezza/page.tsx`
- `app/account/impostazioni/page.tsx` (e sottopagine `email`, `lingua`, `paesi-spedizione`, `utenti-bloccati`)
- **Pattern di riferimento (positivo):** `app/aste/nuova/page.tsx` (già fatto con `MascotteLoader`).
- **Da ispezionare caso per caso:** quali di queste hanno già pre-fetching SC; alcune sono SC ma senza pre-fetch (vedi BLOC-5).

---

# BLOC-13 — Pattern vietati `useEffect + fetch + setState`

> Violazione diretta di CLAUDE.md §2.

## 13.1 — `app/search/user/page.tsx`

- **Path:** `app/search/user/page.tsx`
- **Sub-problemi:**
  - 2 `useEffect` con fetch manuale (debounce 250ms + fetch utenti).
  - 7 `useState`.
  - Dopo hydration, 0 risultati finché l'utente non digita ≥2 caratteri.
- **Refactoring target:** `useQuery` (React Query) + `useDeferredValue`.

## 13.2 — `ScambiProponiModal.tsx` doppio waterfall

- **Path:** `components/feature/scambi/ScambiProponiModal.tsx:597`
- **Sub-problemi:**
  - `loadInventory` (riga 597) fa `do/while { await syncClient.getInventory(...) }` per paginare l'inventario.
  - Poi `await fetchCardsByBlueprintIds(blueprintIds)` dopo l'ultima pagina (sequenziale).
  - Per carte con `blueprint_id` noto fin dalla prima pagina, il fetch Meili potrebbe partire in parallelo.

## 13.3 — `OggettiTable.tsx` poll sync 1-by-1

- **Path:** `components/feature/account/oggetti/OggettiTable.tsx:116-144`
- **Sub-problema:** poll seriale di un sync task (`getTaskStatus`) ad intervallo fisso. Stesso pattern di `OggettiContent.tsx:235-246` (`pollTaskUntilReady`).

---

# BLOC-14 — Anti-pattern minori

## 14.1 — Mock price-history + chart ridisegnato

- **Path A:** `components/feature/product/ProductPriceChart.tsx:213-315` (`ProductPriceChart`)
- **Path B:** `lib/product-detail/build-price-history-points.ts:17-43` (`buildPriceHistoryPoints`)
- **Sub-problemi:**
  - Genera ~95 punti (3 anni / step 12) con `Math.sin × 2` + `prng × 2` ad ogni `useMemo([slug])`.
  - `onSvgMove` (riga 339): `for` lineare sui `visiblePoints` per ogni `mousemove` senza `requestAnimationFrame` throttling.
  - `ProductDetailView.tsx:539-563` (`defaultTrendStats`): riesegue `buildPriceHistoryPoints(slug)` come fallback se `chartStats` non è pronto → doppio lavoro.

## 14.2 — `useProductReprints` con `cache: 'no-store'`

- **Path:** `lib/hooks/use-product-reprints.ts:8-24`
- **Sub-problema:** `fetch('/api/reprints?card_id=...', { cache: 'no-store' })` → ristampe identiche rifetche ad ogni mount. `app/api/reprints/route.ts` non imposta `Cache-Control`.

## 14.3 — `SearchResultsTable` doppio `.map()` desktop+mobile

- **Path:** `components/feature/search/SearchResultsTable.tsx:90-202, 209-336`
- **Sub-problema:** stessa lista `hits` mappata due volte (desktop table + mobile list) nel JSX. Solo uno dei due rami è visibile, ma entrambi eseguiti.

---

# Note finali per l'esecuzione

- **Vincoli architetturali invariati** (da CLAUDE.md):
  - Mai chiamare microservizi dal browser. Tutto passa da `app/api/*/route.ts`.
  - React Query obbligatorio per data fetching.
  - i18n sincrono, 6 lingue allineate (`npm run i18n:keys`).
  - TypeScript strict (no `any`, no `@ts-ignore`).
  - `next/image` per immagini remote; `<img>` raw solo per `data:`/`blob:` con `eslint-disable`.
- **Prima di chiudere ogni blocco**: `npm run typecheck` + `npm run lint` + (se i18n toccato) `npm run i18n:keys`.
- **Test**: `npm run test` (Vitest). I test `bff-security` hanno 2 failure noti da decisione di policy (CLAUDE.md sezione "Trappole note").
- **Quando un blocco tocca `app/api/*`**: ricordare `noStoreHeaders()`, rate limit, cookie-first auth, timeout (`PROXY_TIMEOUT_MS`).
- **Quando un blocco tocca React Query**: assicurarsi che la cache key sia invalidata correttamente dopo mutation.

EOF
