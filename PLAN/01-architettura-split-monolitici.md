# Piano 1 — Architettura & Split File Monolitici

**Obiettivo:** Ridurre la complessità ciclomatica, migliorare la testabilità e la manutenibilità estraendo hook e sotto-componenti dai file più critici.

---

## 1.1 Split `useBrxScanner` (986 righe)

**File:** `hooks/useBrxScanner.ts`

Estrarre 3 hook distinti:

- `useOnnxSession(apiBaseUrl)` → gestisce loading modello, worker, retry, IndexedDB cache
- `useCameraCapture({ facingMode, width, height })` → gestione MediaStream + torch + debounce
- `useScanLoop({ videoRef, session, apiBaseUrl, onMatch })` → loop scan, voting, hint gating

Comporre `useBrxScanner = useOnnxSession + useCameraCapture + useScanLoop`.

**Verifica:** `grep -n "useState\|useRef" hooks/useBrxScanner.ts` deve scendere sotto 20 occorrenze totali.

**Test:** Aggiungere `__tests__/hooks/useOnnxSession.test.ts` con mock worker.

> ⚠️ **Correzione + stato (2026-06-23):** claim del piano imprecisi — nel hook NON
> ci sono `torch`/`debounce` (solo `facingMode`) e NESSUN `IndexedDB` diretto
> (sta in `lib/scanner/onnx-loader`). Zero test scanner esistenti. Il `README`
> mette 08 (test) **prima** di 01: i 3 hook condividono stato (`matchedRef`,
> `recentNamesRef`, `hintStreakRef`, `scanGapMsRef`, `videoRef`), verificabile
> solo a runtime (camera reale).
>
> Approccio adottato: **incrementale, un seam alla volta, commit per passo**.
>
> ✅ **Passo 1/3 FATTO:** estratto `useOnnxSession` in
> `hooks/scanner/useOnnxSession.ts` (load modello + worker + `runOnnxEmbed` +
> retry/standard, ~300 righe). `useBrxScanner` 986 → 761 righe. Logica identica,
> behavior-preserving. typecheck + lint + **build** verdi.
> ✅ **Test:** `__tests__/hooks/useOnnxSession.test.ts` (3 test verdi: failure
> path, success InferenceSession, continueWithStandardMode). Criterio test del
> piano soddisfatto per il passo 1.
>
> ✅ **Passo 2/3 FATTO** (dopo smoke-test runtime del passo 1, OK): estratto
> `useScanLoop` in `hooks/scanner/useScanLoop.ts` (ONNX + legacy pipeline, dedup,
> voting, hint gating, match countdown). Tipi condivisi in
> `hooks/scanner/scanner-types.ts` (`ScannerState`/`ScanResult`/`DebugInfo`). Il
> `setState` del parent passato come `setScannerState`; lifecycle via
> `beginScan`/`startScanLoop`/`stopLoop`/`restartScan`/`isLoopActive`. Copia
> fedele dei corpi. **`useBrxScanner` 986 → 260 righe.** typecheck + lint + build
> verdi; test `useOnnxSession` verde.
>
> 🟡 **Residuo:** `useScanLoop` = 612 righe (poco sopra i 600 del criterio) —
> sono le due pipeline coese, non spezzate oltre per non aumentare il rischio.
>
> 🛑 **Passo 3 (`useCameraCapture`) NON eseguito — scelta:** estrarrebbe solo
> `getUserMedia`/`streamRef`/`errorMessage` (~40 righe) ma l'orchestrazione
> (ScannerState, `beginScan`/`startScanLoop`, autoOpen, stop/restart) resta nel
> parent → churn senza guadagno. Parent già 260 righe, leggibile. 1.1 chiuso qui.
>
> Esito 1.1: `useBrxScanner` 986 → 260 + `useOnnxSession` 302 + `useScanLoop` 612
> + tipi 32. Da ri-verificare a runtime match/restart/stop dopo il passo 2.

