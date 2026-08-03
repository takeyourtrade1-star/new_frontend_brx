# Frontend — Piano interventi post code review (React / UI)

**Data:** 2026-06-22  
**Origine:** code review architetturale frontend (sessione Cursor, scope client-side puro)  
**Perimetro:** `components/`, `lib/hooks/` — **senza** modifiche a `app/api/*`, contratti BFF o shape dati backend  
**Obiettivo:** correggere bug UX, memory leak, re-render eccessivi, stato stale e edge case UI emersi dall'ispezione.

---

## Vincoli assoluti

1. **Zero impatto backend:** nessuna modifica a payload request/response, route handler, hook di fetching verso API.
2. **Solo client-side:** lifecycle React, stato locale, layout, sicurezza DOM, performance render.
3. **Gate qualità per ogni PR:** `npm run typecheck` + `npm run lint` a 0 errori.

---

## Riepilogo per severità

| Severità | Count | Focus |
|----------|-------|-------|
| HIGH | 5 | Performance asta live, memory leak, bug filtri/selezione, menu TopBar |
| MEDIUM | 12 | Stato stale, cleanup timer, stale closure, hook scroll, architettura |
| LOW | 3 | SVG injection pattern, wizard embedded, non-null assertion |

**Totale issue tracciati:** 20 (`FE-REV-001` … `FE-REV-020`)

---

## Fasi e priorità

| Fase | Titolo | Issue | Sforzo stimato | PR suggeriti |
|------|--------|-------|----------------|--------------|
| **P0** | Hotfix UX + leak | 001, 002, 003, 004, 005 | 0.5–1 gg | 1–2 PR |
| **P1** | Asta detail: performance + stato | 006, 007, 008, 009 | 1 gg | 1 PR |
| **P2** | Product detail: edge case + cleanup | 010, 011, 012 | 0.5 gg | 1 PR |
| **P3** | Dev widget + bid panel | 013, 014, 015, 016 | 1 gg | 1 PR |
| **P4** | Inventario + hook condivisi | 017, 018 | 0.5 gg | 1 PR |
| **P5** | Architettura / debito strutturale | 019, 020 | 2+ gg | PR separati |

---

# P0 — Hotfix UX e memory leak

## FE-REV-001 · HIGH · Re-render globale ogni secondo su asta live

| Campo | Valore |
|-------|--------|
| **File** | `components/feature/aste/AsteDetailView.tsx` |
| **File correlati** | `components/feature/aste/detail/AuctionTimerCardMobile.tsx`, `AuctionTimerCardDesktop.tsx`, eventuali consumer di `msLeft` |
| **Problema** | `useNowTick()` al root (~1000 righe) forza re-render dell'intero albero ogni 1s su pagine asta attive. |
| **Soluzione** | Rimuovere `useNowTick` dal parent; calcolare `msLeft` / `countdownIsLong` solo nei figli timer (o in un wrapper `<AuctionCountdown>` memoizzato). Passare `endsAt` invece di `msLeft` come prop. |
| **Verifica** | React DevTools Profiler: re-render limitati ai timer durante countdown live; nessun re-render galleria/bid history ogni secondo. |
| **Dipendenze** | Nessuna |

---

## FE-REV-002 · HIGH · Timer leak su SearchWithInstantSearch

| Campo | Valore |
|-------|--------|
| **File** | `components/layout/search/SearchWithInstantSearch.tsx` |
| **Problema** | `typingTimeoutRef` e `energyDecayRef` non puliti allo smontaggio → `setState` post-unmount se l'utente digita e naviga via. |
| **Soluzione** | Aggiungere `useEffect` con cleanup che fa `clearTimeout` su entrambi i ref. |
| **Verifica** | Digitare nella search bar → navigare subito altrove → nessun warning React "Can't perform a state update on an unmounted component". |
| **Dipendenze** | Nessuna |

---

## FE-REV-003 · HIGH · Filtro paese sovrascritto in ProductDetailView

| Campo | Valore |
|-------|--------|
| **File** | `components/feature/product/ProductDetailView.tsx` |
| **Problema** | Effect su `[user?.country, detectedCountry]` resetta `posizioneVenditore` anche dopo scelta manuale dell'utente. |
| **Soluzione** | Init una tantum con `useRef(countryInitializedRef)`; impostare il default solo al primo valore disponibile. |
| **Verifica** | Cambiare filtro paese manualmente → attendere risoluzione geo/user → filtro resta quello scelto. |
| **Dipendenze** | Nessuna |

---

## FE-REV-004 · HIGH · Selezione bulk incoerente con filtri in OggettiContent

| Campo | Valore |
|-------|--------|
| **File** | `components/feature/account/OggettiContent.tsx` |
| **Problema** | Al cambio `filters` si resetta `currentPage` ma non `selectedIds` → bulk delete/export su item non visibili; contatore fuorviante. |
| **Soluzione** | Nell'effect su `[filters]`: intersecare `selectedIds` con gli ID di `filteredInventoryItems`, oppure `setSelectedIds(new Set())` se product intent = reset totale. |
| **Verifica** | Selezionare item → applicare filtro che li esclude → contatore e azioni bulk coerenti con vista corrente. |
| **Dipendenze** | Nessuna |

---

## FE-REV-005 · HIGH · Menu giochi TopBar senza click-outside

| Campo | Valore |
|-------|--------|
| **File** | `components/layout/TopBar.tsx` |
| **Problema** | `gamesMenuOpen` non ha listener `document.click` come account/acquisti/vendi → menu resta aperto. |
| **Soluzione** | Aggiungere effect speculare con `gamesMenuRef` e cleanup. |
| **Verifica** | Aprire menu giochi → click fuori → menu si chiude. |
| **Dipendenze** | Nessuna |

---

# P1 — Asta detail: performance e stato

## FE-REV-006 · MEDIUM · Stato `thumbStart` ridondante in AsteDetailView

| Campo | Valore |
|-------|--------|
| **File** | `components/feature/aste/AsteDetailView.tsx` |
| **Problema** | `thumbStart` + effect con deps `[imgIdx, thumbStart]` causano render extra; valore derivabile con `useMemo`. |
| **Soluzione** | Sostituire state+effect con `useMemo` da `imgIdx`, `visibleThumbs`, `detailImages.length`. |
| **Verifica** | Navigare thumbnails galleria: stesso comportamento visivo, un render in meno per step (Profiler). |
| **Dipendenze** | Opzionale: combinare con FE-REV-007 nello stesso PR |

---

## FE-REV-007 · MEDIUM · Stato proxy bid non resettato al cambio asta

| Campo | Valore |
|-------|--------|
| **File** | `components/feature/aste/AsteDetailView.tsx` |
| **Problema** | Su cambio `numericId` si resetta `imgIdx`/`thumbStart` ma non `myMaxBidEur`, modale proxy, ref outbid. |
| **Soluzione** | Estendere effect reset: `myMaxBidEur`, `myLastOfferEur`, `proxyModalOpen`, `proxyInput`, `proxyInputError`, `previousProxyBidOutbidRef`. |
| **Verifica** | Navigare da asta A a asta B (client-side): nessun dato proxy/toast dell'asta precedente. |
| **Dipendenze** | Nessuna |

---

## FE-REV-008 · MEDIUM · Accordion mobile clippa contenuto in AsteDetailView

| Campo | Valore |
|-------|--------|
| **File** | `components/feature/aste/AsteDetailView.tsx` (sezione mobile `mobileSection === 'auction'`) |
| **Problema** | `max-h-[300px]` + `overflow-hidden` taglia contenuto lungo senza scroll. |
| **Soluzione** | Stato aperto: `max-h-[70vh] overflow-y-auto`; chiuso: `max-h-0 overflow-hidden`. |
| **Verifica** | Mobile: aprire sezione dettagli asta con riserva + date lunghe → tutto scrollabile. |
| **Dipendenze** | Nessuna |

