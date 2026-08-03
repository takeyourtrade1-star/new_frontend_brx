# Frontend — Piano interventi code review (2026-06-22)

**Data:** 2026-06-22  
**Origine:** code review strutturata (React lifecycle, state/async, sicurezza, UI/UX edge cases)  
**Perimetro:** `components/`, `lib/hooks/`, `lib/config.ts`, `lib/meilisearchClient.ts` — BFF (`app/api/*`) solo dove indicato esplicitamente  
**Relazione:** complementare a `fe-refactoring-plan.md` (debito strutturale) e `fe-open-todos.md` (TODO inline)

---

## Executive summary

| Severità | Item | Effort stimato | PR suggerita |
|----------|------|----------------|--------------|
| CRITICAL | 1 | S | PR-1 |
| HIGH | 4 | M–L | PR-2, PR-3 |
| MEDIUM | 5 | M | PR-4, PR-5 |
| LOW | 2 | S–M | PR-6 |

**Ordine consigliato:** PR-1 → PR-2 → PR-3 → PR-4 → PR-5 → PR-6 (dipendenze minime tra PR-1 e PR-2).

**Gate qualità (ogni PR):** `npm run typecheck` + `npm run lint` a 0. Se tocchi i18n: `npm run i18n:keys`.

---

## Tracciamento item

| ID | Sev. | Titolo | File principali | Stato |
|----|------|--------|-----------------|-------|
| FE-CR-001 | CRITICAL | Loader infinito errore API asta | `AsteDetailView.tsx` | ✅ |
| FE-CR-002 | HIGH | Fallback enrichment aste (hook) | `use-enriched-auctions.ts`, consumer | ⬜ |
| FE-CR-003 | HIGH | Fallback enrichment product detail | `use-enriched-card-auctions.ts`, `ProductAuctionsPanel.tsx` | ⬜ |
| FE-CR-004 | HIGH | Meilisearch key fuori dal bundle | `meilisearchClient.ts`, `GlobalSearchBar.tsx`, BFF | ✅ |
| FE-CR-005 | HIGH | Stale closure conferma offerta | `AuctionBidPanel.tsx` | ⬜ |
| FE-CR-006 | MEDIUM | Timer leak search bar | `SearchWithInstantSearch.tsx` | ⬜ |
| FE-CR-007 | MEDIUM | Token auth desync localStorage | ~12 file con pattern duplicato | ⬜ |
| FE-CR-008 | MEDIUM | OggettiContent spinner senza login CTA | `OggettiContent.tsx` | ⬜ |
| FE-CR-009 | MEDIUM | Interval countdown duplicati | `use-now-tick.ts`, `providers.tsx` | ⬜ |
| FE-CR-010 | MEDIUM | Race polling sync inventario | `OggettiContent.tsx` | ⬜ |
| FE-CR-011 | LOW | Sanitize SVG mascotte | `CardMascotteWidget.tsx` | ⬜ |
| FE-CR-012 | LOW | Virtualizzazione tabella inventario | `OggettiTable.tsx` | ⬜ |

---

## FE-CR-001 — Loader infinito su errore API asta

**Stato (2026-08-03):** ✅ chiuso. La pagina distingue loading/error/ready, usa il dettaglio base durante l'enrichment e offre un retry esplicito.

**Severità:** CRITICAL  
**File:** `components/feature/aste/AsteDetailView.tsx`

### Problema

La guard `if (isLoading || !detail)` tratta ogni `detail === null` come loading. Se `useAuctionDetail` fallisce (404, 500, rete) o l’ID è invalido, `isLoading` diventa `false` ma `detail` resta `null` → spinner infinito. Esiste `app/aste/[id]/error.tsx` ma non viene raggiunto (nessun throw, nessun branch errore).

### Soluzione

1. Destructure `isError`, `error`, `refetch` da `useAuctionDetail`.
2. Introdurre `resolvedDetail = detail ?? baseDetail` (vedi FE-CR-002) per non bloccare su enrichment.
3. Tre stati UI distinti: **loading** (`isLoading`), **error** (`isError || !resolvedDetail` dopo fetch), **success**.
4. Branch errore: messaggio i18n + pulsante retry (`refetch()`).
5. In dev: mostrare `error.message` (come già fa `error.tsx`).

### Chiavi i18n da aggiungere (6 lingue)

- `auctions.detailLoadError` — messaggio utente
- Riutilizzare `common.retry` se già presente, altrimenti aggiungere

### Criteri di accettazione