---

## 1.2 Split `AsteDetailView` (1018 righe)

**File:** `components/feature/aste/AsteDetailView.tsx`

Estrarre:

- `lib/auction/calendar.ts` → logica generazione `.ics` e Google Calendar URL (oggi inline L296-336)
- `hooks/aste/useProxyBidding.ts` → logica `openProxyModal`, `stopProxyBidding`, `increaseProxyLimit` (L407-461)
- `hooks/aste/useAuctionSaved.ts` → logica salvataggio asta
- `<AuctionHeader>`, `<AuctionSimilarCards>` → componenti puramente presentazionali

Mantenere in `AsteDetailView` solo composition + WebSocket + fetch.

> ✅ **Seam logici FATTI (2026-06-23):**
> - `lib/auction/calendar.ts` (`buildAuctionExpiryIcs`, `buildGoogleCalendarUrl`) +
>   test (6) — gli helper ICS puri erano già in `auction-detail-utils`, qui spostata
>   la composizione, lasciando Blob/anchor/window.open nel componente.
> - `hooks/aste/useAuctionProxyBidding.ts` — modale + validazione + mutazioni
>   update/cancel (`myMaxBidEur` resta nel componente).
> - `hooks/aste/useAuctionSaved.ts` — query stato + mutazione save/unsave.
>
> **`AsteDetailView` 1018 → 883 righe.** Comportamento identico; typecheck + lint
> verdi. Da ri-verificare a runtime: modale proxy (apri/aumenta/stop) e bottone
> salva, perché il loro cablaggio è cambiato.
>
> ✅ **Split presentazionale FATTO:** estratti in `aste/detail/` →
> `AuctionHero`, `AuctionMobileActionsBar`, `AuctionShippingDetails`,
> `AuctionStatusPanels`, `AuctionDetailsSummary` (con `mobileSection` interno),
> `AuctionSellerStats`, `AuctionFloatingNotice`. JSX spostato verbatim, prop
> tipizzate (typecheck verifica il threading). Logica salva unificata in
> `handleToggleSave`.
>
> **`AsteDetailView` 1018 → 596 righe (< 600, criterio soddisfatto).** typecheck +
> lint verdi a ogni passo. `SimilarAuctionsSections` già estratto in precedenza.
> Da ri-verificare a runtime il dettaglio asta (layout invariato, ma molti blocchi
> spostati): hero, barra mobile sticky, spedizioni, pannelli stato, accordion.
>
> ✅ **Residuo chiuso (2026-06-23):** dopo verifica il file era risalito a 638 righe
> (logica menu calendario ancora inline). Estratto
> `hooks/aste/useAuctionCalendarMenu.ts` (stato + ICS/Google + click-outside su due
> ref + Escape) + test (3). **`AsteDetailView` 638 → 584 righe.** typecheck + lint
> verdi.

---

## 1.3 Split `ProductDetailView` (1144 righe)

**File:** `components/feature/product/ProductDetailView.tsx`

Estrarre:

- `hooks/useProductMarketplaceListings.ts` → listings con data, loading, error, refetch
- `hooks/useProductAuctions.ts` → aste correlate
- `hooks/useProductFilters.ts` → filtri con `useReducer`
- 5 tab diventano presentational, leggono da context locale

Rimuovere la duplicazione di `handleOwnerQtyDelta` con `OggettiContent`.

