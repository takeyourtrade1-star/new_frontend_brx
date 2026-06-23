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
> 🛑 **Passo 2-3 NON mechanical:** camera e scan loop condividono stato
> bidirezionale (`state` settato da entrambi, `stopScanning` coordina camera+loop+
> countdown, `openCamera`/`restartScanning` resettano refs del loop). Splittarli =
> ricucire `setState`/reset tra hook = **ristrutturazione**, non move. Su feature
> core senza rete di test, verificabile solo a runtime → rischio regressione
> silenziosa alto. Raccomandazione: NON procedere a 2-3 senza (a) smoke-test
> runtime del passo 1, o (b) test scanner del Piano 08 come rete.

---

## 1.2 Split `AsteDetailView` (1018 righe)

**File:** `components/feature/aste/AsteDetailView.tsx`

Estrarre:

- `lib/auction/calendar.ts` → logica generazione `.ics` e Google Calendar URL (oggi inline L296-336)
- `hooks/aste/useProxyBidding.ts` → logica `openProxyModal`, `stopProxyBidding`, `increaseProxyLimit` (L407-461)
- `hooks/aste/useAuctionSaved.ts` → logica salvataggio asta
- `<AuctionHeader>`, `<AuctionSimilarCards>` → componenti puramente presentazionali

Mantenere in `AsteDetailView` solo composition + WebSocket + fetch.

---

## 1.3 Split `ProductDetailView` (1144 righe)

**File:** `components/feature/product/ProductDetailView.tsx`

Estrarre:

- `hooks/useProductMarketplaceListings.ts` → listings con data, loading, error, refetch
- `hooks/useProductAuctions.ts` → aste correlate
- `hooks/useProductFilters.ts` → filtri con `useReducer`
- 5 tab diventano presentational, leggono da context locale

Rimuovere la duplicazione di `handleOwnerQtyDelta` con `OggettiContent`.

---

## 1.4 Split `OggettiContent` (1126 righe)

**File:** `components/feature/account/OggettiContent.tsx`

Estrarre:

- `hooks/useInventoryTable.ts` → data, mutazioni, bulk actions
- `hooks/useInventoryExport.ts` → export CSV
- `hooks/useInventorySync.ts` → sync marketplace
- `<OggettiHeader>`, `<OggettiToolbar>`, `<OggettiBulkActions>` componenti

---

## 1.5 Split `SellSingleWizard` (1097 righe)

**File:** `components/feature/vendi/singles/SellSingleWizard.tsx`

Estrarre:

- `hooks/useSellSinglePhotos.ts` → gestione upload + QR + abort
- Verificare accoppiamento di `<SellSinglePhotoStep>`, `<SellSingleDetailsStep>`, `<SellSingleReviewStep>`, `<SellSingleConfirmStep>` (già esistono)

---

## 1.6 Split `TopBar` e `HamburgerMenu` (826 + 762 righe)

**File:** `components/layout/TopBar.tsx`, `components/layout/HamburgerMenu.tsx`

Azioni:

- Estrarre `hooks/useClickOutside(ref, onClose)` (DRY per 4 menu copy-pasted in TopBar)
- Estrarre `<HeaderMenu variant="account|vendi|games|acquisti">` in TopBar
- `<HamburgerMenu>` → splittare in `<DrawerLanguage>`, `<DrawerAuth>`, `<DrawerNavigation>`, `<DrawerTheme>`

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

---

## Criteri di accettazione

- Nessun file `.tsx`/`ts` superiore a 600 righe (eccetto `i18n/messages/*.ts` e store con `partialize`)
- Ogni hook estratto ha almeno un test unit
- `npm run typecheck` e `npm run lint` restano a 0 errori dopo ogni step