- [ ] Navigare a `/aste/999999999` (inesistente) mostra errore + retry, non loader infinito
- [ ] Simulare 500 (dev tools / mock) → stesso comportamento
- [ ] Retry con asta valida carica il dettaglio
- [ ] `npm run typecheck` + `npm run lint` OK

### Test manuali

1. Apri asta valida → dettaglio OK  
2. Apri ID inesistente → errore + retry  
3. Throttle network offline → errore dopo timeout, non spinner eterno  

---

## FE-CR-002 — Fallback enrichment aste (useEnrichedAuctions)

**Severità:** HIGH  
**File:** `lib/hooks/use-enriched-auctions.ts`  
**Consumer:** `AsteDetailView.tsx`, `AsteInCorsoCarousel.tsx`, `AsteHubPage.tsx`, `AsteMyListingsPage.tsx`, `AsteParticipationsPage.tsx`, `UserProfileAuctionsPanel.tsx`, `ProductAuctionsPanel.tsx`

### Problema

Gli hook inizializzano `enriched` a `[]` / `null` e non fanno fallback su `base`. Durante l’await di `enrichAuctionsWithPublicUsers`:

- `AsteInCorsoCarousel` mostra “Nessuna asta attiva” con dati già caricati
- `AsteDetailView` resta in loader full-page anche con `baseDetail` pronto
- Liste hub/partecipazioni flashano vuote

### Soluzione

**Opzione A (consigliata — minimo diff):**

```ts
// useEnrichedAuction
return enriched ?? base;

// useEnrichedAuctions — fallback mentre enriching
if (base.length > 0 && enriched.length === 0) return base;
return enriched;

// useEnrichedBidRows — stesso pattern
if (base.length > 0 && enriched.length === 0) return base;
return enriched;
```

**Opzione B (allineamento architetturale):** migrare tutti i consumer a React Query come `useEnrichedCardAuctions` (FE-CR-003), poi deprecare `use-enriched-auctions.ts`.

### Aggiornamenti consumer

| File | Modifica |
|------|----------|
| `AsteDetailView.tsx` | Usare `resolvedDetail = detail ?? baseDetail`; guard loading solo su `isLoading`, non su enrichment |
| `AsteInCorsoCarousel.tsx` | Non mostrare empty state se `liveAuctionsBase.length > 0 && liveAuctions.length === 0` |
| Altri consumer | Verificare che empty state dipenda da dati API, non da enrichment pending |

### Criteri di accettazione

- [ ] Carousel aste live non flasha “nessuna asta” tra fetch API e enrichment
- [ ] Dettaglio asta mostra titolo/prezzo subito dopo API (seller name può arrivare dopo)
- [ ] Nessuna regressione su nomi venditore dopo enrichment completato

---

## FE-CR-003 — Fallback enrichment product detail

**Severità:** HIGH  
**File:** `lib/hooks/use-enriched-card-auctions.ts`, `components/feature/product/ProductAuctionsPanel.tsx`, `ProductDetailView.tsx`

### Problema

`return query.data ?? []` restituisce array vuoto in `pending` anche quando `baseAuctions` ha elementi → `ProductAuctionsPanel` mostra empty state errato (`!loading && !hasCardAuctions`).

### Soluzione

```ts
export function useEnrichedCardAuctions(baseAuctions: AuctionUI[]) {
  const query = useQuery({
    queryKey: productDetailKeys.enrichedAuctions(auctionIds),
    queryFn: () => enrichAuctionsWithPublicUsers(baseAuctions),
    enabled: baseAuctions.length > 0,
    staleTime: 30_000,
    placeholderData: (prev) => prev ?? baseAuctions,
  });
  return query.data ?? baseAuctions;
}
```

Aggiornare `ProductAuctionsPanel`: considerare `cardQuery.isFetching` o `enrichedCard.length === 0 && baseCardAuctions.length > 0` come stato “enrichment in corso”, non empty.

### Criteri di accettazione

- [ ] Tab aste su product detail non mostra “nessuna asta” quando ce ne sono
- [ ] Griglia recommended idem
- [ ] Cache RQ invalidata correttamente al cambio carta

---

## FE-CR-004 — Meilisearch API key fuori dal bundle client

**Stato (2026-08-03):** ✅ chiuso. Il client usa esclusivamente `/api/search/autocomplete`; host e chiave sono letti solo dai moduli/route server.

**Severità:** HIGH (CRITICAL se in prod è master key)  
**File:** `lib/meilisearchClient.ts`, `lib/config.ts`, `components/layout/GlobalSearchBar.tsx`  
**BFF nuovo:** `app/api/search/meili-proxy/` (o estensione route esistente)

### Problema

