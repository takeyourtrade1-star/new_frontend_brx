# new_plan_optimize — Piano di ottimizzazione pre-lancio (Ebartex Frontend)

> Audit pre-lancio del 2026-06-30 (5 audit specialistici + verifiche oggettive: typecheck/lint/test/i18n/knip).
> **Verdetto: NON PRONTO — lanciabile solo dopo i blocker B1–B7 + H1/H6.**
> Organizzato in **blocchi indipendenti** da spuntare man mano. Ogni blocco ha: severità, file, problema, fix, definition-of-done.

## Stato baseline (oggettivo)
- `typecheck` pulito · `lint` 0 errori (5 warning `exhaustive-deps`)
- `test` 199/199 verdi su 28 file (quasi solo unit `lib/`+`hooks/`; near-zero componenti/integrazione/E2E)
- parità chiavi i18n OK (2273 × 6) · `i18n:quality` 304 valori probabilmente non tradotti · ~1021 stringhe hardcoded segnalate
- `robots.ts` + `sitemap.ts` presenti · knip: ~40 tipi inutilizzati + 12 export duplicati + ~5.3MB font inutilizzati

## Legenda
`[ ]` da fare · `[~]` in corso · `[x]` fatto · `[-]` saltato (annota perché)

## Definizione di "fatto" globale
Prima di chiudere ogni blocco: `npm run typecheck` **e** `npm run lint` a 0 errori; se toccato i18n → `npm run i18n:keys` (+ `i18n:quality`); test verdi.

---

# 🔴 BLOCCO 0 — GATING DEL LANCIO (oggi)

Da chiudere prima di qualsiasi go-live. Rischio diretto su ricavi/compliance/integrità.

## [ ] B7 — Validare scope chiave Meilisearch esposta al browser
- **Severità:** BLOCKER (da validare) · **Area:** Sicurezza
- **File:** `.env.local`, `lib/config.ts:54-61`, `lib/meilisearchClient.ts`
- **Problema:** `NEXT_PUBLIC_MEILISEARCH_API_KEY` ha lo stesso valore della chiave server in `.env` ed è nel bundle JS (InstantSearch). Se ha scope oltre `search` → read/write sull'intero indice.
- **Fix:** Verificare sull'istanza Meili che sia chiave **search-only** (`actions: ["search"]`). Se è master/write-capable → generare tenant key search-only e ruotare. Se già search-only → ok by-design, documentarlo.
- **DoD:** Confermato scope `["search"]`; documentato in `lib/config.ts` o `docs/`.

## [ ] B6 — Integrare monitoraggio errori (Sentry o equivalente)
- **Severità:** BLOCKER (operativo) · **Area:** Production readiness
- **Problema:** Nessuna telemetria; `compiler.removeConsole` strippa i log in prod → cecità su errori runtime/checkout/auth/5xx.
- **Fix:** Sentry client+server via instrumentation hook Next.js; almeno convogliare i `console.error` dei route handler a un aggregatore.
- **DoD:** Errore di test catturato e visibile in dashboard, sia client sia server.

## [ ] B5 — Quarantena dati mock fuori dai flussi di produzione
- **Severità:** BLOCKER · **Area:** Architettura/Integrità dati
- **File:** `lib/stores/mock-purchase-store.ts`, `lib/stores/mock-support-store.ts`, `components/feature/scambi/mock-*.ts`, `components/feature/aste/mock-*.ts`, `components/feature/vendite/venditeMockData.ts`, `lib/mock-*.ts`, `lib/scambi/card-mock-value.ts`; consumatori: `AcquistiContent.tsx`, `ProductDetailView.tsx`, `app/cart/page.tsx`, `ScambiProponiModal.tsx:17`, `VenditeContent.tsx`.
- **Problema:** Flussi core (scambi, parti acquisti/vendite/supporto) renderizzano dati finti persistiti in `localStorage`.
- **Fix:** Spostare tutti i `mock-*` dietro un confine `lib/dev` + feature-flag; sostituire con hook React Query su `/api/*`; aggiungere guard di build (lint rule / knip) che vieta import `mock-*` da componenti di produzione.
- **DoD:** Nessun componente feature importa `mock-*`; lint guard attivo; flussi reali su `/api/*`.