---

## FE-REV-009 · MEDIUM · `pendingSaveAfterLogin` non annullato alla chiusura modale

| Campo | Valore |
|-------|--------|
| **File** | `components/feature/aste/AsteDetailView.tsx` → `LoginGateModal` |
| **Problema** | Chiudere modale senza login lascia `pendingSaveAfterLogin === true` → save involontario al login successivo via stessa modale. |
| **Soluzione** | In `onClose`: `setPendingSaveAfterLogin(false)` oltre a `setLoginGateOpen(false)`. |
| **Verifica** | Clic "Salva" senza login → chiudi modale → login per offerta → asta non salvata automaticamente. |
| **Dipendenze** | Nessuna |

---

# P2 — Product detail: edge case e cleanup

## FE-REV-010 · MEDIUM · Timeout hover preview senza cleanup

| Campo | Valore |
|-------|--------|
| **File** | `components/feature/product/ProductDetailView.tsx` |
| **Problema** | `handleHoverPreviewClose` usa `setTimeout` in ref senza cleanup allo smontaggio. |
| **Soluzione** | `useEffect` return con `clearTimeout(hoverPreviewTimeoutRef.current)`. |
| **Verifica** | Hover preview → navigazione rapida → nessun warning unmount. |
| **Dipendenze** | Nessuna |

---

## FE-REV-011 · MEDIUM · Swipe touch ignora `clientX === 0`

| Campo | Valore |
|-------|--------|
| **File** | `components/feature/product/ProductDetailView.tsx` → `handleTouchEnd` |
| **Problema** | `if (!touchStartX || !touchEndX)` tratta `0` come assente. |
| **Soluzione** | Controllo esplicito `touchStartX == null \|\| touchEndX == null`. |
| **Verifica** | Swipe galleria partendo dal bordo sinistro dello schermo funziona. |
| **Dipendenze** | Nessuna |

---

## FE-REV-012 · MEDIUM · Crash potenziale su `card.name` assente

| Campo | Valore |
|-------|--------|
| **File** | `components/feature/product/ProductDetailView.tsx` |
| **Problema** | `card.name.toUpperCase()` se `card` esiste ma `name` è null/undefined. |
| **Soluzione** | Optional chaining: `card?.name?.trim() ? card.name.toUpperCase() : fallback`. |
| **Verifica** | Pagina prodotto con card parziale/null name → render fallback, no crash. |
| **Dipendenze** | Nessuna |

---

# P3 — Dev widget, bid panel, search

## FE-REV-013 · MEDIUM · Stale closure in `AuctionBidPanel.executeBid`

| Campo | Valore |
|-------|--------|
| **File** | `components/feature/aste/AuctionBidPanel.tsx` |
| **Problema** | `eslint-disable exhaustive-deps` esclude `onSubmitOffer` / `onSubmitMaxBid` → callback parent stale. |
| **Soluzione** | Pattern ref (`onSubmitOfferRef.current = onSubmitOffer`) oppure deps complete senza disable. |
| **Verifica** | Conferma offerta diretta/massima: stato UI parent aggiornato correttamente post-bid. |
| **Dipendenze** | Nessuna |

---

## FE-REV-014 · MEDIUM · Espressioni CardMascotte in conflitto (sigaro vs overlay)

| Campo | Valore |
|-------|--------|
| **File** | `components/dev/CardMascotte.tsx` |
| **Problema** | Effect sigaro forza `'shocked'`; effect overlay sync imposta `'normal'` e lo sovrascrive. |
| **Soluzione** | Unificare catena priorità espressioni includendo `hasCigar`; rimuovere effect sigaro separato. |
| **Verifica** | Equipaggiare `cigar-xl` → espressione resta `shocked` finché equipaggiato. |
| **Dipendenze** | Nessuna |

---

## FE-REV-015 · MEDIUM · Re-bind listener sleep su ogni risveglio (CardMascotte)

| Campo | Valore |
|-------|--------|
| **File** | `components/dev/CardMascotte.tsx` |
| **Problema** | `totalSleepMs` nelle deps dell'effect inattività → teardown/rebind 5 listener document a ogni wake. |
| **Soluzione** | `totalSleepMsRef` per persistenza; rimuovere `totalSleepMs` dalle deps. |
| **Verifica** | Profiler: wake da sleep non re-registra listener; sleep/wake cycle stabile. |
| **Dipendenze** | Opzionale: stesso PR di FE-REV-016 |

---

## FE-REV-016 · MEDIUM · `setTimeout` raw senza cleanup in CardMascotte

| Campo | Valore |
|-------|--------|
| **File** | `components/dev/CardMascotte.tsx` |
| **Problema** | Particelle flip, transizioni chat usano `setTimeout` raw → update post-unmount. |
| **Soluzione** | Migrare a `useTimeouts()` da `lib/hooks/use-timeout-fn.ts`. |
| **Verifica** | Smontare widget durante animazione → nessun warning React. |
| **Dipendenze** | Nessuna |

---

## FE-REV-017 · MEDIUM · Callback `onOpenChange` instabile in SearchWithInstantSearch

| Campo | Valore |
|-------|--------|
| **File** | `components/layout/search/SearchWithInstantSearch.tsx` |
| **Problema** | Effect `[isOpen, onOpenChange]` si riesegue se parent passa funzione inline. |
| **Soluzione** | `onOpenChangeRef` + effect con dep solo `[isOpen]`. |
| **Verifica** | Parent con callback inline: nessuna cascata di notifiche duplicate. |
| **Dipendenze** | Opzionale: stesso PR di FE-REV-002 |

---

# P4 — Inventario e hook condivisi

## FE-REV-018 · MEDIUM · `localStorage` dentro selector Zustand (OggettiContent)

| Campo | Valore |
|-------|--------|
| **File** | `components/feature/account/OggettiContent.tsx` |
| **Problema** | Side effect `localStorage.getItem` nel selector `useAuthStore` → anti-pattern, re-render extra. |
| **Soluzione** | Selector solo `s.accessToken`; fallback localStorage in `useMemo([accessTokenFromStore])`. |
| **Verifica** | Comportamento auth identico; selector puro. |
| **Dipendenze** | Allineabile a Fase B di `fe-refactoring-plan.md` (selector token unificato) |

---

## FE-REV-019 · MEDIUM · Scroll handler senza throttling in useFixedSidebarFooterClamp

| Campo | Valore |
|-------|--------|
| **File** | `lib/hooks/useFixedSidebarFooterClamp.ts` |
| **Problema** | `setStyle` + layout read su ogni scroll/resize → jank su pagine lunghe. |
| **Soluzione** | Coalescenza con `requestAnimationFrame` su scroll/resize/ResizeObserver. |
| **Verifica** | Scroll inventory account: sidebar fluida, nessun frame drop evidente (Performance tab). |
| **Dipendenze** | Nessuna |

---

# P5 — Architettura / debito strutturale

## FE-REV-020 · MEDIUM · Prop drilling estremo in ProductDetailView

| Campo | Valore |
|-------|--------|
| **File** | `components/feature/product/ProductDetailView.tsx` + figli in `components/feature/product/detail/*` |
| **Problema** | Monolite ~1100 LOC passa 20+ props; ogni state change invalida tutti i figli. |
| **Soluzione** | Context locale `ProductDetailUiContext` con slice memoizzate (immagini, marketplace, tab); figli consumano hook `useProductDetailUi()`. |
| **Verifica** | Profiler: cambio tab/filtro non re-renderizza sezioni non correlate (con `memo` sui figli). |
| **Dipendenze** | Consigliato dopo P2; non blocca hotfix |

---