InstantSearch chiama Meilisearch direttamente dal browser con `NEXT_PUBLIC_MEILISEARCH_API_KEY`. Pattern opposto a `/api/search/cards-by-ids` (già BFF-safe). Rischio: key master nel bundle → indicizzazione/cancellazione documenti da chiunque ispezioni il JS.

### Soluzione (fasi)

**Fase 1 — Audit infra (no codice):**

- [ ] Verificare in Amplify/env che la key esposta sia **search-only** con filtri/indice limitati
- [ ] Documentare in `docs/` quale key è usata

**Fase 2 — BFF proxy (codice):**

1. Route handler che inoltra richieste InstantSearch a Meilisearch server-side (`MEILISEARCH_API_KEY` senza `NEXT_PUBLIC_`)
2. Aggiornare `instantMeiliSearch(host: '/api/search/meili-proxy', apiKey: undefined)`
3. Rate limit + timeout sul proxy (allineato ad altri BFF)
4. Rimuovere fallback client a `MEILISEARCH_API_KEY` / `MEILI_API_KEY` in `lib/config.ts` per uso browser

**Fase 3 — Cleanup:**

- [ ] Rimuovere `NEXT_PUBLIC_MEILISEARCH_API_KEY` dal bundle se non più necessaria
- [ ] Aggiornare `.env.example` e doc deploy

### Criteri di accettazione

- [ ] Ricerca globale funziona (autocomplete + risultati)
- [ ] Nessuna `Authorization: Bearer` Meili visibile in Network tab verso host esterno
- [ ] `npm run build` — verificare chunk client non contiene API key (grep su `.next/static`)

### Dipendenze / rischi

- Richiede approvazione modifica `app/api/*`
- Smoke test CSP (`next.config.mjs`) se il proxy cambia path

---

## FE-CR-005 — Stale closure conferma offerta asta

**Severità:** HIGH  
**File:** `components/feature/aste/AuctionBidPanel.tsx` (righe ~342–368)

### Problema

`executeBid` ha `eslint-disable react-hooks/exhaustive-deps` e omette `onSubmitOffer`, `onSubmitMaxBid`, `translateApiError`. Callback parent non memoizzate o aggiornate dopo evento WS possono restare stale al momento della conferma.

### Soluzione

Pattern ref stabili:

```ts
const onSubmitOfferRef = useRef(onSubmitOffer);
const onSubmitMaxBidRef = useRef(onSubmitMaxBid);
useEffect(() => { onSubmitOfferRef.current = onSubmitOffer; }, [onSubmitOffer]);
useEffect(() => { onSubmitMaxBidRef.current = onSubmitMaxBid; }, [onSubmitMaxBid]);

const executeBid = useCallback(async () => {
  // ...
  if (type === 'direct') onSubmitOfferRef.current(amount);
  else onSubmitMaxBidRef.current(amount);
}, [pendingAction, minBid, placeBidMutation, t, translateApiError]);
```

Rimuovere `eslint-disable` se possibile.

### Criteri di accettazione

- [ ] Offerta diretta aggiorna UI parent (`myLastOfferEur`) anche dopo refresh WS
- [ ] Offerta massima aggiorna `myMaxBidEur` nel parent
- [ ] Nessun warning exhaustive-deps nel file

---

## FE-CR-006 — Timer leak search bar

**Severità:** MEDIUM  
**File:** `components/layout/search/SearchWithInstantSearch.tsx`

### Problema

`typingTimeoutRef` e `energyDecayRef` creati in `onChange` senza cleanup all’unmount → possibile `setState` su componente smontato (navigazione durante digitazione).

### Soluzione

```ts
useEffect(() => {
  return () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (energyDecayRef.current) clearTimeout(energyDecayRef.current);
  };
}, []);
```

### Criteri di accettazione

- [ ] Digitare nella search bar e navigare via route → nessun warning React “state update on unmounted component” in console

---

## FE-CR-007 — Token auth desync (localStorage bypass)

**Severità:** MEDIUM  
**File:** ~12 occorrenze — `OggettiContent.tsx`, `ProductDetailView.tsx`, `AuctionCreateCardPicker.tsx`, `ScambiProponiModal.tsx`, `SincronizzazioneContent.tsx`, `lib/api/*-client.ts`, ecc.

### Problema

Pattern `useAuthStore(s => s.accessToken ?? localStorage.getItem('ebartex_access_token'))` bypassa lo store. Dopo logout/refresh, store e localStorage possono divergere.

### Soluzione

Allineato a `fe-refactoring-plan.md` (selector token unificato):