## [ ] H1 — Non persistere refresh token in localStorage + irrobustire CSP
- **Severità:** ALTO · **Area:** Sicurezza
- **File:** `lib/stores/auth-store.ts:101-120,501-584` (persist `ebartex-auth`), `lib/auth/fetch-me.ts:28`, `next.config.mjs:86` (CSP)
- **Problema:** access+refresh token in `localStorage` (ridondanti: il BFF usa il cookie HttpOnly). Con `script-src 'unsafe-inline' 'unsafe-eval'` un XSS → account takeover.
- **Fix:** Cookie HttpOnly come unica fonte di verità; non persistere il refresh token client-side (se serve al bridge SSO, solo in memoria). CSP: passare a nonce/hash per gli inline script e `'wasm-unsafe-eval'` invece di `'unsafe-eval'`.
- **DoD:** `localStorage` senza refresh token; smoke-test scanner+animazioni senza violazioni CSP.

## [x] H6 — Localizzare messaggi di validazione registrazione/MFA — FATTO (2026-06-30)
- **Severità:** ALTO · **Area:** i18n
- **File:** `lib/validations/auth/registration.ts`, `lib/validations/auth/mfa.ts`, `lib/i18n/translateZodMessage.ts`, 6× `lib/i18n/messages/*.ts`
- **Fatto:** convertiti tutti i messaggi raw a chiavi i18n riusando il set **già tradotto** `errors.validation.*` (allineato ai codici errore backend in `lib/errors/auth-error-codes.ts`); esteso `translateZodMessage` al prefisso `errors.validation.`; aggiunte 7 chiavi nuove ×6 lingue (4 consensi + 3 MFA). `i18n:keys` OK (2280×6), typecheck/lint puliti, 0 hardcoded.
- **⚠️ NOTA — moduli morti:** `registerSchema`/`verifyMFASchema` **non sono importati da nessuna parte** (knip flagga `RegisterValues`/`VerifyMFAValues` unused). Le form ATTIVE erano già localizzate: `verify-mfa/page.tsx` usa `t('mfa.codeLengthError')`/`t('mfa.codeDigitsOnly')`, `components/feature/registrati/account-form.tsx` usa `registerForm.*`. → Nessun bug user-facing reale. **Decisione aperta (vedi A5):** cablare `registerSchema` nel flusso registrati completo (email/paese/telefono/consensi non sono validati dallo schema inline attuale!) **oppure** eliminare i moduli morti. Il completo `registerSchema` valida campi che la form attiva NON valida — probabile scaffolding incompiuto.

---

# 🟠 BLOCCO 1 — SEO / RENDERING (questa settimana, strutturale)

Sequenza: **B3 prima** (sblocca B1 e B2).

## [ ] B3 — Locale leggibile lato server → metadati + `<html lang>` localizzati
- **Severità:** BLOCKER · **Area:** i18n/SEO
- **File:** `app/layout.tsx:18-70,90`, ~58 `export const metadata` statici, `lib/contexts/LanguageContext.tsx`
- **Problema:** la locale vive solo in `localStorage` (client) → non disponibile a SSR; metadati/OG/`lang` sempre italiani.
- **Fix:** Rendere la locale leggibile dal server (cookie o segmento di path) per pilotare `generateMetadata` e `<html lang>`.
- **DoD:** Cambiando lingua, titolo/description/OG e `<html lang>` cambiano nell'HTML server.

## [ ] B1 — Server-render del contenuto pagine di dettaglio inventario
- **Severità:** BLOCKER · **Area:** SEO/Rendering · **Dipende da:** B3
- **File:** `app/aste/[id]/page.tsx`, `app/products/[slug]/page.tsx` (+ `ProductDetailView`), `app/users/[username]/page.tsx`, `SearchResults.tsx`
- **Problema:** corpo `'use client'` → HTML server senza prezzi/descrizioni/venditori/link interni.
- **Fix:** Renderizzare server-side i fatti canonici (nome, set, descrizione, range prezzo, n. venditori, breadcrumb, link interni); idratare solo isole interattive (pannello offerta, carrello, tab).
- **DoD:** `curl` della pagina mostra contenuto core nell'HTML senza JS.

