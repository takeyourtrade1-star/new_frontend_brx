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

> ⚠️ **Correzione (verifica codebase 2026-06-23):** il file NON è importato solo
> dal wardrobe panel. Ha 4 importer: `CardMascotte.tsx`, `card-mascotte/WardrobePanel.tsx`,
> `card-mascotte/infer-bug-category.ts`, `card-mascotte/CardMascotteWidget.tsx`.
> Il lazy-load "solo all'apertura del panel" non è banale: vanno separati i **tipi**
> (`Category`, `FaceColorId`, `WardrobeItem`) e le costanti leggere (`FACE_COLOR_OPTIONS`)
> dai **dati pesanti** (SVG), tenendo i primi import statici. Da fare con attenzione,
> non eseguito in questo passaggio.

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