1. Aggiungere selector in `lib/stores/auth-store.ts`:

   ```ts
   export const selectAccessToken = (s: AuthState) => s.accessToken;
   ```

2. Sostituire tutte le occorrenze del pattern duplicato con `useAuthStore(selectAccessToken)`
3. Nei client API (`auction-client`, `orders-client`, …): usare `tokenManager` / store, non `localStorage` diretto
4. Grep gate: `localStorage.getItem('ebartex_access_token')` → 0 in `components/`, ≤1 in layer API centralizzato

### Criteri di accettazione

- [ ] Logout invalida token ovunque (nessuna chiamata autenticata con token stale)
- [ ] Refresh token proattivo aggiorna store → UI coerente
- [ ] Metrica duplicazione token da refactoring plan: ~12 → 1

---

## FE-CR-008 — OggettiContent: spinner al posto di login CTA

**Severità:** MEDIUM  
**File:** `components/feature/account/OggettiContent.tsx` (~riga 549)

### Problema

`if (!user || !accessToken)` renderizza spinner “Caricamento oggetti…” — indistinguibile da fetch lento; utente non autenticato bloccato senza azione.

### Soluzione

Branch esplicito:

- Durante `initializeAuth` / `isLoading` auth → spinner breve
- Sessione assente confermata → messaggio + link `/login`
- Riutilizzare pattern esistente (`LoginGateModal` o componente account shared se presente)

### Chiavi i18n

- `accountPage.loginRequired` (se non esiste)

### Criteri di accettazione

- [ ] Utente logged out vede CTA login, non spinner infinito
- [ ] Utente logged in vede inventario normalmente

---

## FE-CR-009 — Interval countdown duplicati (useNowTick)

**Severità:** MEDIUM  
**File:** `lib/hooks/use-now-tick.ts`, `components/providers.tsx`  
**Consumer:** `AsteDetailView`, `AsteHubPage`, `AsteParticipationsPage`, `AsteMyListingsPage`, `ProductAuctionsPanel`, `UserProfileAuctionsPanel`

### Problema

Ogni `useNowTick()` crea un `setInterval(1000)` dedicato. Su pagine con più pannelli asta → N interval e N re-render/s.

### Soluzione

1. Creare `lib/contexts/NowTickContext.tsx` con un solo interval
2. Montare `NowTickProvider` in `components/providers.tsx` (o solo sotto layout `/aste` se si vuole scope limitato)
3. `useNowTick()` legge dal context
4. Rimuovere interval inline duplicati (es. in `UserProfileAuctionsPanel`, `AsteInCorsoCarousel` se presenti)

### Criteri di accettazione

- [ ] Una sola interval attiva per tab (verificabile in Performance/Memory profiler)
- [ ] Countdown aste aggiornato ogni secondo su tutti i consumer
- [ ] Nessuna regressione SSR (provider client-only)

---

## FE-CR-010 — Race condition polling sync inventario

**Severità:** MEDIUM  
**File:** `components/feature/account/OggettiContent.tsx` (`handleSyncNow`, ~209–227)

### Problema

Loop `pollTaskUntilReady` senza abort. Navigazione away o secondo sync concorrente → `setSyncStatus` / `refreshInventory` su run obsoleto.

### Soluzione

```ts
const syncRunRef = useRef(0);

const handleSyncNow = useCallback(async () => {
  const runId = ++syncRunRef.current;
  // prima di ogni setState:
  if (runId !== syncRunRef.current) return;
  // ...
}, [deps]);

useEffect(() => () => { syncRunRef.current++; }, []);
```

Valutare stesso pattern in `OggettiTable.tsx` se ha polling simile.

### Criteri di accettazione

- [ ] Avviare sync → navigare via → nessun setState warning in console
- [ ] Doppio click “Sync now” → solo l’ultimo run aggiorna UI
- [ ] Banner sync riflette l’operazione corrente

---

## FE-CR-011 — Sanitize SVG mascotte (future-proof XSS)

**Severità:** LOW (CRITICAL se wardrobe diventa user/API generated)  
**File:** `components/dev/card-mascotte/CardMascotteWidget.tsx`

### Problema

`dangerouslySetInnerHTML={{ __html: item.svg }}` — oggi SVG statici da costanti; rischio XSS se la sorgente diventa dinamica.

### Soluzione

**Opzione A:** `isomorphic-dompurify` con profilo SVG  
**Opzione B:** migrare wardrobe a componenti React SVG (no innerHTML)

Priorità bassa finché `item.svg` resta build-time static.

### Criteri di accettazione

- [ ] Nessun `dangerouslySetInnerHTML` non sanificato su input non trusted
- [ ] Mascotte render OK in dev e prod