## FE-REV-021 · LOW · `dangerouslySetInnerHTML` su SVG statici (CardMascotteWidget)

| Campo | Valore |
|-------|--------|
| **File** | `components/dev/card-mascotte/CardMascotteWidget.tsx` |
| **Problema** | SVG via `dangerouslySetInnerHTML`; oggi statici, pattern fragile se SVG diventassero user-generated. |
| **Soluzione** | `<img src={data:image/svg+xml,...}>` o componenti SVG React inline. |
| **Verifica** | Rendering mascotte identico; nessun `dangerouslySetInnerHTML` nel widget. |
| **Dipendenze** | Nessuna |

---

## FE-REV-022 · LOW · Wizard embedded non sync su cambio `embeddedCard`

| Campo | Valore |
|-------|--------|
| **File** | `components/feature/aste/create/AuctionCreateWizard.tsx` |
| **Problema** | `stepId`/`draft` init solo al mount; `embeddedCard` lazy/cambiante → wizard stale. |
| **Soluzione** | Effect su `embeddedCard?.id` per reset draft/step quando embedded card cambia. |
| **Verifica** | Cambiare prodotto embedded (se supportato dal flow) → wizard si allinea. |
| **Dipendenze** | Nessuna |

---

## FE-REV-023 · LOW · Non-null assertion `selectedIds!` in OggettiTable

| Campo | Valore |
|-------|--------|
| **File** | `components/feature/account/oggetti/OggettiTable.tsx` |
| **Problema** | `selectedIds!` in render: crash se riuso senza selection props. |
| **Soluzione** | Guard `selectionMode` + helper `isSelected(id)`; niente `!`. |
| **Verifica** | Tabella senza props selection: nessun crash, UI selection assente. |
| **Dipendenze** | Opzionale: stesso PR di FE-REV-004 |

---

# Ordine di esecuzione consigliato

```
P0 (001–005)  ──► merge rapido, massimo impatto utente
       │
       ▼
P1 (006–009)  ──► stesso file AsteDetailView → 1 PR coeso
       │
       ├──► P2 (010–012) ProductDetailView → 1 PR
       │
       ├──► P3 (013–017) bid + mascotte + search ref
       │
       ├──► P4 (018–019) inventario + hook
       │
       └──► P5 (020–023) quando il debito hotfix è chiuso
```

---

# Checklist PR

Per ogni issue chiuso:

- [ ] Fix limitato al perimetro client-side (nessun cambio API)
- [ ] `npm run typecheck` passa
- [ ] `npm run lint` passa
- [ ] Verifica manuale descritta nella sezione **Verifica** dell'issue
- [ ] Aggiornare tabella stato sotto (spuntare ID)

---

# Stato avanzamento

| ID | Severità | Stato | PR / note |
|----|----------|-------|-----------|
| FE-REV-001 | HIGH | ✅ Fatto | Tick isolato in `<AuctionCountdown>`; `useNowTick` rimosso dal parent e da `SimilarAuctionsSections`. **Esteso** alla griglia condivisa `auctions-browse-shared` (leaf `AuctionGridTimerBadge`/`AuctionHmsText`): rimosso `now` da 5 pagine browse/hub |
| FE-REV-002 | HIGH | ✅ Fatto | Cleanup `typingTimeoutRef`/`energyDecayRef` allo smontaggio |
| FE-REV-003 | HIGH | ✅ Fatto | `countryInitializedRef`: default paese impostato una sola volta |
| FE-REV-004 | HIGH | ✅ Fatto | Intersezione `selectedIds` con vista filtrata al cambio filtri |
| FE-REV-005 | HIGH | ✅ Fatto | Aggiunto listener click-outside per `gamesMenuOpen` |
| FE-REV-006 | MEDIUM | ⏭️ Rimandato | `thumbStart` NON derivabile: `AuctionGallery` lo scorre manualmente via frecce su/giù → `useMemo` romperebbe lo scroll thumbnail |
| FE-REV-007 | MEDIUM | ✅ Fatto | Reset esteso a `myMaxBidEur`, `myLastOfferEur`, modale/input proxy, ref outbid |
| FE-REV-008 | MEDIUM | ✅ Fatto | Accordion mobile: `max-h-[70vh] overflow-y-auto` da aperto |
| FE-REV-009 | MEDIUM | ✅ Fatto | `onClose` modale azzera `pendingSaveAfterLogin` |
| FE-REV-010 | MEDIUM | ✅ Fatto | Cleanup `hoverPreviewTimeoutRef` allo smontaggio |
| FE-REV-011 | MEDIUM | ✅ Fatto | Null-check esplicito su `touchStartX`/`touchEndX` |
| FE-REV-012 | MEDIUM | ✅ Fatto | Optional chaining su `card?.name` nel titolo |
| FE-REV-013 | MEDIUM | ✅ Fatto | Ref per callback parent + `translateApiError` memoizzato; rimosso disable ESLint |
| FE-REV-014 | MEDIUM | ✅ Fatto | `hasCigar` unificato in cima alla catena priorità; rimosso effect separato |
| FE-REV-015 | MEDIUM | ✅ Fatto | `totalSleepMsRef`; rimosso `totalSleepMs` dalle deps dell'effect inattività |
| FE-REV-016 | MEDIUM | ✅ Fatto | `setTimeout` raw (flip/confetti/chat/flash/preview) migrati a `useTimeouts()` |
| FE-REV-017 | MEDIUM | ✅ Fatto | `onOpenChangeRef`; effect con dep solo `[isOpen]` |
| FE-REV-018 | MEDIUM | ✅ Fatto | Selector Zustand puro; fallback localStorage in `useMemo`. **Esteso** a `SincronizzazioneContent`, `AuctionCreateCardPicker`, `ScambiProponiModal` (stesso anti-pattern) |
| FE-REV-019 | MEDIUM | ✅ Fatto | Scroll/resize/RO coalescenti via `requestAnimationFrame` |
| FE-REV-020 | MEDIUM | ✅ Fatto | Obiettivo perf raggiunto via `React.memo` sui figli pesanti indipendenti dai filtri (mobile layout, 4 tab, titolo, icon-tab-bar) + props stabilizzate (`useCallback`/`useMemo`). Alias memo a livello modulo: nessuna modifica ai file figli. MarketplaceSection lasciata reattiva ai filtri. Il context `ProductDetailUiContext` (solo riduzione boilerplate) resta polish opzionale |
| FE-REV-021 | LOW | ⏭️ Rimandato | SVG statici/fidati (no XSS oggi); `<img>` data-URI romperebbe animazioni/`currentColor`, parità visiva non verificabile staticamente |
| FE-REV-022 | LOW | ✅ Fatto | Effect su `embeddedCard?.id` riallinea step/draft al cambio card |
| FE-REV-023 | LOW | ✅ Fatto | Helper `isSelected(id)` al posto di `selectedIds!` |

Legenda stato: ⬜ TODO · 🔄 In corso · ✅ Fatto · ⏭️ Rimandato

---

# P6 — Code review 2026-06-23 (gap analysis)

**Origine:** code review strutturata del 2026-06-23 che ha incrociato i piani `fe-frontend-review-plan.md` (P0–P5) e `fe-code-review-plan.md` (CR-001…012). Vengono tracciati **solo i gap reali** (problemi non ancora coperti dalle issue `FE-REV-*` / `FE-CR-*` esistenti o relativi a file/pattern diversi).

**Criteri di inclusione:** issue non presente nei piani esistenti, oppure stesso pattern ma file/severità diversi. Issue già coperte (es. timer leak search → FE-REV-002, token localStorage → FE-REV-018/FE-CR-007) **non** vengono riaperte qui.

