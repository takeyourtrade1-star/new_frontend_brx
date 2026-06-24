# Piano 4 — Performance & Bundle

**Obiettivo:** Ridurre bundle, abilitare ottimizzazione immagini, lazy loading, code splitting.

> 🔎 **Review piano vs codebase (2026-06-23).** File recuperato da git history
> (commit `39f0b54`). Gran parte di questo piano è **verificabile solo a runtime**
> (i criteri di accettazione richiedono Lighthouse/bundle-analyzer/build di
> produzione): quelle parti non vanno applicate alla cieca. Applicate **solo le
> parti sicure, isolate e verificabili per logica/typecheck**. typecheck + lint a
> 0 errori dopo le modifiche.
>
> **Stato sintetico:**
> - ✅ **4.2 (ScannerModal)** lazy `dynamic({ ssr:false })` nei 2 consumer — FATTO.
> - ✅ **4.2 (MobileCardCropper)** lazy component + funzione via `await import()` — FATTO (build OK).
> - ✅ **4.4** Parallelizzazione `useSetPageCards` (concorrenza 5, ordine preservato) — FATTO.
> - ✅ **4.5** `priority` su LCP — **VERIFICATO: già a posto** (vedi nota).
> - 🟡 **4.1** `formats` AVIF/WebP FATTO; rimozione `unoptimized` **NON fatta di proposito** (vedi nota).
> - 🟡 **4.3** framer-motion → CSS — **FATTO 2 file** (`offline`, `AuctionQrButton`); resto rimandato (vedi nota).
> - 🟡 **4.6** staleTime per famiglia — **FATTO IN PARTE** (solo casi netti, vedi nota).
> - 🟡 **4.7** SW NetworkOnly — **FATTO (ordering corretto); da verificare su prod** (vedi nota).
> - ⛔ **4.8** CLS header fallback — **RIMANDATO + claim errato** (vedi nota).
> - 🟡 **4.9** CI bundle budget — **FATTO come job NON bloccante** (vedi nota).

---

## 4.1 Rimuovere `unoptimized={true}` da immagini CDN

**File:** 20+ file con 471+ occorrenze

Azioni:

1. Verificare `next.config.mjs` ha `*.cloudfront.net` in `remotePatterns` (già presente)
2. Aggiungere `formats: ['image/avif', 'image/webp']` in `images`
3. Rimuovere `unoptimized` gradualmente (testare con bundle analyzer)
4. Tenere `unoptimized` solo per lightbox (URL firmati dinamici) e `data:` URL