---

## FE-CR-012 — Virtualizzazione tabella inventario

**Severità:** LOW  
**File:** `components/feature/account/oggetti/OggettiTable.tsx`, `OggettiContent.tsx`

### Problema

Paginazione a 50 righe mitiga ma view grid / futura rimozione paginazione → scroll pesante su mobile (immagini, badge, azioni per riga).

### Soluzione

- Introdurre `@tanstack/react-virtual` per tbody/grid quando `paginatedItems.length > 30`
- Mantenere paginazione server-side/f client come oggi; virtualizer solo per il viewport

### Criteri di accettazione

- [ ] Scroll fluido con 50 righe su mobile mid-range
- [ ] Selezione bulk e azioni riga funzionano con virtualizer
- [ ] Nessuna regressione accessibilità (focus keyboard)

---

## Piano PR (sequenza)

### PR-1 — Error handling asta (FE-CR-001 + parziale FE-CR-002)

**Scope:** `AsteDetailView.tsx`, chiavi i18n  
**Effort:** ~2–4 h  
**Rischio:** basso  

### PR-2 — Enrichment fallback (FE-CR-002 + FE-CR-003)

**Scope:** `use-enriched-auctions.ts`, `use-enriched-card-auctions.ts`, consumer carousel/panel  
**Effort:** ~4–6 h  
**Rischio:** medio (molti consumer da smoke-test)  

### PR-3 — Meilisearch BFF proxy (FE-CR-004)

**Scope:** nuova route API + `meilisearchClient.ts` + config  
**Effort:** ~1–2 giorni  
**Rischio:** alto — richiede deploy coordato e audit key  
**Blocco:** approvazione team infra  

### PR-4 — Bid panel + search timer (FE-CR-005 + FE-CR-006)

**Scope:** `AuctionBidPanel.tsx`, `SearchWithInstantSearch.tsx`  
**Effort:** ~2–3 h  
**Rischio:** basso  

### PR-5 — Auth token + Oggetti UX + sync race (FE-CR-007 + FE-CR-008 + FE-CR-010)

**Scope:** selector centralizzato, `OggettiContent.tsx`, client API  
**Effort:** ~1 giorno  
**Rischio:** medio — tocca molti file, merge conflicts possibili  
**Nota:** overlap con fase auth-store in `fe-refactoring-plan.md` — coordinare  

### PR-6 — NowTick context (FE-CR-009)

**Scope:** `NowTickContext`, `providers.tsx`, consumer asta  
**Effort:** ~3–4 h  
**Rischio:** basso  

### PR-7 — Backlog qualità (FE-CR-011 + FE-CR-012)

**Scope:** mascotte sanitize, virtualizer inventario  
**Effort:** ~1–2 giorni  
**Rischio:** basso, non bloccante  

---

## Smoke test checklist (post-merge completo)

| # | Scenario | Item coperti |
|---|----------|--------------|
| 1 | Dettaglio asta valida | CR-001, CR-002, CR-005, CR-009 |
| 2 | Dettaglio asta ID inesistente | CR-001 |
| 3 | Hub aste / carousel live | CR-002, CR-009 |
| 4 | Product detail → tab aste | CR-003 |
| 5 | Ricerca globale (tutte le modalità) | CR-004 |
| 6 | Offerta + WS update | CR-005 |
| 7 | Search bar type + navigate | CR-006 |
| 8 | Login → Oggetti → sync → navigate away | CR-007, CR-008, CR-010 |
| 9 | Logout → nessuna chiamata autenticata | CR-007 |
| 10 | Inventario 50+ righe scroll mobile | CR-012 |

---

## Cross-reference

| Documento | Relazione |
|-----------|-----------|
| `docs/backlog/fe-refactoring-plan.md` | FE-CR-007 overlap selector token; FE-CR-009 overlap metrica useNowTick |
| `docs/backlog/fe-open-todos.md` | Nessun overlap diretto |
| `docs/reviews/2026-06-21-frontend.md` | Review precedente; questo piano estende con finding lifecycle/sicurezza |
| `CLAUDE.md` | Regola BFF (FE-CR-004); React Query (FE-CR-002/003); i18n (CR-001, CR-008) |

---

## Note operative

- **Non** rimuovere instrumentation debug se aggiunta in sessioni successive finché non verificata — N/A per questo piano (solo documentazione).
- Preferire PR piccole e reviewable; PR-3 (Meili) va isolata per rollback facile.
- Dopo ogni PR: aggiornare colonna **Stato** nella tabella tracciamento (⬜ → ✅).