| Severità | Count | Focus |
|----------|-------|-------|
| CRITICAL | 1 | XSS `buyNowUrl` non validato |
| HIGH | 7 | ErrorBoundary globale, safeStorage helper, clamp Pagination/ImageLightbox, JSON.parse WS, `€ NaN` carrello, divisione per zero bid |
| MEDIUM | 22 | Date non validate, parsing italiano, race condition, prop drilling, 11 file monolitici, hook riusabili |
| LOW | 4 | `<img alt="">` accessibilità, fallback `STATUS_DOT`, Array.isArray guard |

**Totale gap tracciati:** 34 (`FE-REV-024` … `FE-REV-057`)

---

## P6-A — Sicurezza & Crash (CRITICAL + HIGH)

### FE-REV-024 · CRITICAL · XSS in `href={buyNowUrl}` da backend non validato — ✅ chiuso
| Campo | Valore |
|-------|--------|
| **File** | `lib/auction/safe-buy-now-url.ts`, `lib/auction/auction-adapter.ts`, `components/feature/aste/AuctionBidPanel.tsx` |
| **Problema** | Storico: `buyNowUrl` poteva essere passato direttamente a un link senza validazione dello scheme. |
| **Soluzione applicata** | Il valore attraversa `getSafeBuyNowUrl`, che accetta soltanto URL assoluti HTTP(S); il pannello renderizza il link solo dopo una seconda validazione al confine UI e usa `rel="noopener noreferrer"`. Il backend applica lo stesso vincolo e scarta i valori legacy non sicuri. |
| **Verifica** | `__tests__/lib/safe-buy-now-url.test.ts` copre `javascript:`, `data:`, `vbscript:`, URL relativi e valori vuoti; `auction/tests/test_auction_buy_now_url_security.py` verifica anche il contratto backend. |
| **Dipendenze** | Nessuna; chiuso e coperto da regressione. |

### FE-REV-025 · HIGH · `ErrorBoundary` assente su pagine critiche
| Campo | Valore |
|-------|--------|
| **File** | `app/aste/[id]/page.tsx`, `app/products/[slug]/page.tsx`, `app/scambi/[id]/page.tsx`, `app/scanner/page.tsx`, `app/account/*`, `app/ordini/*`, `app/cart/page.tsx` |
| **Problema** | Solo `app/aste/nuova/page.tsx` ha `<ErrorBoundary>`. Qualsiasi throw in una query children (es. hook su 404/500) → schermata bianca globale. |
| **Soluzione** | Wrappare il top-level component di ogni pagina critica con `<ErrorBoundary>` (riusare componente già presente in `app/aste/nuova/`). |
| **Verifica** | Smoke test: throw forzato in un child mostra fallback UI + CTA "Riprova". |
| **Dipendenze** | Nessuna |

### FE-REV-026 · HIGH · `localStorage` non protetto da try/catch (9+ call site)
| Campo | Valore |
|-------|--------|
| **File** | `components/feature/vendi/singles/SellSingleWizard.tsx:117, 912, 1001`; `components/feature/scambi/ScambiProponiModal.tsx:550`; `components/feature/aste/create/AuctionCreateCardPicker.tsx:119`; `components/feature/aste/create/AuctionCreateWizard.tsx:117`; `lib/auction/aste-view-storage.ts:7, 13` |
| **Problema** | `localStorage.getItem/setItem` senza try/catch. Safari private mode / quota esaurita → throw → schermata bianca. (FE-REV-018 copre il solo `useAuthStore` selector; qui il pattern è più ampio e riguarda la lettura/scrittura diretta.) |
| **Soluzione** | Creare `lib/storage/safeStorage.ts` con `safeGetItem(key)` / `safeSetItem(key, value): boolean`. Sostituire gradualmente i 40+ call site `localStorage.*` in `components/` e `lib/api/*`. |
| **Verifica** | Test in jsdom con `localStorage` mockato per throw; smoke test Safari private mode. |
| **Dipendenze** | FE-REV-026 (helper) è prerequisito per FE-REV-027, FE-REV-028 |

### FE-REV-027 · HIGH · `Pagination` accetta `NaN`/`undefined` in currentPage/totalPages
| Campo | Valore |
|-------|--------|
| **File** | `components/ui/Pagination.tsx:27-31` |
| **Problema** | `NaN <= 1` e `NaN >= 1` sono entrambi `false` → entrambi i bottoni abilitati; click genera URL `/search?page=NaN` → loop. |
| **Soluzione** | `safeCurrent = Number.isFinite(currentPage) && currentPage > 0 ? currentPage : 1`; `safeTotal` analogo. Usare le safe per i confronti e per `prevPage`/`nextPage`. |
| **Verifica** | Passare `NaN`, `undefined`, `-5`, `999999` → bottoni si comportano correttamente. |
| **Dipendenze** | Nessuna |

### FE-REV-028 · HIGH · `ImageLightbox` `urls[startIndex]` può essere `undefined`
| Campo | Valore |
|-------|--------|
| **File** | `components/ui/ImageLightbox.tsx:89` |
| **Problema** | `startIndex` non clampato su `urls.length`. Parent che passa `startIndex=5` con `urls.length=2` → `<img src={undefined}>` rotto. |
| **Soluzione** | `safeIndex = Math.max(0, Math.min(startIndex, total - 1))`; early return `if (!open || total === 0 || !urls[safeIndex]) return null`. |
| **Verifica** | Passare `startIndex=5` con 2 immagini → fallback al primo. |
| **Dipendenze** | Nessuna |

### FE-REV-029 · HIGH · `JSON.parse(event.data)` su WS senza validazione shape

**Stato (2026-08-03):** ✅ chiuso. I frame asta e disputa hanno limite UTF-8, allowlist della shape e binding all'ID della risorsa prima di raggiungere lo stato UI.
| Campo | Valore |
|-------|--------|
| **File** | `components/feature/dispute/DisputeDetailContent.tsx:58` |
| **Problema** | `JSON.parse(...) as {type, data?}` con `!` non-null assertion su `payload.data.id`; shape non validata → corruzione `byId` Map con chiavi `undefined`, possibili duplicati. |
| **Soluzione** | Guard esplicita: `if (parsed?.type !== 'message' || !parsed.data || typeof parsed.data.id !== 'number') return`. Validare anche `m.created_at` (vedi FE-REV-033). |
| **Verifica** | Payload malformato (campi mancanti, `id: 'string'`) → non corrompe stato. |
| **Dipendenze** | FE-REV-033 (date sort) |

### FE-REV-030 · HIGH · `€ NaN` in `CartLineItem` e `CartOrderSummary` su dati corrotti
| Campo | Valore |
|-------|--------|
| **File** | `components/feature/cart/CartLineItem.tsx:32-33`, `components/feature/cart/CartOrderSummary.tsx:71, 89` |
| **Problema** | `(item.priceCents / 100) * item.quantity` se `priceCents` è `null`/`undefined` → `NaN` → `formatEuroNoSpace(NaN, ...)` mostra `"€ NaN"`. |
| **Soluzione** | `price = Number.isFinite(item.priceCents) ? item.priceCents / 100 : 0`; `qty = Number.isFinite(item.quantity) ? item.quantity : 0`. Fallback `<h3>` per `item.title` vuoto. |
| **Verifica** | Riga con `priceCents=null` o `quantity=NaN` → "€ 0,00" e riga "Carta senza titolo", no crash. |
| **Dipendenze** | Nessuna |