## [ ] B2 — Metadati aste dinamici + sitemap dinamica
- **Severità:** BLOCKER · **Area:** SEO
- **File:** `app/aste/[id]/page.tsx:6` (metadata statico), `app/sitemap.ts`, `app/robots.ts:17`
- **Problema:** metadati aste duplicati (no canonical/OG/JSON-LD); sitemap statica (~17 rotte) esclude prodotti/aste/utenti/set; referenzia `/demo` (disallow).
- **Fix:** `generateMetadata({params})` per le aste (titolo/description/canonical/OG + JSON-LD `Product`/`Offer`, come prodotti); sitemap dinamica dal catalogo; rimuovere `/demo`.
- **DoD:** ogni asta ha titolo/canonical unici; sitemap include URL dinamici; nessun conflitto robots.

---

# 🟠 BLOCCO 2 — COMPLIANCE LEGALE (questa settimana)

## [ ] B4 — Localizzare (o dichiarare lingua di) testi legali ToS/Privacy
- **Severità:** BLOCKER (compliance) · **Area:** i18n/Legale
- **File:** `components/legal/TermsOfServiceContent.tsx` (440 righe), `components/legal/PrivacyPolicyContent.tsx` (450 righe); linkati dai checkbox di consenso in registrazione.
- **Problema:** corpi legali solo in italiano; utenti non italiani accettano termini illeggibili.
- **Fix:** Localizzare i corpi (i18n o MDX-per-locale) **oppure** dichiarare esplicitamente la lingua di governo + avviso lingua visibile. *Richiede decisione legale.*
- **DoD:** Decisione presa e implementata; consenso conforme per utenti non IT.

---

# 🟡 BLOCCO 3 — i18n CONTENUTO & COPERTURA (questa settimana)

## [ ] I1 — Tradurre le frasi inglesi residue in de/fr/es/pt
- **Severità:** MEDIO/ALTO · **File:** `lib/i18n/messages/{de,fr,es,pt}.ts`
- **Chiavi:** `accountPage.bulkPriceScopeQuestion`, `bulkPricePlatformQuestion`, `auctions.createPhotoFromPhoneModalBody`/`PollingHint`/`ModalCloseHint`/`mobilePairingIntro`/`GuestHint`/`GuestSubListing`/`GuestStep2`/`UploadOverlayHint`/`ThanksSubSessionClosed`/`AnotherPhotoQuestion` (~15-20 chiavi).
- **DoD:** Le chiavi non risultano più identiche all'inglese in `i18n:quality`.

## [~] I2 — Esternalizzare stringhe hardcoded user-facing
- **Severità:** MEDIO · **DoD:** `i18n:check` non segnala più i file (esclusi `components/dev/*`).
- **[x] FATTO (2026-06-30):**
  - `DisputeDetailContent.tsx` → **completo** (18 nuove chiavi `disputes.*` ×6 con interpolazione `{id}`/`{who}`; convertito a `useTranslation`; 0 hardcoded residui).
  - `HeroCarousel.tsx` → 3 aria-label (`hero.prevSlide/nextSlide/goToSlide`) ×6 + fix template `Vai allo slide ${n}`→`t('hero.goToSlide',{n})`.
  - `cart/CartLineItem.tsx` → aria-label `Diminuisci/Aumenta quantità` ora usano le chiavi **`cart.decreaseQty`/`cart.increaseQty` già esistenti** in tutte e 6 le lingue (riuso, nessun duplicato).
