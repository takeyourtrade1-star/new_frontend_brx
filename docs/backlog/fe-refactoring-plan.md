# Frontend — Piano di refactoring (fase 2)

**Data:** 2026-06-22  
**Origine:** code review post-sessione 6 (`docs/reviews/2026-06-21-frontend.md` + analisi strutturale aggiuntiva)  
**Perimetro:** `components/`, `lib/hooks/`, `lib/stores/` — **senza** modifiche a `app/api/*` salvo dove esplicitamente indicato e approvato  
**Obiettivo:** ridurre monoliti residui, allineare i flussi sync/inventario/acquisti alle regole architetturali (React Query, separazione UI/logica), migliorare testabilità e onboarding.

---

## Stato attuale

La review del 2026-06-21 ha chiuso la maggior parte dei blocchi (idratazione, split monoliti >2000 righe, migrazione RQ generale, i18n bulk, cleanup timer). Restano però **debiti strutturali di secondo livello**: orchestratori ancora >800 righe, fetch manuale in sync/inventario, mock mescolati a produzione, prop drilling, auth-store monolitico.

| Area | Stato review 6 | Debito residuo |
|------|----------------|----------------|
| Monoliti >2000 righe | ✅ splittati | Orchestratori 800–1300 righe ancora presenti |
| React Query | ✅ migrato (6.1–6.7) | `SincronizzazioneContent`, polling sync in `OggettiContent`/`OggettiTable` |
| auth-store | ✅ step 1–3 | Split store + selector token unificato (step 4–5 saltati) |
| i18n | ✅ bulk | Stringhe hardcoded in `AcquistiContent` |
| Mock vs real | — | `AcquistiContent` usa mock stores nel flusso principale |
| BFF scanner | ⏭️ | Fuori scope sessione 6; resta blocco 2 della review |

---

## Metriche di successo

| Metrica | Baseline (2026-06-22) | Target |
|---------|------------------------|--------|
| File feature >800 righe | ~10 | ≤3 (solo orchestratori sottili) |
| `useEffect` + fetch manuale in feature sync/inventario | 3 file | 0 |
| Props passate a `OggettiTable` | ~20 | ≤8 (resto via context/hook) |
| Chiamate API da componenti tabella/lista | `OggettiTable`, `ModernSellerTable` | 0 (solo hook/mutation) |
| Stringhe UI hardcoded in acquisti | ~15 | 0 |
| Duplicazione `localStorage.getItem('ebartex_access_token')` | ~12 file | 1 selector |
| `useEffect` enrich pubblici duplicati | 10 effetti / 7 file | 0 (3 hook condivisi) |
| Formatter EUR distinti | 5 (`formatEurCents`, `formatEuroNoSpace`, `formatPrice`, `formatAuctionEur`, inline) | 1 modulo `lib/format` |
| Copie `useNowTick` | 3 (`use-now-tick.ts` + inline in `UserProfileAuctionsPanel`, `AsteInCorsoCarousel`) | 1 hook |

**Gate qualità (ogni PR del piano):** `npm run typecheck` + `npm run lint` a 0 errori. Se tocchi i18n: `npm run i18n:keys`.

---

## Fasi e priorità

| Fase | Titolo | Gravità | Sforzo | Dipendenze |
|------|--------|---------|--------|------------|
| **0** | Quick wins DRY (enrich hook, EUR format, useNowTick, tooling) | 🟠 Alta | Basso | Nessuna |
| **A** | Sync + inventario (React Query + slim components) | 🔴 Critica | Alto | Nessuna |
| **B** | Auth session + split store (step 4–5 review) | 🟠 Alta | Medio | Fase A opzionale |
| **C** | Acquisti: mock isolation + i18n | 🟠 Alta | Medio | `lib/config/features.ts` |
| **D** | Slim orchestratori (Product, Aste, Scambi, Vendi) | 🟡 Media | Alto | Pattern da Fase A |
| **E** | Layout shell (TopBar, ModernSellerTable) | 🟡 Media | Medio | Fase B per token |
| **F** | BFF scanner (blocco 2 review) | 🔴 Critica | Medio | **Richiede `app/api/*`** |
| **G** | Backend TODO (registrazione, payout) | 🟡 Media | — | BFF/backend |