### FE-REV-031 · HIGH · Divisione per zero in `AuctionBidModal` su asta senza offerte
| Campo | Valore |
|-------|--------|
| **File** | `components/feature/aste/AuctionBidModal.tsx:379` |
| **Problema** | `((amt - effectiveCurrentBidEur) / effectiveCurrentBidEur) * 100` con `effectiveCurrentBidEur === 0` → `0/0 = NaN` → render `+NaN%`. |
| **Soluzione** | `const pct = effectiveCurrentBidEur > 0 ? ((amt - effectiveCurrentBidEur) / effectiveCurrentBidEur) * 100 : 0`; fallback `pctStr = !Number.isFinite(pct) ? '—' : pct < 1 ? pct.toFixed(1) : Math.round(pct).toString()`. |
| **Verifica** | Asta senza offerte → `+0%` o `—`. |
| **Dipendenze** | Nessuna |

---

## P6-B — Performance & State (MEDIUM)

### FE-REV-032 · MEDIUM · `useShallow` su `useCartStore((s) => s.items)` in 8+ componenti
| Campo | Valore |
|-------|--------|
| **File** | `app/cart/page.tsx:25`, `components/layout/CartDropdown.tsx:25`, `components/layout/HamburgerMenu.tsx:67`, `components/layout/FloatingCartFab.tsx:17`, `components/feature/acquisti/AcquistiContent.tsx:193`, `components/feature/acquisti/CartPreviewSection.tsx:56`, `components/feature/product/ProductDetailView.tsx:184` |
| **Problema** | Aggiungere un item al carrello → 8 re-render dell'intero header. Il selettore ritorna l'array completo, ogni consumer re-renderizza. |
| **Soluzione** | `useCartStore(useShallow((s) => s.items))` + selettori atomici (`itemCount`, `totalCents`, `sellerIds`) dove possibile. Pattern "leaf component" (`<CartItemCountBadge />`) per il badge. |
| **Verifica** | Profiler: aggiungere item → solo `CartDropdown`/`FloatingCartFab` re-renderizzano, `TopBar`/`HamburgerMenu` no. |
| **Dipendenze** | Nessuna |

### FE-REV-033 · MEDIUM · Date non validate in `NotificationBell` / `DisputeDetailContent` / `AuctionBidHistory`
| Campo | Valore |
|-------|--------|
| **File** | `components/feature/notifiche/NotificationBell.tsx:52-61`, `components/feature/dispute/DisputeDetailContent.tsx:113, 219-220`, `components/feature/aste/detail/AuctionBidHistory.tsx:54-61` |
| **Problema** | `new Date(iso).toLocaleString('it-IT')` su data invalida → `"Invalid Date"`. Sort con `NaN` produce ordine non deterministico. `m.body` senza fallback. |
| **Soluzione** | `const t = new Date(iso).getTime(); if (!Number.isFinite(t)) return 'Data non disponibile'`. Sort con validazione esplicita. Body fallback: `(m.body || '(messaggio vuoto)')`. |
| **Verifica** | Data invalida → fallback stringa; sort stabile. |
| **Dipendenze** | FE-REV-029 (WS) |

### FE-REV-034 · MEDIUM · `AuctionHmsText` countdown — `endsAt` non validato
| Campo | Valore |
|-------|--------|
| **File** | `components/feature/aste/auctions-browse-shared.tsx:30-33` |
| **Problema** | `new Date(endsAt).getTime() - now` ritorna `NaN` se `endsAt` corrotto → countdown mostra "00:00:00" permanente. |
| **Soluzione** | Hook `useAuctionMsLeft(endsAt): number` con `return Number.isFinite(t) ? t - now : 0`. |
| **Verifica** | `endsAt` corrotto → "00:00:00" o "Scaduta" senza crash. |
| **Dipendenze** | FE-REV-033 (pattern) |

### FE-REV-035 · MEDIUM · `Number()` su prezzi italiani in `AsteHubPage`
| Campo | Valore |
|-------|--------|
| **File** | `components/feature/aste/AsteHubPage.tsx:336-337` |
| **Problema** | `Number(filterPriceMax)` se utente incolla `"12,50"` italiano → `NaN` → filtro non filtra più (`!Number.isNaN(maxP)` diventa `false`). |
| **Soluzione** | `const maxP = Number(filterPriceMax.replace(',', '.'))` con clamp `> 0`. |
| **Verifica** | Utente incolla "12,50" → filtro applicato correttamente. |
| **Dipendenze** | Nessuna |

### FE-REV-036 · MEDIUM · Parsing prezzi italiani incompleto in `MarketplaceListingEditModal`
| Campo | Valore |
|-------|--------|
| **File** | `components/feature/vendi/singles/MarketplaceListingEditModal.tsx:35` |
| **Problema** | `Number.parseFloat(priceEuro.replace(',', '.'))` non gestisce `".50"`, `"12.50,5"` (migliaia), `"12,50€"`. |
| **Soluzione** | `const clean = priceEuro.replace(/[^\d,.\-]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'); const price = Number.parseFloat(clean)`; guard `Number.isFinite(price) && price >= 0`. |
| **Verifica** | Vari formati italiani → parsing corretto. |
| **Dipendenze** | FE-REV-035 (pattern) |

### FE-REV-037 · MEDIUM · `Number()` su input quantità senza clamp in 5+ file
| Campo | Valore |
|-------|--------|
| **File** | `components/feature/product/ProductDetailView.tsx:1043`, `components/feature/vendi/singles/SellSingleDetailsStep.tsx:69`, `components/feature/account/InventoryEditModal.tsx:106`, `components/feature/product/detail/ProductDetailMarketplaceSection.tsx:331`, `components/feature/vendite/MarketplaceListingEditModal.tsx:28, 35, 86` |
| **Problema** | `Number(e.target.value) || 1` accetta `"-1"`, `"0"`, `""` (fallback 1), ma anche `"1.5"` su un campo integer. |
| **Soluzione** | Helper `clampInt(raw: string, min: number, max: number, fallback: number): number`. |
| **Verifica** | Input quantità negative/decimali → respinti o clampati. |
| **Dipendenze** | Nessuna |

### FE-REV-038 · MEDIUM · `useBrxScanner` deps instabili con effetti domino
| Campo | Valore |
|-------|--------|
| **File** | `hooks/useBrxScanner.ts:511-535, 600-650, 700-750` |
| **Problema** | `commitMatch`/`onStatus`/`onProgress` ricevuti come prop → `useCallback` con deps instabili → effetto loop scanner si re-iscriverà ad ogni keystroke parent. 60+ re-render/sec durante scansione. |
| **Soluzione** | Ref pattern: `onMatchRef.current = onMatch` in effect, leggere da `ref.current` dentro l'effect, escludere `onMatch` dalle deps. |
| **Verifica** | Scanner non si re-inizializza ad ogni keystroke parent. Profiler: re-render limitati ai 60fps del progress. |
| **Dipendenze** | FE-REV-039 (cleanup ort/stream) nello stesso PR |

### FE-REV-039 · MEDIUM · `useBrxScanner` cleanup incompleto ort/worker/stream
| Campo | Valore |
|-------|--------|
| **File** | `hooks/useBrxScanner.ts:380-410, 580-620` |
| **Problema** | ort session chiusa, blob URL revocato, ma `MediaStream` di `getUserMedia` non sempre `stop()`-ato. Worker può sopravvivere alla chiusura pagina. |
| **Soluzione** | Nel cleanup: `stream.getTracks().forEach(t => t.stop())`, `worker.terminate()` esplicito, `ortSession.dispose()` se disponibile. |
| **Verifica** | Chiudere scanner → fotocamera spenta (icona browser), worker terminato, ort session disposed. |
| **Dipendenze** | Stesso PR di FE-REV-038 |

### FE-REV-040 · MEDIUM · `AsteInCorsoCarousel` IntersectionObserver ricreato ad ogni render
| Campo | Valore |
|-------|--------|
| **File** | `components/feature/aste/AsteInCorsoCarousel.tsx:120-180` |
| **Problema** | Observer per autoplay in effect con deps `[items, ...]` → ricrea observer anche se `items` non è cambiato. |
| **Soluzione** | `useRef` per observer instance + `useEffect(() => {...}, [items.length])` con compare stabile. |
| **Verifica** | Performance tab: 1 solo observer attivo; navigazione carosello fluida. |
| **Dipendenze** | Nessuna |