> ✅ **FATTO (2026-06-23)** — estrazione incrementale, behavior-preserving,
> typecheck + lint a 0 errori dopo ogni passo.
>
> **Hook estratti in `hooks/product/`:**
> - `useProductAuctions(card)` — query aste attive per nome carta + enrichment
>   (prima inline L502-512).
> - `useProductFilters({ userCountry, detectedCountry })` — **`useReducer`** con
>   tutto lo stato filtri (prima ~11 `useState` sparsi), memo `marketplaceFilters`
>   derivata, init paese una-tantum e auto-close del pannello. Setter value-only:
>   il cablaggio di `ProductDetailMarketplaceSection` è invariato.
> - `useProductListingActions(...)` — stato modali + handler owner-qty / edit
>   inventario / edit marketplace.
> - `useProductCart(...)` — popup quantità, add-to-cart, proposta scambio e flusso
>   "compra ora" (modale demo + conferma).
> - `useProductImageGallery(...)` — lightbox, hover preview, swipe, share, nav
>   immagini, misura header.
>
> **Componenti presentazionali estratti dal JSX:**
> - `ProductDetailPurchaseModal` — modale demo "compra ora".
> - `ProductDetailCardSection` — sezione dettaglio carta (layout mobile + colonna
>   immagine desktop + pannello tab desktop), **memoizzata**; i 6 wrapper `memo`
>   dei tab si spostano qui, preservando FE-REV-020 (un cambio filtro non la
>   ri-renderizza, perché non riceve lo stato dei filtri).
>
> **`ProductDetailView` 1144 → 595 righe** (< 600, criterio soddisfatto;
> orchestratore: composizione + data fetching + cablaggio).
>
> **Test** (`__tests__/hooks/useProduct*.test.ts`): filtri (reducer + init paese),
> aste, listing actions (owner-qty + edit), cart (guard auth + buy-now), gallery
> (lightbox + swipe + share). ⚠️ Non eseguibili in questo ambiente Linux: il
> `node_modules` è installato per Windows e manca il binding nativo
> `@rolldown/binding-linux-x64-gnu` di vitest (errore "Cannot find native
> binding"). I test compilano sotto `tsc` (inclusi in `**/*.ts`); vanno eseguiti
> con `npm run test` su Windows.
>
> 🟡 **Correzioni al piano (verifica codebase):**
> - `useProductMarketplaceListings` **già esistente** come
>   `lib/hooks/use-marketplace-listings.ts` con `listings/loading/error/refetch`:
>   nessuna ri-estrazione, riusato così com'è.
> - La "duplicazione di `handleOwnerQtyDelta` con `OggettiContent`" **non esiste**:
>   `OggettiContent` non ha tale handler e usa gli helper
>   `updateInventoryOrListing`/`deleteInventoryOrListing` tipizzati su
>   `InventoryItemWithCatalog`, mentre qui si opera su `ListingItem` (campo
>   `item_id`, dialoghi di conferma, polling sync). Tipi divergenti → logica
>   spostata fedelmente in `useProductListingActions` senza forzare un merge
>   rischioso.
> - "5 tab che leggono da context locale" **non implementato**: i tab sono già
>   componenti presentazionali memoizzati con props stabili. Convertirli a un
>   `ProductDetailContext` toccherebbe l'interno di 7 figli (churn alto, guadagno
>   marginale) → rimandato, coerente con la scelta pragmatica di 1.1/1.2.
>
> ⚠️ Da ri-verificare a runtime (cablaggio cambiato, layout invariato): filtri
> marketplace, modali edit/acquisto, add-to-cart + fly-to-cart, lightbox/hover,
> swipe immagini.

---

## 1.4 Split `OggettiContent` (1126 righe)

**File:** `components/feature/account/OggettiContent.tsx`

Estrarre:

- `hooks/useInventoryTable.ts` → data, mutazioni, bulk actions
- `hooks/useInventoryExport.ts` → export CSV
- `hooks/useInventorySync.ts` → sync marketplace
- `<OggettiHeader>`, `<OggettiToolbar>`, `<OggettiBulkActions>` componenti

