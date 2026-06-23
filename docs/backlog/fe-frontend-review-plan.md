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

# Relazione con altri documenti

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
