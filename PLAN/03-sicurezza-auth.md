# Piano 3 — Sicurezza & Auth

**Obiettivo:** Eliminare le 3 fonti di verità per il token, rinforzare CSP, protezione CSRF.

> 🔎 **Review piano vs codebase (2026-06-23).** Il file era stato eliminato dal
> working tree (recuperato da git history, commit `39f0b54`). Confronto sezione
> per sezione col codice reale: molte azioni del piano sono **wide/behavioral e
> verificabili solo a runtime con backend reale** (auth, SSO, CSP, CSRF), non
> refactor minimali. Applicate **solo le parti sicure e isolate** (3.5-bugfix,
> 3.7, 3.8). Il resto è **rimandato** con motivazione per sezione qui sotto.
> typecheck + lint a 0 errori dopo le modifiche.
>
> **Stato sintetico:**
> - ✅ **3.7** Sanitizzazione CSS dinamico (`app/layout.tsx`) — FATTO.
> - ✅ **3.5 (solo bugfix)** Timeout + AbortController su
>   `app/api/listings/blueprint/[blueprintId]/route.ts` — FATTO.
> - ✅ **3.8** Reindex: rate limit per IP + chiave **solo** in header
>   `X-Admin-API-Key` (rimosso supporto nel body) — FATTO. Nessun chiamante
>   frontend usava il body (verificato con grep).
> - ⛔ **3.1** Rimuovere token da localStorage — **RIMANDATO** (vedi nota).
> - ⛔ **3.2** Cookie `__Host-` prefix — **RIMANDATO/PARZ. ERRATO** (vedi nota).
> - ⛔ **3.3** CSP con nonce — **RIMANDATO** (vedi nota).
> - ⛔ **3.4** Centralizzare `bff-client` — **RIMANDATO** (accoppiato a 3.1).
> - ⛔ **3.5 (refactor `proxy.ts`)** — **RIMANDATO** (ampio, per-route runtime).
> - ⛔ **3.6** CSRF token — **RIMANDATO** (massimo rischio, vedi nota).
> - ⛔ **3.9** Body size limit — **RIMANDATO** (dipende da 3.5 `proxy.ts`).

---

## 3.1 Rimuovere token da `localStorage`

**File coinvolti:**

- `lib/stores/auth-store.ts` (L100-120, L536-580)
- `lib/api/auth-client.ts` (L107-127, L201-249)
- `lib/api/refresh-token.ts` (L69-85)
- 7 client in `lib/api/*-client.ts`
- 5 componenti: `ProductDetailView.tsx:182`, `ScambiProponiModal.tsx:550`, `AuctionCreateCardPicker.tsx:119`, `SincronizzazioneContent.tsx:33`, `OggettiContent.tsx:66`

Azioni:

1. Settare `withCredentials: true` in `auth-client.ts:47`
2. Rimuovere `setStoredToken`/`getStoredToken`/`setStoredRefreshToken`/`getStoredRefreshToken`
3. Rimuovere letture/scritture `localStorage` in `auth-store.ts`
4. Aggiornare 5 componenti per leggere da `useAuthStore((s) => s.accessToken)` o non passare più il token (cookie fa da auth)

**Verifica:** `grep -r "localStorage.getItem.*token\|localStorage.setItem.*token" lib/ components/ app/` deve restituire 0 match.

> ⛔ **RIMANDATO (2026-06-23).** Il piano sottostima molto lo scope. Il token in
> localStorage NON è solo nei file elencati: è persistito anche dal middleware
> Zustand `persist` (`partialize` salva `accessToken` nella chiave `ebartex-auth`)
> e letto in `initializeAuth`/`fetchUser`/`logout`. Soprattutto:
> - Esiste un **bridge SSO** (`/api/auth/bridge`, `auth-store.ts:108-129`) che
>   sincronizza i token da `tornei.ebartex.com` **via localStorage**: rimuoverlo
>   romperebbe la sessione condivisa cross-subdomain.
> - C'è un **refresh proattivo** basato sul `refresh_token` in localStorage.
> - `auth-client.ts:47` ha `withCredentials: false // Disabilita cookies per CORS`:
>   passare a `true` come chiede il piano può **rompere il login** se la CORS del
>   servizio auth (origin diverso) non consente credenziali.
> Non è un refactor minimale: è un cambio di architettura auth da verificare a
> runtime con backend reale + flusso SSO. Va fatto staged, non alla cieca.