- **[ ] RIMANENTE (alto volume):** `BrxExpressLandingPage.tsx` (51), `aiuto-content.tsx` (34), `signed-altered-client.tsx` (15), `BrxExpressLanding.tsx` (11), `LandingWelcome.tsx` (9), QR landing `app/c/asta-foto`/`vendi-foto`, ecc. Correggere mojibake ("pi"→"più", accenti) durante lo spostamento.
- **[ ] RIMANDATO — skip-link `app/layout.tsx:117`** ("Vai al contenuto principale"): è un **Server Component** senza locale leggibile server-side → bloccato da **B3**. Da fare insieme a B3.

## [x] I3 — Fix formattazione locale-aware — FATTO (2026-06-30)
- **Severità:** BASSO · **File:** `SyncHistorySection.tsx`, `SyncStatusOverview.tsx`, `ProductPriceChart.tsx` + (trovati extra) `ModernSellerTable.tsx`, `SetPageClient.tsx`
- **Fatto:** sostituito `'it-IT'` hardcoded con `useIntlLocale()` nei 2 componenti sync e in `ModernSellerTable` (prezzi venditori); `ProductPriceChart.formatEuroShort` ora usa `style:'currency'` (no più `' €'` manuale, simbolo corretto per en/de); rimossa funzione `formatEuro` **dead code** in `SetPageClient` (mai chiamata, conteneva `it-IT`). Typecheck/lint puliti.
- **⚠️ Rimandato:** `components/feature/scambi/trade-proposal-ui.tsx:48` `formatTradeEuro(n)` — helper esportato in modulo mock-backed (legato a **B5**); richiede plumbing del locale tra più call site → da fare con il refactor scambi.
- **Nota:** i `?? 'it-IT'` in `app/cart/page.tsx`, `CartDropdown`, `FloatingCartFab`, `TopBar`, `LegalDocShell` sono **fallback legittimi** (come il default di `useIntlLocale`/`formatEur`), lasciati invariati.

## [-] I4 — Eliminare concatenazione i18n `{count} {t(noun)}` — RIMANDATO (motivato)
- **Severità:** BASSO · **File:** `BulkPriceWizardModal.tsx:227`, `OggettiExportModal.tsx:43`, `OggettiPagination.tsx:39`, `AuctionBidHistory.tsx:34`, `CartDropdown.tsx:192` (nota: SetPageClient:296 non è più una concat — riga shiftata dopo rimozione `formatEuro`).
- **Perché rimandato:** per tutte e 6 le lingue supportate (it/en/de/es/fr/pt) l'ordine numero→sostantivo è identico → **la concatenazione rende correttamente oggi**. È rischio latente solo aggiungendo una lingua con ordine diverso (es. RTL/asiatiche, nessuna pianificata). Le chiavi-sostantivo (`accountPage.itemsItemsInView`, `itemsPerPage`, `auctions.detailBidsCount`, `cart.moreItems`) sono riusate standalone altrove → richiederebbe chiavi `*Count` nuove + traduzioni ×6. Costo > beneficio sul set attuale. **Fare solo se si aggiunge una lingua non-europea.**

---

# 🟡 BLOCCO 4 — SICUREZZA (questa settimana, non-blocker)

## [ ] S1 — Rate-limit sul proxy auth + store condiviso
- **File:** `app/api/auth/[...path]/route.ts`, `app/api/marketplace/[...path]/route.ts`, `app/api/_lib/rate-limit.ts`
- **Problema:** login/refresh/MFA senza rate-limit; rate-limit in-memory per-istanza (inutile su Amplify multi-istanza); `getClientIp` si fida del primo `x-forwarded-for`.
- **Fix:** `checkRateLimit` su login/refresh/MFA/password-reset; store condiviso (Upstash/Redis/DynamoDB) o WAF/edge; verificare IP affidabile dalla piattaforma.

## [ ] S2 — Admin reindex via BFF (non chiamare il backend dal browser)
- **File:** `app/admin/reindex/page.tsx:11-35` → usare `app/api/reindex/route.ts`
- **Fix:** puntare la pagina a `/api/reindex` (rate-limit + URL nascosto già pronti).