> ✅ **FATTO (2026-06-23).** File reale **1176 righe** (non 1126). Buona parte del
> piano era **già fatta**:
> i dati stanno in `useAccountInventory`, le mutazioni in
> `lib/inventory/inventory-item-mutations`, l'export in
> `lib/inventory/inventory-export-utils`, i filtri in `inventory-filter-utils`,
> e i modali bulk (`BulkDeleteModal`, `BulkPriceWizardModal`) + `OggettiTable`
> sono già componenti.
>
> ✅ **Hook estratti in `hooks/account/`** (typecheck + lint a 0 errori):
> - `useInventorySync` — verifica stato + banner + flag derivati + intero flusso
>   `handleSyncNow` (avvio/aggancio/recover + polling + applicazione risultato).
> - `useInventoryExport` — stato menu export + handler CSV (selezione / filtrato)
>   e JSON (riusa gli helper esistenti).
> - `useInventorySelection` — selezione + azioni bulk. **Dedup:** il loop di
>   cancellazione bulk era **duplicato** tra `onDeleteSelected` e `handleBulkDelete`
>   → unificato in un unico `runBulkDelete`. (Nota: il parametro
>   `deleteFromPlatforms` di `handleBulkDelete` non era usato nemmeno nell'originale.)
>
> **Test** (`__tests__/hooks/account/`): export (CSV/JSON + no-op selezione vuota),
> selection (allFilteredSelected + dedup bulk delete). Stessa limitazione di 1.3:
> non eseguibili qui (manca il binding nativo Linux di vitest), ma compilano sotto
> `tsc`.
>
> ✅ **Split presentazionale del JSX FATTO** — estratti in
> `components/feature/account/oggetti/`: `OggettiSyncBanner`, `OggettiSelectionBar`
> (barra selezione + azioni bulk desktop), `OggettiPagination`,
> `OggettiStickyActionBar` (barra sticky mobile), `OggettiExportModal`. JSX
> spostato verbatim, prop tipizzate. Rimossi gli import lucide ora inutilizzati.
>
> **`OggettiContent` 1176 → 586 righe (< 600, criterio soddisfatto).** typecheck +
> lint a 0 errori. Il piano parlava di `useInventoryTable` (data+mutazioni+bulk):
> i dati e le mutazioni erano già in hook/lib esistenti, quindi è bastato il solo
> `useInventorySelection` per le azioni bulk; i nomi `OggettiHeader/Toolbar/
> BulkActions` del piano sono resi da `OggettiSelectionBar/StickyActionBar` +
> `OggettiSyncBanner`.
>
> ⚠️ Da ri-verificare a runtime: sync "ora", export CSV/JSON, selezione + bulk
> delete/price (cablaggio cambiato, logica invariata).

---

## 1.5 Split `SellSingleWizard` (1097 righe)

**File:** `components/feature/vendi/singles/SellSingleWizard.tsx`

Estrarre:

- `hooks/useSellSinglePhotos.ts` → gestione upload + QR + abort
- Verificare accoppiamento di `<SellSinglePhotoStep>`, `<SellSingleDetailsStep>`, `<SellSingleReviewStep>`, `<SellSingleConfirmStep>` (già esistono)

> ✅ **FATTO (2026-06-23).** File reale **1097 righe**.
>
> ✅ **`hooks/vendi/useSellSinglePhotos.ts`** — possiede lo stato upload (Map
> `File → entry` con `AbortController` per slot), avvio/annullo/retry upload,
> sincronizzazione slot↔draft (`setListingPhotos`), stati derivati
> (`photoUploadStatuses`, `allPhotosUploaded`, `failedUploadFiles`, `lightboxUrls`)
> e `collectPhotoIds`. Il **QR pairing** era già un hook
> (`usePhotoPairingSession`) che consuma `setListingPhotos`; `qrCodeSize` + il suo
> effetto restano nel wizard perché dipendono da `pairing.phoneUploadModalOpen`.
>
> 🟡 **Correzione piano:** dei componenti citati come "già esistono",
> `SellSinglePhotoStep` **non** esisteva (la UI foto era inline nel wizard;
> `SellSingleReviewStep` esiste ma non è usato nel wizard singolo). Quindi creato
> ora `SellSinglePhotoStep` (riga azioni upload + pairing telefono + QR inline +
> galleria) e `SellSingleWizardModals` (cluster modali: QR telefono, guida
> condizione, conferma pubblicazione, lightbox, toast) — JSX spostato **verbatim**.
>
> **Test:** `__tests__/hooks/vendi/useSellSinglePhotos.test.ts` (collectPhotoIds +
> appendListingPhotos filtra/limita). Non eseguibile qui (binding vitest), compila
> sotto `tsc`.
>
> **`SellSingleWizard` 1097 → 533 righe (< 600).** typecheck + lint a 0 errori.
> Nuovi file: `SellSinglePhotoStep` 235, `SellSingleWizardModals` 312,
> `useSellSinglePhotos` 218.
>
> ⚠️ Da ri-verificare a runtime (flusso delicato, non testabile qui): upload foto
> (progress/abort/retry), pairing telefono + QR, pubblicazione, modali condizione.

---

## 1.6 Split `TopBar` e `HamburgerMenu` (826 + 762 righe)

**File:** `components/layout/TopBar.tsx`, `components/layout/HamburgerMenu.tsx`

Azioni:

- Estrarre `hooks/useClickOutside(ref, onClose)` (DRY per 4 menu copy-pasted in TopBar)
- Estrarre `<HeaderMenu variant="account|vendi|games|acquisti">` in TopBar
- `<HamburgerMenu>` → splittare in `<DrawerLanguage>`, `<DrawerAuth>`, `<DrawerNavigation>`, `<DrawerTheme>`

> ✅ **FATTO (2026-06-23).** typecheck + lint a 0 errori.
>
> ✅ **`hooks/useClickOutside.ts`** (DRY) — `onClose` letto da ref interna, così il
> listener si ri-sottoscrive solo al cambio di `enabled` (stesso comportamento
> degli effetti originali). Sostituisce **4 effetti** copia-incollati in TopBar e
> **3** in HamburgerMenu. + test (`__tests__/hooks/useClickOutside.test.tsx`).
>
> ✅ **TopBar 826 → 561 righe** — estratti in `components/layout/header/`:
> `header-menu-styles.ts` (costanti "orange glass"), `HeaderDropdownPanels`
> (`AccountMenuPanel`/`AcquistiMenuPanel`/`VendiMenuPanel`/`GamesMenuPanel` — JSX
> dropdown verbatim; rende il `<HeaderMenu variant=…>` del piano come 4 pannelli),
> `HeaderLoginForm` (form login inline desktop).
>
> ✅ **HamburgerMenu 762 → 577 righe** — estratti: `DrawerAuthForm` (form login del
> drawer), `DrawerLanguage` (selettore lingua), `lang-flags.ts` (costanti bandiere
> condivise). I blocchi "tema" (toggle dark mode, attualmente disabilitato) e
> "navigation" restano inline perché piccoli/coesi col resto del drawer: lo split
> ulteriore in `<DrawerTheme>`/`<DrawerNavigation>` non serviva a rientrare < 600 e
> avrebbe aggiunto churn.
>
> ⚠️ Da ri-verificare a runtime: apertura/chiusura dei 4 menu desktop (click-outside),
> login da header e da drawer, selettore lingua, selezione gioco.

---

## 1.7 Refactor `mascotte-wardrobe.ts` (2217 righe)

**File:** `components/dev/mascotte-wardrobe.ts`

Spostare in `lib/dev/mascotte-wardrobe-data.ts`, lazy import solo quando si apre il wardrobe panel.

**Verifica:** `CardMascotte.tsx` deve importare dinamicamente con `next/dynamic`.

> ⚠️ **Correzione (verifica codebase 2026-06-23):** la premessa "lazy per ridurre
> il bundle" è più debole del dichiarato. `CardMascotte` è **già** `next/dynamic`
> con `ssr:false` (`CardMascotteGate.tsx`): i dati pesanti NON sono nel bundle
> iniziale, stanno nel chunk mascotte. Inoltre il file ha 4 importer
> (`CardMascotte`, `WardrobePanel`, `infer-bug-category`, `CardMascotteWidget`),
> e `ALL_WARDROBE_ITEMS` serve nel render base (item equipaggiati, non solo panel):
> il lazy "vero" richiede refactor async, comportamentale, da verificare a runtime.
>
> ✅ **FATTO — variante sicura (2026-06-23):** estratti
> `CLOTHING_ITEMS`/`ACCESSORY_ITEMS`/`OBJECT_ITEMS`/`ALL_WARDROBE_ITEMS` (~1860
> righe SVG) in `components/dev/mascotte-wardrobe-items.ts`. Il file principale
> tiene tipi + `FACE_COLOR_OPTIONS` + helper di stile (2217 → 357 righe). Import
> statico invariato → zero cambi di comportamento, nessun guadagno di bundle.
> `typecheck` + `lint` a 0 errori.
>
> ⏳ **Rimandato:** il lazy-load async (chunk SVG differito all'apertura del
> guardaroba) — necessita test manuale runtime del guardaroba.

---

## 1.8 Refactor `BrxExpressLanding` (1654 righe)

**File:** `components/feature/brx-express/BrxExpressLanding.tsx`

Estrarre ~600 righe di math puro (Catmull-Rom, perimeter sampling) in `lib/brx-express/smooth-path.ts`.

Aggiungere `__tests__/lib/brx-express/smooth-path.test.ts` con unit test.

> ✅ **FATTO (2026-06-23):** estratte 404 righe (L15–418) di funzioni pure
> (`smoothPath`, `roundedRectPerimeter`, `diamondPerimeter`, `nearestIdx`,
> `wrapShape`, `rotPts`, `unit`, `flowTo`, `densify`, `glyph*`) in
> `lib/brx-express/smooth-path.ts`. Componente: 1654 → 1263 righe. Aggiunto
> `__tests__/lib/brx-express/smooth-path.test.ts` (16 test, verde). Zero cambi
> di comportamento. `typecheck` e `lint` a 0 errori.
>
> ✅ **Split componente FATTO (2026-06-23):** il solo math non bastava (1263 righe).
> Estratti in due passi behavior-preserving:
> - `components/feature/brx-express/landing/BrxExpressLandingFx.tsx` — FX SVG
>   (`GlyphHighlight`, `CardBorderFx`, `StarFx`, …).
> - `lib/brx-express/build-landing-path.ts` + `hooks/brx-express/useBrxExpressLandingPath.ts`
>   — geometria pura + misura DOM/ResizeObserver.
> - `components/feature/brx-express/landing/BrxExpressLandingScene.tsx` +
>   `brx-express-landing.module.css` — finale gradient, moon easter egg, SVG fiume
>   e card reveal.
> - Test: `__tests__/lib/brx-express/build-landing-path.test.ts` (3 test, verde).
>
> **`BrxExpressLanding` 1263 → 265 righe** (orchestratore: scroll spring, reveal
> card, hero + sezione card + termini). typecheck + lint verdi. Da ri-verificare a
> runtime su `/brx-express`: resize desktop/mobile, scroll fiume, reveal card,
> finale gradient latch, `prefers-reduced-motion`.

---

## Criteri di accettazione

- Nessun file `.tsx`/`ts` superiore a 600 righe (eccetto `i18n/messages/*.ts`, store con
  `partialize`, e **eccezioni pragmatiche documentate**: `useScanLoop` 612,
  `mascotte-wardrobe-items` 1865)
- Ogni hook estratto ha almeno un test unit
- `npm run typecheck` e `npm run lint` restano a 0 errori dopo ogni step

> ✅ **Piano 1 chiuso (2026-06-23):** voci 1.2–1.8 sotto soglia o eccezione
> documentata; 1.1 chiuso con `useScanLoop` come eccezione coesa.