### FE-REV-041 · MEDIUM · `use-photo-pairing-session` WS cleanup + polling + blob URL
| Campo | Valore |
|-------|--------|
| **File** | `lib/hooks/use-photo-pairing-session.ts` |
| **Problema** | `setInterval` polling con cleanup ok, ma `pairing.ws.onclose` non `null`-ato → WS zombie, reconnect loop. Blob URL per QR non revocato. |
| **Soluzione** | Nel cleanup: `pairing.ws.onclose = null; pairing.ws.close(); pairing.ws = null`; `URL.revokeObjectURL(qrBlobUrl)`. Backoff esponenziale sul reconnect. |
| **Verifica** | Stop sessione → WS chiuso, polling cancellato, blob URL revocato. |
| **Dipendenze** | Nessuna |

### FE-REV-042 · MEDIUM · `CardMascotte` listener non-passive su `mousemove` + rAF 120Hz
| Campo | Valore |
|-------|--------|
| **File** | `components/dev/CardMascotte.tsx:1700-1900` |
| **Problema** | `mousemove` listener senza `{ passive: true }` → scroll mobile può essere bloccato. rAF loop non throttla su monitor ProMotion (120Hz). |
| **Soluzione** | `addEventListener('mousemove', handler, { passive: true })`. rAF: clamp `Math.min(elapsed, 16.67)` o usare `requestPostAnimationFrame`. |
| **Verifica** | Mobile: scroll fluido con mascotte visibile. Battery profiler: niente picchi anomali. |
| **Dipendenze** | FE-REV-014/015/016 (già ✅) — queste sono complementari |

### FE-REV-043 · MEDIUM · `SearchWithInstantSearch` prop drilling typing state (6+ props)
| Campo | Valore |
|-------|--------|
| **File** | `components/layout/search/SearchWithInstantSearch.tsx` → `SearchResultsDropdown` → `CardHit` |
| **Problema** | `isTyping`, `typingKey`, `rowDelay`, `energyLevel`, `typingVelocity`, `streak` passati come prop drilling 2 livelli. Accoppiamento stretto. |
| **Soluzione** | Hook `useTypingAnimation(query)` in `lib/hooks/`. `SearchResultsDropdown` non riceve più state animazione. |
| **Verifica** | Dropdown non re-renderizza per `typingKey`/`typingVelocity` quando `hits` non cambia. |
| **Dipendenze** | FE-REV-002 (✅ timer cleanup), FE-REV-017 (✅ onOpenChange ref) |

### FE-REV-044 · MEDIUM · `AsteDetailView` scroll/resize effect senza throttling
| Campo | Valore |
|-------|--------|
| **File** | `components/feature/aste/AsteDetailView.tsx:186-194, 280-300` |
| **Problema** | Sticky header effect chiama `setStickyTop`/`setShowStickyHeader` ad ogni evento `scroll` (100+/sec). Nessun rAF né debounce. |
| **Soluzione** | `let raf = 0; const handler = () => { if (raf) return; raf = requestAnimationFrame(() => { /* calcola */; raf = 0; }); }`. Cleanup `cancelAnimationFrame`. |
| **Verifica** | Performance tab: max 60 setState/sec su scroll prolungato. |
| **Dipendenze** | FE-REV-019 (✅ hook generico) — applicare pattern a `AsteDetailView` |

### FE-REV-045 · MEDIUM · `AuctionCreateWizard` → 25+ props, 2 nav duplicati
| Campo | Valore |
|-------|--------|
| **File** | `components/feature/aste/create/wizard/AuctionCreateStepPanel.tsx:26-52`, `components/feature/aste/create/AuctionCreateWizard.tsx:623-649, 652-681` |
| **Problema** | Wizard passa 25 props al panel (molti passthrough). 2 `<AuctionCreateWizardNav>` con 14 props identici. Modificare il flusso richiede 3+ file coordinati. |
| **Soluzione** | Zustand store `useWizardStore` (slice `draft`, `stepId`, action `update`/`goNext`/`goBack`). Sub-step a 0 props. Estrarre `navProps` con `useMemo`. |
| **Verifica** | Sub-step ricevono 0 props dal wizard. 1 sola definizione nav. |
| **Dipendenze** | Allineabile a FE-CR-007 (selector token) e fe-refactoring-plan Fase D |

### FE-REV-046 · MEDIUM · `t` (translation) prop drilling in 20+ componenti
| Campo | Valore |
|-------|--------|
| **File** | `OggettiTable.tsx:75,97` → `OggettiMobileList.tsx:44`; `AsteMyListingsPage.tsx:179,181`; `auctions-browse-shared.tsx:36,110,236,318,486`; `SearchResults.tsx:114` → `SearchResultsTable.tsx:44` → `SearchResultsToolbar.tsx:16`; `card-mascotte/*` (6+ file); `AsteHubPage.tsx:76`; `AuctionProductMeta.tsx:15,18`; `VendiPageShell.tsx:43,50` |
| **Problema** | `t` passata come prop attraverso 2-3 livelli. Cambio lingua re-renderizza l'intero albero. Refactor richiede N file. |
| **Soluzione** | Ogni sub-componente legge `t` direttamente con `useTranslation()`. Cancellare prop `t` da tutti i tipi. |
| **Verifica** | Cambio lingua → solo consumer diretti di `useTranslation` re-renderizzano. |
| **Dipendenze** | FE-REV-020 (✅ split ProductDetail) — applicare stesso pattern |

### FE-REV-047 · MEDIUM · 12 file monolitici >700 righe senza feature-slicing
| Campo | Valore |
|-------|--------|
| **File** | `OggettiContent.tsx:1-1126`, `ScambiProponiModal.tsx:1-1365`, `SellSingleWizard.tsx:1-1097`, `AsteDetailView.tsx:1-1018`, `ProductDetailView.tsx:1-1129`, `HamburgerMenu.tsx:1-762`, `TopBar.tsx:1-826`, `OggettiTable.tsx:1-881`, `SinglesView.tsx:1-843`, `ProductPriceChart.tsx:1-715`, `AcquistiContent.tsx:1-860`, `AuctionCreateWizard.tsx:1-713` |
| **Problema** | Ogni file contiene logica di business + state UI + JSX denso + effetti + callback prop drilled. Test impossibili, merge conflicts, debito tecnico. |
| **Soluzione** | Feature-sliced architecture: per ogni monolite, estrarre `_components/` (sub-sezioni <200 righe memoizzate), `_hooks/` (state derivato), `_utils/` (logica pura). |
| **Verifica** | Nessun file >500 righe; ogni sub-componente testabile in isolamento. |
| **Dipendenze** | FE-REV-045 (wizard Zustand) prerequisito per wizard. FE-REV-020 (✅) per ProductDetail. |

### FE-REV-048 · MEDIUM · `AsteDetailView` 18+ useState, 5 accordion/modal paralleli
| Campo | Valore |
|-------|--------|
| **File** | `components/feature/aste/AsteDetailView.tsx:91-119` |
| **Problema** | `imgIdx`/`thumbStart` sincronizzati via effect, `myLastOfferEur` come state "override" del derivato, 5 state per accordion/modal (`mobileSection`, `bidsExpanded`, `descriptionExpanded`, `shippingExpanded`, `calendarMenuOpen`). |
| **Soluzione** | Hook specializzati: `useGalleryState(images)`, `useProxyBidState()`, `useAccordionState()`. `myLastOfferEur` cleanup: effect su `bidRows` che azzera lo state quando l'offerta è in history. |
| **Verifica** | Cambio asta (numericId) → reset automatico; nessun dato proxy/toast dell'asta precedente. (Vedi FE-REV-007 ✅ per il reset parziale — estendere.) |
| **Dipendenze** | FE-REV-007 (✅) — estendere il reset |