## [~] S3 — Messaggi errore generici al client + rimuovere IP interno hardcoded
- **[x] Messaggi generici (FATTO 2026-06-30):** `app/api/auth/[...path]/route.ts` (era `err.message` nel `detail`), `app/api/listings/route.ts` (era `err.message`), `app/api/reindex/route.ts` (era hint con porte/firewall/IP + `err.message`). Ora: dettaglio solo in `console.error` server, al client messaggio generico (mantenuta distinzione timeout). Typecheck/lint puliti, bff-security 40/40.
- **[ ] IP hardcoded (RIMANDATO):** `next.config.mjs:113-122` fallback `http://15.160.8.178:8005`. Rendere `BRX_MATCH_API_URL` obbligatorio in prod (fail build) + rimuovere il letterale è cambio di comportamento build → **serve conferma della config env di deploy** prima di flippare warn→fail.

## [ ] S4 — (Validare con backend) allow-list proxy marketplace + `/api/auth/users`
- **File:** `app/api/marketplace/[...path]/route.ts`, `app/api/auth/[...path]/route.ts:24-145`
- **Fix:** confermare che il backend autorizzi per-endpoint; opzionale allow-list sul marketplace; valutare rimozione di `users` dalla allow-list browser-facing.

---

# 🟢 BLOCCO 5 — PERFORMANCE (quick win + strutturale)

## [ ] P1 — Comprimere asset pesanti + stringere budget *(quick win)*
- **File:** `public/footer/*.png` (8.8MB+6.5MB), `landing-giochi-bg/pokemon.png` (5.7MB), `player.mp4` (5.9MB), `giudice.mp4` (4.8MB), `main-table.png` (4.2MB); budget `scripts/check-bundle-budget.mjs:11` (10MB troppo lasco)
- **Fix:** convertire immagini a AVIF/WebP (<300KB); poster + lazy sui video; `BUNDLE_BUDGET_PUBLIC_ASSET_KB` ~1024.

## [x] P2 — Rimuovere font inutilizzati — FATTO (2026-06-30)
- **File:** `public/fonts/SF-Compact-Rounded-{Heavy,Medium,Regular}.ttf` (~5.3MB) — `git rm`. README conferma che solo "Comodo Regular Free" è usato (`globals.css`). Zero riferimenti in codice.

## [ ] P3 — Ridurre componenti client + valutare virtualizzazione *(strutturale)*
- **Problema:** 298/349 componenti `'use client'`; liste non virtualizzate (`SearchResults`, `ModernSellerTable`, `OggettiTable`).
- **Fix:** spingere il confine client verso il basso (overlap B1); virtualizzare le tabelle se pagine > ~50 righe.

## [ ] P4 — Valutare edge-cache per GET pubbliche *(strutturale)*
- **Problema:** tutte le route BFF `no-store`.
- **Fix:** `s-maxage`/`stale-while-revalidate` su GET pubbliche cacheabili (es. `/api/search`).

---

# 🟢 BLOCCO 6 — DESIGN SYSTEM / UI / A11Y (dopo lancio + alcuni urgenti)

## [ ] D1 — Fix contrasto CTA primario (≥4.5:1) *(urgente, a11y)*
- **File:** `components/ui/button.tsx:12` (bianco su `#FF7300` ≈ 2.8:1)
- **Fix:** scurire background (`#CC5C00`/`#E56700`) o foreground più scuro; verificare ≥4.5:1.

## [ ] D2 — Focus-trap su tutte le modali *(urgente, a11y)*
- **Problema:** `useFocusTrap` in 2/31 modali (`hooks/useFocusTrap.ts` esiste).
- **Fix:** applicare `useFocusTrap` a tutte, o introdurre primitiva `Dialog`.

## [ ] D3 — Introdurre primitive condivise (Dialog/Select/Tooltip/Tabs/Label/Badge)
- **Problema:** `components/ui/*` quasi solo icone; modali/select/dropdown reinventati.
- **Fix:** primitive Radix/shadcn; migrazione incrementale (free: focus-trap, Escape, aria-modal, scroll-lock).