> 🟡 **FATTO il pezzo sicuro; rimozione di massa NON fatta di proposito (2026-06-24).**
> Conteggio reale: **87 occorrenze in 47 file** (non "471+").
>
> ✅ **`formats: ['image/avif','image/webp']`** aggiunto a `next.config.mjs`. NON è
> un no-op: ci sono **molte** immagini che già passano dall'optimizer (~118
> `<Image>`, solo ~28 con `unoptimized`; più 7 `unoptimized={false}` espliciti) →
> queste ora vengono servite in AVIF/WebP. **build di produzione OK** (exit 0).
>
> ⛔ **Rimozione `unoptimized` dalle CDN: NON applicata.** Il premise del piano è
> in conflitto con una **convenzione deliberata già nel codebase**:
> - `OggettiTable.tsx:365` / `OggettiMobileList.tsx:226`:
>   `unoptimized={imgUrl.startsWith('http') || imgUrl === defaultImage}` →
>   ottimizza le immagini **locali**, lascia `unoptimized` quelle **http/CDN**.
> - `ProductDetailCardSection.tsx` usa `unoptimized={false}` dove vuole ottimizzare.
> Le immagini CDN sono `unoptimized` **per scelta** (già su CloudFront, costi/latency
> dell'optimizer Amplify, possibili URL firmati). Rimuoverle a tappeto è una
> decisione architetturale + va verificata visivamente su preview, non un fix
> meccanico → lasciata alla decisione dell'utente.

---

## 4.2 Lazy load scanner + cropper

**File:** `components/feature/aste/create/MobileCardCropper.tsx`, `components/feature/scanner/ScannerModal.tsx`

```tsx
const MobileCardCropper = dynamic(
  () => import('./MobileCardCropper').then(m => m.MobileCardCropper),
  { ssr: false, loading: () => <Skeleton className="aspect-[5/7]" /> }
);
```

Applicare stesso pattern a `ScannerModal` nei consumer (`AuctionCreateCardPicker`, `AuctionMobilePairingUpload`).

> ✅ **ScannerModal FATTO (2026-06-23).** Convertito a `dynamic({ ssr:false })`
> nei consumer reali: `AuctionCreateCardPicker.tsx` e
> `AuctionCreateGenericSearch.tsx` (il piano citava `AuctionMobilePairingUpload`
> ma lì non c'è `ScannerModal`). È renderizzato già condizionalmente
> (`{scannerOpen && ...}`), quindi onnxruntime-web (~1.1MB) ora si scarica solo
> all'apertura dello scanner.
>
> ✅ **MobileCardCropper FATTO (2026-06-23).** Il modulo importava staticamente
> `react-advanced-cropper`; il consumer `AuctionMobilePairingUpload.tsx` usava 3
> binding (componente + `exportMobileCropFile` runtime + `type CropMode`). Reso
> dynamic **sia** il componente (`dynamic({ ssr:false })` con fallback aspect-ratio)
> **sia** la funzione (`await import()` al submit, modulo già in cache dalla vista
> crop), lasciando solo `import type CropMode`. Così il cropper esce dal bundle
> iniziale e si carica solo nella vista crop. **build di produzione OK** (exit 0).

---

## 4.3 Sostituire framer-motion con CSS dove possibile

**File:** 15+ import statici di framer-motion

Azioni:

- `app/offline/page.tsx`, `AuctionQrButton`, `HamburgerMenu` (transizioni base), `ScannerBetaNotice` → sostituire con Tailwind `transition`/`hover:scale-105`
- Mantenere framer-motion solo per: `LandingHeroCarousel`, `LandingWelcome`, `BrxExpressLanding`, `LandingPlatformSections`, `AuctionMobilePairingUpload`, `TournamentVideoOverlay`, `IOSInstallPrompt/Tutorial`

> 🟡 **FATTO 2 file a basso rischio (2026-06-24); resto rimandato.**
> - ✅ `app/offline/page.tsx`: rimosso framer; float/wobble infiniti → 2 keyframes
>   nuove in `tailwind.config.ts` (`offline-float`, `offline-wobble`), ingressi →
>   `animate-auth-enter` (keyframe già esistente) con `[animation-delay]`, hover/tap
>   → `hover:scale-105 active:scale-95` (entrance spostata su wrapper per non
>   confliggere col transform dell'hover).
> - ✅ `components/feature/aste/AuctionQrButton.tsx`: `AnimatePresence`/`motion` →
>   utility di `tailwindcss-animate` (`animate-in fade-in zoom-in-95
>   slide-in-from-bottom-2`). Trade-off accettato: si perde l'animazione di
>   **uscita** (chiusura modal istantanea); l'entrata è preservata.
> - ⛔ **`ScannerBetaNotice`**: il piano lo cita ma **non importa framer-motion**
>   (claim errato) → niente da fare.
> - ⛔ **`HamburgerMenu`**: rimandato. È la **nav principale** (alto blast radius,
>   nel bundle iniziale) con `AnimatePresence` su apri/chiudi drawer: la
>   sostituzione CSS va verificata a runtime → non alla cieca.
> - ⛔ Gli altri (`Landing*`, `BrxExpress*`, `TournamentVideoOverlay`,
>   `IOSInstall*`, `AuctionMobilePairingUpload`) restano su framer per decisione di
>   governance (PLAN.md BLOC-8).
>
> **Verifiche:** typecheck + lint a 0; framer-motion assente nei 2 file; `npm run
> build` exit 0.

---

## 4.4 Parallelizzare `useSetPageCards`

**File:** `lib/hooks/use-search.ts:90-119`

Sostituire `for` loop sequenziale con `Promise.all` con limite di 4-6 concorrenze.

**Verifica:** Set con 500 carte deve completare in <2s invece di N round-trip sequenziali.

> ✅ **FATTO (2026-06-23).** `lib/hooks/use-search.ts`: il `for` sequenziale sulle
> pagine 2..N è ora un pool con **concorrenza 5** che indicizza i risultati per
> posizione e li appiattisce in ordine → **output identico**, solo più veloce.
> Concorrenza limitata per non martellare il BFF `/api/search`.

---

## 4.5 Aggiungere `priority` su immagini LCP

**File:** `AsteHubPage.tsx:544`, `AsteInCorsoCarousel.tsx:411`, `LandingWelcome.tsx`, `ProductDetailView.tsx`

Aggiungere `priority` alle immagini above-the-fold della prima viewport.

> ✅ **VERIFICATO: già a posto / nulla di sicuro da fare (2026-06-23).** Controllo
> dei 4 target del piano:
> - `LandingWelcome.tsx:259` → l'hero ha **già** `priority`.
> - `ProductDetailView.tsx` → nessun `<Image>` diretto; i sotto-componenti
>   (`ProductDetailCardSection`) hanno **già** `priority`.
> - `AsteHubPage.tsx:539` → è dentro `EndingSoonCard`, una **card in lista/carosello**:
>   mettere `priority` precaricherebbe TUTTE le immagini → sbagliato.
> - `AsteInCorsoCarousel.tsx:413` → item di carosello con `priority={false}`
>   **deliberato** (stesso motivo).
> Dove `priority` aveva senso (hero above-the-fold) è già presente; sugli altri
> sarebbe un anti-pattern. Nessuna modifica applicata.

---

## 4.6 React Query staleTime per famiglia

**File:** `components/providers.tsx:77-86`, vari hook

```ts
// hooks/query-config.ts
export const STALE = {
  auction: 0, // live
  listings: 30_000,
  reprints: 24 * 60 * 60 * 1000,
  catalog: 60_000,
} as const;
```

Applicare `staleTime: STALE.auction` in `use-auctions.ts`, ecc.

> 🟡 **FATTO IN PARTE — solo i casi netti (2026-06-23).** Creato
> `lib/hooks/query-config.ts` (non `hooks/`, per stare accanto ai consumer in
> `lib/hooks/`) con `STALE = { catalog: 60s, reprints: 24h }`.
> - ✅ **reprints**: `use-product-reprints.ts` passa da `staleTime: 60s` a
>   `STALE.reprints` (24h) + `gcTime: 24h` — dato di catalogo immutabile, era un
>   refetch ogni minuto. **Miglioramento netto.** (Lasciato `cache:'no-store'`
>   sul fetch: HTTP-cache è tema separato, vedi PLAN.md 14.2; con staleTime 24h
>   l'impatto è comunque marginale.)
> - ✅ **catalog**: `useSearchCards` e `useSetSearch` (entrambi già 60s) ora usano
>   `STALE.catalog` — **behavior-preserving**, solo centralizzazione.
> - ⛔ **NON toccati di proposito**: aste (`use-auctions`: 30s/10s/5s) e listing
>   (`use-marketplace-listings`: 15s/60s) sono dati **live** con granularità
>   deliberata; mapparli su una singola costante (es. il `auction:0` del piano)
>   ne cambierebbe il comportamento aumentando il carico. Restano dove sono.
>   `useSetPageCards` (120s) lasciato invariato.

---

## 4.7 Service Worker NetworkOnly per `/api/*` privati

**File:** `app/sw.ts`

```ts
runtimeCaching: [
  ...defaultCache,
  {
    matcher: ({ url }) => url.pathname.startsWith('/api/'),
    handler: new NetworkOnly(),
  },
]
```

Eccezione: `/api/search` pubblico può cachare.

> 🟡 **FATTO con ordering corretto (2026-06-24).** `app/sw.ts`: `runtimeCaching` è
> ora `[{ /api privato → NetworkOnly }, ...defaultCache]` — la regola custom è
> **PRIMA** di `defaultCache` (Serwist usa il primo matcher che corrisponde; lo
> snippet del piano la metteva erroneamente dopo). Matcher:
> `sameOrigin && pathname.startsWith('/api/') && !pathname.startsWith('/api/search')`
> → le API private non vengono mai cachate dal SW; `/api/search` (pubblico) resta a
> `defaultCache`. `NetworkOnly` importato da `serwist`.
> **Verifiche:** typecheck + lint a 0; **`npm run build` exit 0** e il SW generato
> (`public/sw.js`) contiene il literal `api/search` del nuovo matcher.
> ⚠️ **DA VERIFICARE SU PROD:** il SW è disabilitato in dev (`next.config.mjs:12`),
> quindi il comportamento runtime va confermato su build di produzione (DevTools →
> Application → Service Workers / Network: le risposte `/api/*` private devono
> risultare sempre "from network", mai "from ServiceWorker").

---

## 4.8 Fix CLS in Suspense Header fallback

**File:** `app/aste/page.tsx`, `app/aste/[id]/page.tsx`, `app/products/page.tsx`, `app/search/page.tsx`

Sostituire `<div className="h-[120px] bg-[#1D3160]" />` con `<HeaderSkeleton className="h-[88px] md:h-[104px]" />` che mantiene altezza reale.

> ⛔ **RIMANDATO + CLAIM ERRATO (2026-06-23).** `HeaderSkeleton` **non esiste**, e
> il fallback attuale è `h-[120px]` (altezza fissa) usato in ~12 file, non solo i
> 4 citati (`app/products/page.tsx` non usa questo pattern).
> Evidenza dal codice: `components/layout/Header.tsx` è `position: fixed` e
> **auto-misura la propria altezza** (`useLayoutEffect` + `ResizeObserver`,
> righe 36-51) renderizzando uno spacer di altezza reale; in cima c'è un
> `DemoBanner` opzionale → l'altezza è **dinamica** (mobile/desktop, banner on/off,
> stato auth), NON 120px fissi. Un fallback ad altezza fissa non causa CLS di per
> sé: il CLS dipende dalla differenza tra fallback e altezza reale misurata.
> Indovinare `h-[88px] md:h-[104px]` può **introdurre** CLS. Fix corretto: legare
> il fallback all'altezza reale (CSS var / misura), non a numeri fissi. Richiede
> misura a runtime (Lighthouse/DevTools). Non applicabile alla cieca.

---

## 4.9 Bundle budget check

**File:** `scripts/check-bundle-budget.mjs` (esiste)

Verificare soglie budget, aggiungere CI check su PR.

> 🟡 **FATTO come job NON bloccante (2026-06-24).** Aggiunto a
> `.github/workflows/ci.yml` il job `bundle-budget` con `continue-on-error: true`
> (stesso pattern del job `test` esistente): esegue `npm run build:budget` e
> stampa nei log della PR i chunk/route/CSS più grandi + eventuali sforamenti,
> **senza bloccare il merge**. Per promuoverlo a gate basta togliere
> `continue-on-error`. Lo script e gli npm script (`bundle:budget`, `build:budget`)
> esistevano già.

---

## Criteri di accettazione

- `npm run build` completato senza warning
- `npm run analyze` mostra bundle first load JS < 250 kB per route principale
- LCP < 2.5s su `/products/[slug]` e `/aste/[id]` (misurato con Lighthouse)
- CLS < 0.1 su pagine listing
- Nessuna immagine CDN con `unoptimized={true}` (eccetto lightbox e data URL)