---

## 3.2 Cookie `__Host-` prefix + Secure

**File:** `app/api/_lib/forwarded-authorization.ts`

```ts
function getSessionCookieName(): string {
  if (process.env.NODE_ENV === 'production' || process.env.AUTH_COOKIE_USE_HOST_PREFIX === 'true') {
    return '__Host-ebartex_access_token';
  }
  return 'ebartex_access_token';
}
```

In `buildAuthCookie`, enforce `Secure` sempre in production.

> ⛔ **RIMANDATO / PARZ. ERRATO (2026-06-23).**
> - Il prefisso `__Host-` **vieta l'attributo `Domain`**, ma il progetto imposta
>   `AUTH_COOKIE_DOMAIN=.ebartex.com` (`app/api/auth/[...path]/route.ts:52,89`)
>   proprio per condividere il cookie col parent domain (SSO tornei). `__Host-`
>   è **incompatibile** con questo design: lo romperebbe.
> - Il piano modifica solo `forwarded-authorization.ts` (lato lettura), ma il
>   cookie è **scritto** in `auth/[...path]/route.ts` e `auth/bridge/route.ts` e
>   **letto** anche da `middleware.ts` (`appConfig.auth.tokenKey`). Cambiare il
>   nome in un solo punto rompe gli altri.
> - La parte "Secure sempre in production" è **già di fatto presente**:
>   `isSecure` è true in production (`route.ts:181-184`).

---

## 3.3 CSP con nonce

**File:** `next.config.mjs:82-83`, `middleware.ts`

Azioni:

1. In `middleware.ts`, generare nonce per ogni richiesta: `const nonce = Buffer.from(crypto.randomUUID()).toString('base64')`
2. Aggiungere nonce a response header `Content-Security-Policy`
3. In `next.config.mjs`, rimuovere `'unsafe-inline'` e usare `'nonce-${nonce}'`
4. Sostituire `'unsafe-eval'` con `'wasm-unsafe-eval'` (CSP3, supportato da onnxruntime-web)

**Verifica:** Aprire DevTools → Network → verificare assenza `unsafe-inline`/`unsafe-eval` in response header.