## [ ] D4 — Migrare a design token (colori/tipografia/z-index)
- **Problema:** 1489 hex hardcoded (250 file), 2000+ valori arbitrari, nessuna scala `fontSize`, z-index token inutilizzati, conflitto `--primary` navy vs `primary` arancio.
- **Fix:** mappare letterali su token, scala `fontSize` rem, migrare z-index ai token; ESLint `no-restricted-syntax` anti-regressione.

## [ ] D5 — Adottare `Button` come default
- **Problema:** `<button>` raw 660 volte vs `Button` in 23/200 file.
- **Fix:** default `Button`/`buttonVariants`; aggiungere variante `gradient`/`pill` per le CTA auth.

## [ ] D6 — reduced-motion per framer-motion (JS)
- **File:** landing/brx-express/mascotte (214 usi framer-motion)
- **Fix:** `useReducedMotion()` nelle varianti; verificare che `MotionConfig reducedMotion="user"` (providers) copra tutto.

## [ ] D7 — Convertire click-handler su div/span in `<button>`
- **File:** `OggettiTable.tsx`, `SinglesView.tsx` (×2), `ProductDetailQtyPopup.tsx`, `ProductDetailLightbox.tsx`, `AuctionImageLightbox.tsx`, `CardImageActionContent.tsx`, `AssoChatModal.tsx`, `app/account/impostazioni/lingua/page.tsx`

## [ ] D8 — Decidere dark mode (rimuovere o completare)
- **File:** `app/layout.tsx:106-110` (default ON), `tailwind.config.ts:5`, `globals.css:47-67`; solo 13/470 file con `dark:`.

## [ ] D9 — Consolidare Skeleton (ritirare `animate-pulse` ad-hoc)
- **File:** 19 file con `animate-pulse` manuale (`ProductPriceChart` 12, `AsteInCorsoCarousel` 4).

---

# 🟢 BLOCCO 7 — ARCHITETTURA / REFACTOR (dopo lancio)

## [ ] A1 — Decidere destino `components/dev/*` *(può essere urgente per bundle)*
- **File:** `CardMascotte.tsx` (1932), `mascotte-wardrobe-items.ts` (1865), `ScreenshotAnnotator.tsx` (1042), gate `CardMascotteGate.tsx:23` (solo pathname).
- **Fix:** se feature reale → rilocare in `components/feature/mascotte/`; ScreenshotAnnotator/BugReport → gate `NODE_ENV`.

## [ ] A2 — `useBodyScrollLock` con ref-count
- **File:** `SearchResults.tsx:342,356,446,457,465` (5 effect scroll-lock duplicati)

## [ ] A3 — URL come fonte unica di verità (no derived-state-via-effect)
- **File:** `SearchResults.tsx:366-369`

## [ ] A4 — Split monoliti
- `ModernSellerTable.tsx` (1314, 24 prop) → directory-modulo + context/config raggruppata + `seller-table-utils.ts`
- `ScambiProponiModal.tsx` (1365) → `scambi/propose/` + reducer `useTradeProposalState`
- `aiuto-content.tsx` (1516) → data-driven `help-content.ts` + renderer RSC (probabilmente non deve essere client)
- `AcquistiContent.tsx` (860) → hook `useBuyerOrdersAggregate`
- `auth-store.ts` (759) → slice `auth-actions`/`auth-persist`/`session`

## [~] A5 — Pulizia codice morto
- **[x] `: any` → `unknown` (FATTO 2026-06-30):** `lib/errors/useAuthError.ts` (3 occorrenze, tutte input a `parseAuthErrorToCode(error: unknown)`). Zero `: any` residui nel src (escluso dev). Typecheck/lint puliti.
- **[x] dead code (parziale):** rimossa funzione `formatEuro` inutilizzata in `SetPageClient.tsx` (vedi I3).
- **[ ] rimanente:** JSX commentato `SearchResults.tsx:486+`; knip ~40 tipi inutilizzati + 12 export duplicati (`auth-client`, `sync-client`, `config`, `LegalTypography`…) — valutare con attenzione (alcuni tipi potrebbero essere API pubblica intenzionale); moduli morti `registration.ts`/`mfa.ts` (vedi H6: cablare o eliminare).
- **[ ] 5 warning `exhaustive-deps`:** `CardMascotte.tsx:409,701,982`, `AcquistiContent.tsx:271,299`, `ProductCategoryButton.tsx:93`, `useTranslation.ts:14` (richiede analisi caso per caso, rischio runtime).