### FE-REV-049 · MEDIUM · Hook `useDisclosure` / `useOutsideClick` per `HamburgerMenu`
| Campo | Valore |
|-------|--------|
| **File** | `components/layout/HamburgerMenu.tsx:54-77, 160-191` |
| **Problema** | 6 useState per 4 menu/dropdown. 3 useEffect identici per click-outside → 4 listener `click` globali attivi contemporaneamente. |
| **Soluzione** | Nuovo hook `lib/hooks/use-disclosure.ts` con ref + listener unico. 4 menu → 4 istanze del hook. |
| **Verifica** | Aprire tutti i menu → 4 listener (1 per menu), cleanup completo. |
| **Dipendenze** | FE-REV-005 (✅ TopBar) — pattern già applicato qui |

### FE-REV-050 · MEDIUM · Hook `useStoredAsteViewMode` per 7+ pagine
| Campo | Valore |
|-------|--------|
| **File** | `AsteHubPage.tsx:234,304-310`, `AsteMyListingsPage.tsx:68-75`, `AsteParticipationsPage.tsx:33`, `ScambiHubPage.tsx:75`, `UserProfileAuctionsPanel.tsx:43`, `VenditeContent.tsx:65`, `AcquistiContent.tsx:183,236-241` |
| **Problema** | Pattern `useState` + 2 `useEffect` (read/write localStorage) duplicato 7+ volte. |
| **Soluzione** | Hook `useStoredAsteViewMode(key, default)` in `lib/auction/`. Lazy init + 1 solo effect. |
| **Verifica** | Una sola definizione del pattern; 7+ file con 1 riga di hook. |
| **Dipendenze** | FE-REV-026 (safeStorage helper) per robustezza |

### FE-REV-051 · MEDIUM · `GameContext`/`LanguageContext` lazy init + rimozione alias `setGame`
| Campo | Valore |
|-------|--------|
| **File** | `lib/contexts/GameContext.tsx:23-26, 77-89`, `lib/contexts/LanguageContext.tsx:48-54, 91-110` |
| **Problema** | State iniziale = `DEFAULT_GAME`; al mount `setSelectedGameState(getStoredGame() ?? DEFAULT_GAME)` → flash del default. `dictVersion` increment forzato in effect → re-render globale. `setGame`/`setSelectedGame` alias. |
| **Soluzione** | Lazy initializer in `useState(() => getStoredGame() ?? DEFAULT_GAME)`. Rimuovere `setGame`. Per `LanguageContext`: dividere context in `useLanguage()` (raro cambia) e `useTranslation()` (dizionario lazy). |
| **Verifica** | No flash del default; cambio dizionario lazy → solo consumer di `useTranslation` re-renderizzano. |
| **Dipendenze** | Nessuna |

---

## P6-C — Form, Input, UX (MEDIUM)

### FE-REV-052 · MEDIUM · `confirm()`/`alert()`/`prompt()` nativi in 12+ call site
| Campo | Valore |
|-------|--------|
| **File** | `ProductDetailView.tsx:289, 307, 325, 743`; `ScambiDetailView.tsx:314`; `AsteMyListingsPage.tsx:94`; `MarketplaceListingsPanel.tsx:95`; `OggettiTable.tsx:150, 182`; `ProfiloContent.tsx:67` |
| **Problema** | Bloccano main thread, non stilizzati, non accessibili (no i18n), in PWA rompono UX. |
| **Soluzione** | Nuovi componenti `<ConfirmDialog>` e `<Toast>` in `components/ui/` (riusare `LoginGateModal`/`SellWizardModal` come pattern). Sostituire gradualmente 12+ call site. |
| **Verifica** | `grep -r "window.confirm\|window.alert\|window.prompt" components/` → 0 risultati. |
| **Dipendenze** | Nessuna (refactor isolato) |

### FE-REV-053 · MEDIUM · Input bid senza normalizzazione italiana + `parsedInput NaN` in dialog
| Campo | Valore |
|-------|--------|
| **File** | `AuctionBidModal.tsx:387, 224-235, 449`, `AuctionBidPanel.tsx:449, 277-286` |
| **Problema** | `setInput(amt.toString())` produce `"12.5"` invece di `"12,5"`. `parsedInput NaN` arriva al dialog "Confermi offerta di € NaN?". |
| **Soluzione** | Helper `formatBidInput(n: number): string` (`Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',')`). `safeAmount = Number.isFinite(parsedInput) ? parsedInput : minBid` prima della conferma. |
| **Verifica** | Quick-amount "12.5" → input mostra "12,5"; input vuoto + click conferma → dialog mostra `minBid` formattato. |
| **Dipendenze** | FE-REV-031 (divisione per zero) |

---

## P6-D — Edge case LOW

### FE-REV-054 · LOW · `<img alt="">` decorativi su immagini informative in 15+ call site
| Campo | Valore |
|-------|--------|
| **File** | `AsteInCorsoCarousel.tsx:408`; `auctions-browse-shared.tsx:250, 339, 426`; `AsteMyListingsPage.tsx:214, 297, 373`; `ScambiDetailView.tsx:158, 165, 244, 277`; `AuctionGallery.tsx:53` |
| **Problema** | Tutte le immagini carte hanno `alt=""`. Per `AuctionGallery` (thumbnail cliccabili) non è decorativo. Screen reader salta l'immagine. |
| **Soluzione** | `alt={item.title}` per immagini informative; `alt={\`Miniatura ${i + 1}\`}` per gallery thumbnails. |
| **Verifica** | Screen reader legge l'alt; niente "image" senza descrizione. |
| **Dipendenze** | Nessuna |

### FE-REV-055 · LOW · `CountrySelect` / `CustomSelect` `options` non difeso
| Campo | Valore |
|-------|--------|
| **File** | `components/ui/CountrySelect.tsx:66, 213`, `components/ui/CustomSelect.tsx:35, 40` |
| **Problema** | `options.find(...)` e `options.map(...)` se `options` è `undefined` crasha. |
| **Soluzione** | `const safeOptions = options ?? []` in cima a ogni componente. |
| **Verifica** | `options={undefined}` → no crash, render vuoto. |
| **Dipendenze** | Nessuna |

### FE-REV-056 · LOW · `STATUS_DOT[status.tone]` può essere `undefined` in `OrderItemCard`
| Campo | Valore |
|-------|--------|
| **File** | `components/feature/ordini/OrderItemCard.tsx:62, 152` |
| **Problema** | Classe Tailwind invalida `bg-undefined` se `tone` non è nelle chiavi. |
| **Soluzione** | Fallback `STATUS_DOT[status.tone] ?? STATUS_DOT.waiting`. |
| **Verifica** | `tone` sconosciuto → classe `bg-waiting` (o simile), no `bg-undefined`. |
| **Dipendenze** | Nessuna |

### FE-REV-057 · LOW · `cart-summary` `items` non protetto da corruzione store
| Campo | Valore |
|-------|--------|
| **File** | `components/feature/cart/cart-summary.tsx:9-11` |
| **Problema** | `useCartStore((s) => s.items.reduce(...))` se `items` non è array (corruzione store persistito da versioni precedenti) crasha. |
| **Soluzione** | `Array.isArray(s.items) ? s.items.reduce((acc, item) => acc + (item.quantity ?? 0), 0) : 0`. |
| **Verifica** | Store con `items: null` → count 0, no crash. |
| **Dipendenze** | Nessuna |

---

## Stato avanzamento (P6)