> ⛔ **RIMANDATO (2026-06-23).** Rischio runtime alto, esplicitamente segnalato in
> CLAUDE.md ("CSP include unsafe-inline/unsafe-eval: serve a framer-motion e al
> wasm dello scanner. Non rimuoverli senza smoke-test runtime").
> - La CSP **non** è nel `middleware.ts` (che fa solo redirect) ma in
>   `next.config.mjs:78-93`, e gli header sono **saltati in development**
>   (`next.config.mjs:62`): non verificabile senza build di produzione.
> - `app/layout.tsx` ha **due** blocchi inline (`<style>` bg + `<script>` theme,
>   L97-106) con `dangerouslySetInnerHTML` che si romperebbero sotto nonce CSP
>   senza propagazione esplicita del nonce.
> - `style-src 'unsafe-inline'` è usato da framer-motion (stili inline a runtime):
>   i nonce non coprono bene gli stili iniettati via JS.
> Va progettato e testato su build di produzione, non applicato alla cieca.

---

## 3.4 Centralizzare `lib/api/bff-client.ts`

Estrarre factory che produce client con:

- `baseURL: '/api/...'`
- `withCredentials: true`
- timeout
- retry 401
- retry network

I 7 client (`auction-client`, `notifications-client`, `orders-client`, `disputes-client`, `auction-photo-client`, `listing-photo-client`, `marketplace-client`) diventano factory call.

> ⛔ **RIMANDATO (2026-06-23).** `lib/api/bff-client.ts` non esiste: è infra nuova
> + refactor di 9 client (`sync-client` non è nemmeno elencato nel piano). Ogni
> client legge il token da `localStorage.getItem('ebartex_access_token')`, quindi
> è **accoppiato a 3.1** (`withCredentials`/cookie). Va fatto dopo aver deciso la
> strategia auth, con verifica per-client a runtime.

---

## 3.5 Centralizzare `app/api/_lib/proxy.ts`

Estrarre `runProxy()` con:

- Auth check
- Rate limit per scope
- `fetchWithTimeout` con `AbortController` (12s default)
- `noStoreHeaders` per dati privati
- `publicCacheHeaders` per listing pubblici
- Body size limit 25 MB

I 8+ route handler refactor per chiamare `runProxy()`.

**Bug fix incluso:** `/api/listings/blueprint/[blueprintId]` attualmente senza timeout né AbortController.

> ✅ **BUG FIX FATTO (2026-06-23).** Aggiunti `AbortController` + timeout 12s a
> `app/api/listings/blueprint/[blueprintId]/route.ts` (504 su abort, 502 altro).
>
> ⛔ **REFACTOR `proxy.ts` RIMANDATO.** `app/api/_lib/proxy.ts` non esiste;
> esistono già `forwarded-authorization`, `proxy-response`, `rate-limit`.
> Estrarre `runProxy()` e riscrivere 8+ route handler è un refactor ampio e
> comportamentale, da verificare per-route a runtime. Da fare come blocco a sé.

---

## 3.6 CSRF token per mutations

**File:** `app/api/_lib/csrf.ts` (nuovo)

Azioni:

1. Generare `csrf_token` (non-HttpOnly) in `middleware.ts` se non presente
2. Frontend legge `csrf_token` e lo invia in header `X-CSRF-Token` per mutation
3. BFF verifica corrispondenza prima di processare POST/PATCH/DELETE

> ⛔ **RIMANDATO (2026-06-23).** Rischio massimo. Il criterio di accettazione
> ("tutti i POST/PATCH/DELETE → 403 senza X-CSRF-Token valido") richiede di
> aggiornare in modo coordinato `middleware.ts` + ogni client + ogni route di
> mutation; se anche solo uno è disallineato, **ogni mutazione dell'app si
> rompe**. I cookie sono già `SameSite=Lax` (`buildAuthCookie`), che dà una
> protezione CSRF di base. Va progettato come blocco dedicato, con rollout
> graduale (prima warn/log, poi enforce) e test end-to-end, non applicato qui.

---

## 3.7 Sanitizzazione CSS dinamico

**File:** `app/layout.tsx:97-101`

```ts
function getBrxBgCssUrl(): string {
  const cdn = (process.env.NEXT_PUBLIC_CDN_URL || '').replace(/\/+$/, '').replace(/[^a-zA-Z0-9.:/-]/g, '');
  return cdn ? `${cdn}/images/brx_bg.png` : '/brx_bg.png';
}
const cssUrl = getBrxBgCssUrl().replace(/[\\"']/g, '\\$&');
```

> ✅ **FATTO (2026-06-23).** `getBrxBgCssUrl()` ora applica una whitelist di
> caratteri URL e l'iniezione in `<style>` escapa `\ " '`. Nota: la sorgente è
> `NEXT_PUBLIC_CDN_URL` (env di build, non input utente) → rischio reale basso,
> ma l'hardening è gratuito e sicuro.

---

## 3.8 Reindex API key solo in header

**File:** `app/api/reindex/route.ts:17-25`

Rimuovere supporto `apiKey` nel body, solo header `X-Admin-API-Key`.

Aggiungere rate limit su `/api/reindex`.

> ✅ **FATTO (2026-06-23).** Rimosso il supporto `apiKey` nel body (solo header
> `X-Admin-API-Key`) e aggiunto `checkRateLimit` (scope `reindex`, 5 req/min per
> IP) con risposta 429 uniforme. Verificato con grep: nessun chiamante frontend
> passava la chiave nel body.

---

## 3.9 Body size limit su upload

**File:** `app/api/_lib/proxy.ts` (da estrarre nel punto 3.5)

Aggiungere check `content-length` ≤ 25 MB, ritornare 413 se superato.

> ⛔ **RIMANDATO (2026-06-23).** Dipende dall'estrazione di `proxy.ts` (3.5), non
> ancora fatta. Da implementare insieme al refactor del proxy centralizzato.

---

## Criteri di accettazione

- `grep -r "localStorage" lib/api/ lib/stores/auth-store.ts` deve restituire 0 match per token
- Response header `Content-Security-Policy` non contiene `unsafe-inline` o `unsafe-eval`
- Tutti i route handler POST/PATCH/DELETE ritornano 403 senza `X-CSRF-Token` valido
- `npm run lint` e `npm run typecheck` restano a 0 errori