---

# Fase 0 — Quick wins DRY (frontend puro, no api)

> Refactor a basso rischio, alto ROI: nessuna nuova chiamata dati, solo deduplicazione di codice client esistente. Ottimo primo PR. **Non tocca `app/api/*` né i microservizi.**

## 0.1 — Hook `useEnrichedAuctions` (enrich pubblici, DRY cross-file)

| Campo | Valore |
|-------|--------|
| **File nuovi** | `lib/hooks/use-enriched-auctions.ts` |
| **File toccati** | `AsteDetailView`, `AsteHubPage`, `AsteMyListingsPage`, `AsteParticipationsPage`, `AsteInCorsoCarousel`, `UserProfileAuctionsPanel`, `ProductAuctionsPanel` |
| **Problema** | Stesso `useEffect` + `enrichAuctionsWithPublicUsers/enrichBidRowsWithPublicUsers` + `useState` + guard `cancelled` copia-incollato in **7 file (10 effetti)**; `AsteDetailView` ne ha 3 da solo |
| **Soluzione** | 3 hook che incapsulano il pattern, comportamento identico (init `[]`/`null`, no svuotamento durante l'await, deps `[base]`) |

```ts
export function useEnrichedAuctions(base: AuctionUI[]): AuctionUI[]        // init []
export function useEnrichedAuction(base: AuctionUI | null): AuctionUI|null  // init null, fallback resolved ?? base
export function useEnrichedBidRows(base: BidRowUI[]): BidRowUI[]           // init []
```

**Mappatura call-site:**

| File | Stato/effetto rimosso | Sostituito con |
|------|------------------------|----------------|
| `AsteHubPage` | `enriched` + effect | `useEnrichedAuctions(baseAuctions)` |
| `AsteInCorsoCarousel` | `liveAuctions` + effect | `useEnrichedAuctions(liveAuctionsBase)` |
| `AsteMyListingsPage` | `mine` + effect | `useEnrichedAuctions(mineBase)` |
| `AsteParticipationsPage` | `rows` + effect | `useEnrichedAuctions(rowsBase)` |
| `UserProfileAuctionsPanel` | `auctions` + effect | `useEnrichedAuctions(baseAuctions)` |
| `ProductAuctionsPanel` | `enrichedCard` + `enrichedRecommended` + 2 effect | 2× `useEnrichedAuctions(...)` |
| `AsteDetailView` | `detail` / `bidRows` / `similarCards` + 3 effect | `useEnrichedAuction(baseDetail)`, `useEnrichedBidRows(baseBidRows)`, `useEnrichedAuctions(similarCardsBase)` |

**Acceptance criteria:**
- [ ] Zero `useEffect` con `enrich*PublicUsers` nei componenti (solo dentro l'hook)
- [ ] Init state preservato (`null` per detail singolo, `[]` per array) → primo render invariato
- [ ] Import `enrich*` rimossi dai 7 file
- [ ] `typecheck` + `lint` + `test` (92/94, i 2 bff noti)

## 0.2 — Consolidare formatter EUR

| Campo | Valore |
|-------|--------|
| **File nuovi** | `lib/format/eur.ts` (o estendere `lib/utils.ts`) |
| **File toccati** | `AuctionBidPanel:278`, `AuctionBidModal:202` (inline), call-site dei vari formatter |
| **Problema** | 5 formatter EUR: `formatEurCents`, `formatEuroNoSpace` (`lib/utils`), `formatPrice` (`inventory`), `formatAuctionEur` (`auction-detail-utils`, arrotonda half-step) + `fmtEur` inline (no round) |
| **Soluzione** | Un modulo con varianti **nominate e documentate** (cents vs unità, round vs no-round). **Non** fondere ciecamente: le differenze di arrotondamento sono intenzionali |

**Acceptance criteria:**
- [ ] `fmtEur` inline in `AuctionBidPanel`/`AuctionBidModal` rimpiazzati dal formatter condiviso (variante no-round)
- [ ] Nessuna regressione su importi mostrati (verifica visiva asta/bid)

## 0.3 — Dedup `useNowTick`

| Campo | Valore |
|-------|--------|
| **File** | `lib/hooks/use-now-tick.ts` (esistente), copie inline in `UserProfileAuctionsPanel`, `AsteInCorsoCarousel` |
| **Soluzione** | Parametrizzare l'hook esistente con `intervalMs` opzionale; rimuovere le copie locali |

## 0.4 — Tooling dead-code ✅ FATTO (tool aggiunto, triage da fare)

Aggiunto `knip` (devDep) + script `npm run deadcode` + `knip.json` (entry: `app/sw.ts`, scanner worker, `scripts/*`, vitest setup/test). Scova **export/file morti** che né `tsc` (`noUnusedLocals` off) né l'ESLint attuale flaggano. Solo config dev, nessun runtime.

**Baseline iniziale (2026-06-22):** 49 file, 4 dependencies, 2 devDependencies, 2 unlisted, 213 export, 70 tipi, 12 duplicate-export flaggati.

> ⚠️ **Triage manuale richiesto, NON cancellazione bulk.** La lista è pesante di falsi positivi: file usati via route/`next/dynamic`, deps consumate solo da file a loro volta flaggati (cascata, es. `react-webcam`/`input-otp`/`react-easy-crop`), `@testing-library/*` usati nei test, tipi che sono API pubblica. Verificare ogni voce prima di toccarla. `npm run deadcode` esce ≠0 finché ci sono findings → **non** ancora un gate CI; diventarlo solo dopo aver azzerato i veri morti e configurato `ignore`/`ignoreDependencies` per i restanti falsi positivi.

**Follow-up suggeriti (PR separati, ognuno con verifica):**
- Triage `Unused files`: confermare i mock/legacy realmente morti (es. `mock-*`, `*Mockup`, `AsteScreen`, registrati `*-form` legacy) vs falsi positivi, e rimuovere solo i confermati.
- `Unlisted dependencies`: `serwist` usato in `app/sw.ts` ma non in `package.json` (transitivo via `@serwist/next`) → aggiungerlo esplicito o configurare.
- Valutare `eslint-plugin-unused-imports` per gli import (complementare a knip).

---

# Fase A — Sync + inventario

> **ROI massimo.** Due schermate account (`OggettiContent`, `SincronizzazioneContent`) violano ancora la regola React Query e contengono logica duplicata di polling task.

## A.1 — Hook React Query per sync status

| Campo | Valore |
|-------|--------|
| **File nuovi** | `lib/hooks/use-sync-status.ts`, `lib/sync/sync-query-keys.ts` |
| **File toccati** | `components/feature/account/SincronizzazioneContent.tsx`, `components/feature/account/OggettiContent.tsx` |
| **Problema** | `useEffect` + `syncClient.getSyncStatus` + 4+ `useState` per loading/error |
| **Soluzione** | `useQuery({ queryKey: syncKeys.status(userId), queryFn, enabled })` con invalidazione centralizzata |

```ts
// lib/sync/sync-query-keys.ts
export const syncKeys = {
  all: ['sync'] as const,
  status: (userId: string) => [...syncKeys.all, 'status', userId] as const,
  webhook: (userId: string) => [...syncKeys.all, 'webhook', userId] as const,
  progress: (userId: string) => [...syncKeys.all, 'progress', userId] as const,
  events: (page: number) => [...syncKeys.all, 'events', page] as const,
};
```

**Acceptance criteria:**
- [ ] Zero `useState` per `syncStatus` / `loadingStatus` in `OggettiContent` e `SincronizzazioneContent`
- [ ] Refresh manuale usa `queryClient.invalidateQueries({ queryKey: syncKeys.all })`
- [ ] Errori sync mostrati via `isError` / `error` di React Query

---

## A.2 — Hook polling task sync (DRY)

| Campo | Valore |
|-------|--------|
| **File nuovi** | `lib/sync/poll-sync-task.ts`, `lib/hooks/use-sync-task-mutation.ts` |
| **File toccati** | `OggettiContent.tsx`, `OggettiTable.tsx`, `SincronizzazioneContent.tsx` |
| **Problema** | `pollTaskUntilReady` duplicato (~25 righe × 2 file), polling con `setTimeout` manuale |
| **Soluzione** | Funzione pura `pollSyncTask(taskId, accessToken, options)` + `useMutation` che invalida sync + inventory |

```ts
// lib/sync/poll-sync-task.ts
export async function pollSyncTask(
  taskId: string,
  accessToken: string,
  { intervalMs = 2500, maxPolls = 240 } = {}
): Promise<SyncTaskStatus> { /* ... */ }
```

**Acceptance criteria:**
- [ ] Una sola implementazione polling nel repo
- [ ] `OggettiTable` non chiama più `syncClient.getTaskStatus` direttamente
- [ ] Cleanup: mutation abort su unmount (via `AbortSignal` o flag ref)

---

## A.3 — Mutazioni inventario via React Query

| Campo | Valore |
|-------|--------|
| **File nuovi** | `lib/hooks/use-inventory-mutations.ts` |
| **File toccati** | `components/feature/account/oggetti/OggettiTable.tsx` |
| **Problema** | Tabella (857 righe) esegue delete/update/qty + modale edit + polling |
| **Soluzione** | Hook con `useMutation` per ogni operazione; tabella riceve solo callbacks o usa hook internamente |

```ts
export function useInventoryMutations(userId: string) {
  const qc = useQueryClient();
  const deleteItem = useMutation({
    mutationFn: (item: InventoryItemWithCatalog) =>
      deleteInventoryOrListing(userId, item, getAccessToken()),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountInventoryKeys.all }),
  });
  return { deleteItem, updateItem, updateQuantity };
}
```

**Acceptance criteria:**
- [ ] `OggettiTable` ≤400 righe (split row + mobile list se necessario)
- [ ] Nessuna import diretta di `syncClient` in `OggettiTable`
- [ ] Bulk delete in `OggettiContent` usa le stesse mutation (no logica duplicata)

---

## A.4 — Hook composizione pagina inventario

| Campo | Valore |
|-------|--------|
| **File nuovi** | `lib/hooks/use-inventory-page.ts`, `lib/hooks/use-inventory-selection.ts`, `lib/hooks/use-inventory-pagination.ts` |
| **File toccati** | `components/feature/account/OggettiContent.tsx` |
| **Problema** | God component 1041 righe: filtri, paginazione, export CSV, bulk, sync banner, catalog fetch |
| **Soluzione** | Hook composizione; `OggettiContent` diventa layout + composizione (~150–250 righe) |

**Estrazioni suggerite (componenti):**

```
components/feature/account/oggetti/
  InventoryToolbar.tsx       ← search, filtri, view mode
  InventorySyncBanner.tsx    ← banner sync success/error
  InventoryBulkBar.tsx         ← azioni bulk selezione
  InventoryExportModal.tsx     ← già parzialmente inline, estrarre
  InventoryPagination.tsx      ← footer paginazione
```

**Acceptance criteria:**
- [ ] `OggettiContent.tsx` ≤300 righe
- [ ] Export CSV/JSON in `lib/inventory/inventory-export-utils.ts` (già presente) + modal dedicata
- [ ] Catalog batch fetch (`fetchCatalogBatched`) resta in hook, non in componente

---

## A.5 — Slim `SincronizzazioneContent`

| Campo | Valore |
|-------|--------|
| **File toccati** | `components/feature/account/SincronizzazioneContent.tsx` |
| **Problema** | 15+ `useState`, fetch manuale, polling, ETA calculation inline |
| **Soluzione** | Usare hook A.1–A.2; estrarre `useSyncPollingProgress` per ETA; componente solo compone pannelli sync già estratti |

**Acceptance criteria:**
- [ ] `SincronizzazioneContent.tsx` ≤200 righe
- [ ] Zero `useEffect` con fetch (solo effetti UI: scroll, focus)
- [ ] Sub-componenti esistenti (`SyncWebhookCard`, `SyncHistorySection`, …) invariati nel contratto public

---

# Fase B — Auth session + split store

> Riprende **Blocco 4 step 4–5** della review (saltati per alto rischio). Applicare **dopo** Fase A o in parallelo su branch separato.

## B.1 — Selector `useAuthSession`

| Campo | Valore |
|-------|--------|
| **File nuovi** | `lib/hooks/use-auth-session.ts` |
| **File toccati** | ~12 file con pattern `accessToken ?? localStorage.getItem(...)` |
| **Problema** | Fallback token duplicato; fragile se cambia strategia persist |
| **Soluzione** | Unico hook; token letto solo dallo store (persist middleware) |

```ts
export function useAuthSession() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  return { user, accessToken, isAuthenticated, isLoading };
}
```

**Acceptance criteria:**
- [ ] Zero occorrenze di `localStorage.getItem('ebartex_access_token')` fuori da `auth-store` / persist config
- [ ] Grep verifica: `rg "ebartex_access_token" components lib --glob '*.{ts,tsx}'`

---

## B.2 — Split `auth-store.ts` (695 righe)

| Campo | Valore |
|-------|--------|
| **File nuovi** | `lib/stores/auth-session-store.ts`, `lib/stores/auth-ui-store.ts`, `lib/auth/auth-actions.ts` |
| **File toccati** | `lib/stores/auth-store.ts` (deprecare gradualmente), `lib/hooks/use-auth.ts` |
| **Problema** | God store: login, MFA, register, token, preferences, flash, session expired |
| **Soluzione** | Store sessione (persist) + store UI ephemeral (no persist) + actions thin wrapper |

**Strategia migrazione (incrementale):**
1. Estrarre `auth-ui-store` (flashMessage, authError, registrationFieldErrors) — zero breaking
2. Spostare `login`/`logout`/`verifyMFA` in funzioni pure testabili in `lib/auth/auth-actions.ts`
3. Mantenere re-export da `auth-store` per compatibilità fino a migrazione completa

**Acceptance criteria:**
- [ ] Nessun file consumer importa più di 2 slice store
- [ ] `auth-store.ts` ≤250 righe (facciata) o rimosso con re-export
- [ ] Test esistenti auth passano; nessuna regressione login/logout/MFA manuale

---

# Fase C — Acquisti: mock isolation + i18n

## C.1 — Isolare mock dietro feature flag / adapter

| Campo | Valore |
|-------|--------|
| **File nuovi** | `lib/adapters/orders-source.ts`, `lib/adapters/support-source.ts` |
| **File toccati** | `components/feature/acquisti/AcquistiContent.tsx`, `lib/config/features.ts` |
| **Problema** | `useMockPurchaseStore`, `MockPaymentFormModal`, `MockShippingOrderCard` nel flusso principale (789 righe) |
| **Soluzione** | Adapter pattern; produzione usa solo hook reali |

```ts
// lib/adapters/orders-source.ts
export function useOrdersForTab(tab: TabId) {
  const real = useBuyerOrders(/* ... */);
  const mock = useMockPurchaseStore(/* ... */);
  return FEATURES.mockOrders ? mock : real;
}
```

**Acceptance criteria:**
- [ ] `FEATURES.mockOrders === false` in build produzione → zero render componenti Mock*
- [ ] Mock accessibili solo su `/ordini/demo` o env `NEXT_PUBLIC_MOCK_ORDERS=1`
- [ ] Documentare flag in `lib/config/features.ts`

---

## C.2 — i18n `AcquistiContent`

| Campo | Valore |
|-------|--------|
| **File toccati** | `AcquistiContent.tsx`, `lib/i18n/messages/{it,en,de,es,fr,pt}.ts` |
| **Problema** | Tab labels e empty states hardcoded in italiano |
| **Soluzione** | Chiavi `orders.tabs.*`, `orders.empty.*`, `orders.breadcrumb.*` |

**Acceptance criteria:**
- [ ] `npm run i18n:keys` passa
- [ ] Zero stringhe utente in chiaro in `AcquistiContent.tsx` (eccetto commenti)

---

## C.3 — Split `AcquistiContent`

| Campo | Valore |
|-------|--------|
| **File nuovi** | `components/feature/acquisti/AcquistiTabs.tsx`, `AcquistiOrderList.tsx`, `hooks/use-acquisti-tab.ts` |
| **Target** | Orchestratore ≤350 righe |

---

# Fase D — Slim orchestratori feature

> Applicare lo stesso pattern della Fase A (`useXxxPage` hook + sotto-componenti). Gran parte del lavoro di split UI è già fatto; resta l'orchestrazione.

## D.1 — `ProductDetailView` (~1032 righe)

| Step | Azione |
|------|--------|
| D.1.1 | Creare `lib/hooks/use-product-detail-page.ts` — tab state, marketplace filters, modali |
| D.1.2 | Tab via URL search param `?tab=info\|sell\|auction\|chart` (deep link) |
| D.1.3 | Spostare mutazioni listing (`cancelListing`, `updateListing`) in `use-marketplace-listing-mutations.ts` |
| D.1.4 | Target: `ProductDetailView.tsx` ≤250 righe |

**File già estratti (non duplicare):** `components/feature/product/detail/*` (17 componenti).

---

## D.2 — `AsteDetailView` (~1011 righe)

| Step | Azione |
|------|--------|
| D.2.1 | Creare `lib/hooks/use-auction-detail-page.ts` — bid state, proxy, sticky header |
| D.2.2 | Spostare normalizzazione stats (`viewCount`/`viewersCount`) in `auction-adapter.ts` |
| D.2.3 | ✅ coperto da **Fase 0.1** (`useEnrichedAuction`/`useEnrichedBidRows`/`useEnrichedAuctions`) — non è "già usato altrove", era duplicato inline in 7 file |
| D.2.4 | Target: `AsteDetailView.tsx` ≤300 righe |

**File già estratti:** `components/feature/aste/detail/*`.

---

## D.3 — `ScambiProponiModal` (~1271 righe)

| Step | Azione |
|------|--------|
| D.3.1 | Estrarre `useTradeProposalForm` — selected ids, credits, quantities, inventory fetch |
| D.3.2 | Split UI: `TradeOfferPanel`, `TradeRequestPanel`, `TradeProposalSummary` |
| D.3.3 | Inventory fetch via `use-auction-picker-inventory` o hook dedicato scambi |
| D.3.4 | Target: modal orchestrator ≤350 righe |

---

## D.4 — `SellSingleWizard` (~1035 righe)

| Step | Azione |
|------|--------|
| D.4.1 | Replicare pattern `AuctionCreateWizard` + `wizard/` già fatto per aste |
| D.4.2 | Spostare validazione in `lib/marketplace/sell-single-validation.ts` |
| D.4.3 | Target: wizard shell ≤200 righe + step components |

---

# Fase E — Layout e tabelle

## E.1 — Split `TopBar.tsx` (~779 righe)

```
components/layout/top-bar/
  TopBar.tsx                 ← composizione
  TopBarAuthSection.tsx      ← login inline / avatar menu
  TopBarNavMenus.tsx         ← acquisti, vendi, account dropdown
  TopBarGamePicker.tsx
  use-top-bar-menus.ts       ← click-outside, open state
```

**Acceptance criteria:**
- [ ] `TopBar.tsx` ≤120 righe
- [ ] Login form resta funzionale (react-hook-form + zod)
- [ ] Nessuna regressione menu mobile (HamburgerMenu dynamic import invariato)

---

## E.2 — Slim `ModernSellerTable.tsx` (~1242 righe)

| Step | Azione |
|------|--------|
| E.2.1 | Estrarre `SellerTableRow.tsx`, `SellerTableHeader.tsx` |
| E.2.2 | Spostare `CONDITION_TEXT_TO_CODE` in `lib/marketplace/condition-map.ts` |
| E.2.3 | Fix import fuori posto (riga ~49: spostare in cima file) |
| E.2.4 | Foto listing via hook esistente o `useListingPhotos` |
| E.2.5 | Target: file principale ≤400 righe |

---

## E.3 — Eliminare prop `t` dove possibile

| File | Azione |
|------|--------|
| `OggettiTable.tsx`, `OggettiMobileList.tsx` | Usare `useTranslation()` internamente |
| `AuctionProductMeta.tsx` | Idem |
| `VendiPageShell.tsx` | Valutare se server component può passare labels pre-tradotte |

**Eccezione:** componenti renderizzati in contesti senza provider i18n (test isolati) possono mantenere prop opzionale.

---

# Fase F — BFF scanner (fuori scope FE puro)

> **Blocco 2** della review. Richiede creazione `app/api/scanner/*`. Assegnare a chi può toccare il BFF.

| Issue | File | Route BFF da creare |
|-------|------|---------------------|
| F.1 | `hooks/useBrxScanner.ts:619` | `app/api/scanner/search-vector/route.ts` |
| F.2 | `hooks/useBrxScanner.ts:666` | `app/api/scanner/verify/route.ts` |
| F.3 | `hooks/useBrxScanner.ts:772` | `app/api/scanner/scan/route.ts` |
| F.4 | `lib/scanner/onnx-loader.ts` | `app/api/scanner/presigned/route.ts` |

Dopo F.1–F.4: rimuovere rewrite diretto `/brx-match` da `next.config.mjs` (con smoke test scanner).

---

# Fase G — TODO backend (tracciati, non FE puro)

Vedi `docs/backlog/fe-open-todos.md` (FE-TODO-001 … FE-TODO-005). Il frontend può preparare hook/mutation stub, ma il merge va bloccato finché il BFF non espone gli endpoint.

| ID | Preparazione FE possibile |
|----|---------------------------|
| FE-TODO-001/002 | Tipi request/response + `useRegisterStepMutation` stub |
| FE-TODO-003 | `usePayoutBankAccountMutation` + form validation |
| FE-TODO-004/005 | `useSellerOnboardingMutation` + step wizard |

---

# Ordine di esecuzione consigliato

```
Settimana 0:    0.1 → 0.3 → 0.2 → 0.4   (quick wins DRY, PR piccoli indipendenti)
Settimana 1–2:  A.1 → A.2 → A.3
Settimana 2–3:  A.4 → A.5
Settimana 3:    B.1 (quick win, PR piccolo)
Settimana 4:    C.1 → C.2 → C.3
Settimana 5–6:  D.1 → D.2 (parallelo possibile)
Settimana 7+:   D.3, D.4, E.1, E.2, B.2
Backlog infra:  F (BFF), G (backend)
```

Ogni fase = **1 PR reviewabile** (max ~400 righe diff nette). Evitare mega-PR che mescolano sync + auth + acquisti.

---

# Template PR per task del piano

```markdown
## Refactoring plan
- Fase: A.3
- Issue: mutazioni inventario via React Query

## Cambiamenti
- Aggiunto `lib/hooks/use-inventory-mutations.ts`
- `OggettiTable` usa hook; rimosso syncClient diretto

## Test plan
- [ ] Delete singolo item da tabella
- [ ] Edit condizione/lingua/prezzo
- [ ] Bulk delete 3+ items
- [ ] Sync now + polling banner
- [ ] npm run typecheck && npm run lint
```

---

# Rischi e mitigazioni

| Rischio | Mitigazione |
|---------|-------------|
| Regressione sync polling | Test manuale sync Cardmarket; confronto log task id prima/dopo |
| Split auth-store rompe login | Branch dedicato; test login/MFA/logout su staging |
| Mock orders nascosti in prod | `FEATURES.mockOrders` default `false`; assert in CI |
| PR troppo grandi | Limite 400 righe diff; split meccanico prima, RQ dopo |
| Cache RQ vs localStorage (lezione 6.8) | Non migrare `use-user-country` a RQ pura; documentato in review |

---

# Riferimenti

- Review completa sessione 1–6: `docs/reviews/2026-06-21-frontend.md`
- TODO backend aperti: `docs/backlog/fe-open-todos.md`
- Regole architettura: `CLAUDE.md` §1–3

---

# Checklist rapida pre-merge (ogni PR)

- [ ] `npm run typecheck` — 0 errori
- [ ] `npm run lint` — 0 errori
- [ ] Se i18n: `npm run i18n:keys`
- [ ] Nessun nuovo `useEffect` + fetch per dati server
- [ ] Nessun nuovo accesso diretto microservizi dal browser
- [ ] File toccato non supera +100 righe nette senza giustificazione nel PR body