| ID | Sev. | Stato | Note |
|----|------|-------|------|
| FE-REV-024 | CRITICAL | ✅ Fatto | URL HTTP(S) allowlistato nel backend, adapter e render boundary; regressioni frontend/backend presenti |
| FE-REV-025 | HIGH | ⬜ TODO | ErrorBoundary su 7+ pagine |
| FE-REV-026 | HIGH | ⬜ TODO | Helper `safeGetItem`/`safeSetItem` |
| FE-REV-027 | HIGH | ⬜ TODO | Clamp Pagination |
| FE-REV-028 | HIGH | ⬜ TODO | Clamp ImageLightbox |
| FE-REV-029 | HIGH | ✅ Fatto | Frame WS bounded, validati e associati alla risorsa attesa |
| FE-REV-030 | HIGH | ⬜ TODO | `€ NaN` cart |
| FE-REV-031 | HIGH | ⬜ TODO | Divisione per zero bid |
| FE-REV-032 | MEDIUM | ⬜ TODO | `useShallow` cart store |
| FE-REV-033 | MEDIUM | ⬜ TODO | Date validation 3 file |
| FE-REV-034 | MEDIUM | ⬜ TODO | endsAt validation |
| FE-REV-035 | MEDIUM | ⬜ TODO | Number() prezzi italiani |
| FE-REV-036 | MEDIUM | ⬜ TODO | Parsing prezzi robust |
| FE-REV-037 | MEDIUM | ⬜ TODO | clampInt helper |
| FE-REV-038 | MEDIUM | ⬜ TODO | useBrxScanner ref pattern |
| FE-REV-039 | MEDIUM | ⬜ TODO | useBrxScanner cleanup |
| FE-REV-040 | MEDIUM | ⬜ TODO | IntersectionObserver stabilizzato |
| FE-REV-041 | MEDIUM | ⬜ TODO | WS photo pairing cleanup |
| FE-REV-042 | MEDIUM | ⬜ TODO | mousemove passive + rAF clamp |
| FE-REV-043 | MEDIUM | ⬜ TODO | useTypingAnimation hook |
| FE-REV-044 | MEDIUM | ⬜ TODO | rAF throttling AsteDetailView |
| FE-REV-045 | MEDIUM | ⬜ TODO | Wizard Zustand + nav dedup |
| FE-REV-046 | MEDIUM | ⬜ TODO | Rimozione prop drilling `t` |
| FE-REV-047 | MEDIUM | ⬜ TODO | Split 11 file monolitici |
| FE-REV-048 | MEDIUM | ⬜ TODO | AsteDetailView state split |
| FE-REV-049 | MEDIUM | ⬜ TODO | useDisclosure hook |
| FE-REV-050 | MEDIUM | ⬜ TODO | useStoredAsteViewMode hook |
| FE-REV-051 | MEDIUM | ⬜ TODO | Context lazy init + dedup |
| FE-REV-052 | MEDIUM | ⬜ TODO | ConfirmDialog/Toast sostituzione |
| FE-REV-053 | MEDIUM | ⬜ TODO | Bid input normalizzazione |
| FE-REV-054 | LOW | ⬜ TODO | `<img alt>` accessibilità |
| FE-REV-055 | LOW | ⬜ TODO | CountrySelect/CustomSelect guard |
| FE-REV-056 | LOW | ⬜ TODO | STATUS_DOT fallback |
| FE-REV-057 | LOW | ⬜ TODO | cart-summary Array.isArray |

**Totale P6:** 34 issue (1 CRITICAL, 7 HIGH, 22 MEDIUM, 4 LOW)

---

## Ordine di esecuzione consigliato (P6)

```
P6-A (024–031) ──► PR unico sicurezza/crash (8 issue, ~2 gg)
       │
       ├──► P6-B (032–051) PR separati per area (performance, state, architettura)
       │
       ├──► P6-C (052–053) PR form/UX (~0.5 gg)
       │
       └──► P6-D (054–057) PR cleanup accessibilità (~0.5 gg)
```

**Sequenza PR:**

- **PR-8 (Sicurezza+Crash):** FE-REV-024, 025, 026, 027, 028, 029, 030, 031
- **PR-9 (Cart store + Date):** FE-REV-032, 033, 034
- **PR-10 (Parsing italiano):** FE-REV-035, 036, 037
- **PR-11 (Scanner refactor):** FE-REV-038, 039
- **PR-12 (Observer/WS):** FE-REV-040, 041
- **PR-13 (Mascotte+Search):** FE-REV-042, 043
- **PR-14 (Performance throttling):** FE-REV-044
- **PR-15 (Architettura wizard):** FE-REV-045, 048
- **PR-16 (Prop drilling + monolitici):** FE-REV-046, 047
- **PR-17 (Hook riusabili):** FE-REV-049, 050, 051
- **PR-18 (Form/UX):** FE-REV-052, 053
- **PR-19 (Cleanup accessibilità):** FE-REV-054, 055, 056, 057

---

## Relazione con altri documenti (aggiornata)

| Documento | Relazione |
|-----------|-----------|
| `docs/backlog/fe-refactoring-plan.md` | FE-REV-045 (wizard Zustand) overlap Fase D; FE-REV-046 (prop drilling `t`) allineabile a Fase B; FE-REV-051 (context lazy) overlap Fase A |
| `docs/backlog/fe-code-review-plan.md` | FE-REV-026 (safeStorage) **complementa** FE-REV-018 (selector token puro) e FE-CR-007 (desync token); FE-REV-029 complementa FE-CR-001 (error handling) sul fronte WS |
| `docs/backlog/fe-open-todos.md` | Nessuna sovrapposizione |
| `docs/reviews/2026-06-21-frontend.md` | Review precedente; P6 copre finding aggiuntivi della review del 2026-06-23 |
| `CLAUDE.md` | FE-REV-032 (cart store selectors) rispetta regola React Query + Zustand; FE-REV-046 (rimozione prop drilling) abilita i18n lazy più granulare |

---

## Note operative (P6)

- **Stato sicurezza immediata:** FE-REV-024 (XSS URL) e FE-REV-029 (frame WS) sono chiusi e coperti da regressione; gli altri elementi di PR-8 restano backlog di resilienza/UI e vanno valutati separatamente.
- **Dipendenze forti:** FE-REV-026 (safeStorage) è prerequisito per 027, 028, 050. FE-REV-045 (Wizard Zustand) abilita split efficace del wizard.
- **Gate qualità per ogni PR:** `npm run typecheck` + `npm run lint` a 0 errori. Se tocchi i18n: `npm run i18n:keys`.
- **Stima tempi P6:** ~3-4 settimane totali.
- **Aggiornare** la tabella stato (⬜ → ✅) dopo ogni merge.

| Documento | Relazione |
|-----------|-----------|
| `docs/backlog/fe-refactoring-plan.md` | FE-REV-001 allineato a metrica "Copie useNowTick"; FE-REV-018 allineato a Fase B token selector; FE-REV-020 overlap Fase D (slim orchestratori) |
| `docs/backlog/fe-open-todos.md` | Nessuna sovrapposizione (TODO backend lì elencati restano fuori scope) |
| `docs/reviews/2026-06-21-frontend.md` | Review precedente; questo piano copre finding aggiuntivi della review React/UI del 2026-06-22 |

---

# Note esplicative (non in scope fix immediato)

- **`AsteInCorsoCarousel`**: autoplay e prefetch hanno cleanup corretto — nessuna issue aperta.
- **`SearchCompositePanel`**: listener scroll/resize con cleanup — OK.
- **XSS utente**: nei file ispezionati, `dangerouslySetInnerHTML` usa solo SVG/costanti statiche (dev mascotte); rischio basso, pattern da migliorare (FE-REV-021).