---

# 🟢 BLOCCO 8 — TEST & QA (dopo lancio, prioritario)

## [ ] T1 — Top 10 test da aggiungere
1. Auth proxy: Set-Cookie su login + clear su logout + Secure in prod + path non-ammessi → 404
2. Marketplace proxy: privato no-cookie → 401; `listings/public/*` → 200; mutazione no-cookie → 401
3. Middleware: prefisso protetto → redirect con `redirect` sanitizzato (guard `//`/`://` a `middleware.ts:62-65`)
4. SSO bridge: no refresh cookie → 401; refresh valido → nuovi cookie
5. Checkout integrazione: add→PaymentConfirm→ordine (BFF mockato)
6. MFA: login con MFA → verify-mfa success/failure
7. Refresh-token race concorrente (estendere `refresh-token.test.ts`)
8. Search route: page/limit/category_ids clamp/reject (boundary)
9. Rate-limit: 429 + `Retry-After` dopo N richieste; reset finestra
10. Render-test prodotto/search/cart (copertura componenti ~zero oggi)

## [ ] T2 — Smoke-test manuali pre-release
- Login → cookie HttpOnly/Secure → `/account` → logout pulisce cookie
- Login MFA completo
- Offerta su asta live (WebSocket) + update
- Checkout completo: cart → PaymentConfirm → ordine in `/ordini`
- Scanner: scan → match → listing (onnx wasm + CSP)
- Ricerca global bar (InstantSearch/Meili) + ricerca filtrata
- CSP runtime in prod build: framer-motion + scanner senza violazioni
- 404/500 render; redirect `/tornei-live`; rewrite `/favicon.ico`
- Header sicurezza presenti in prod (HSTS/CSP/X-Frame-Options)
- Reality-check rate-limit multi-istanza

---

## Mappa rischio regressione (riferimento)
| Area | Rischio | Test |
|---|---|---|
| Proxy auth / Set-Cookie | ALTO | T1.1 |
| Checkout / carrello | ALTO | T1.5 |
| MFA login | ALTO | T1.6 |
| SSO bridge | ALTO | T1.4 |
| Bidding live (WS) | ALTO | smoke + bid-math |
| Scanner pipeline | MEDIO | smoke |
| Middleware redirect | MEDIO | T1.3 |
| Marketplace proxy authz | MEDIO | T1.2 |
| i18n render (chiavi raw) | MEDIO | T1.10 |
| Upload immagini | MEDIO | size/type limit |

## Cose fatte bene (non toccare)
- Confine BFF rispettato (proxy same-origin, no fetch diretto ai microservizi)
- React Query reale (34 hook), AbortController timeout, no-store sui proxy privati
- TS strict pulito (0 `@ts-ignore`)
- Parità chiavi i18n + architettura lazy (en+it eager, de/es/fr/pt dinamiche) + fallback EN sincrono
- error/not-found/global-error localizzati (`global-error` imposta `<html lang>` dinamico)
- Header sicurezza forti (HSTS/X-Frame-Options/CSP scoped/Referrer-Policy), `.env` git-ignored, route debug hard-gated su dev
- Lazy-loading disciplinato delle dipendenze pesanti (onnx in worker, scanner/cropper/webcam/charts/wizard via `next/dynamic`), `lucide-react` tree-shaken
- SW Serwist sicuro (API private NetworkOnly, offline fallback), `next/font` con swap
- `generateMetadata` su prodotti+utenti, JSON-LD breadcrumb prodotti, robots con disallow corretti
- `bff-security.test.ts` solido (401/no-store/timeout)
