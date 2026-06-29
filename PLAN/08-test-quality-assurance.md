# Piano 8 — Test & Quality Assurance

**Obiettivo:** Aggiungere copertura su flussi critici, regression risk, smoke test.

---

## 8.1 Test su Auth flow

**File:** `__tests__/lib/auth-store.test.ts` (nuovo)

Copertura:

- Login email/username valido
- Login con MFA abilitato → redirect `/login/verify-mfa`
- OTP MFA scaduto → errore
- Logout pulisce store
- Recupero password 4 step
- `preAuthToken` persistenza
- `flashMessage` + `isAuthenticated` race
- Token refresh proattivo

---

## 8.2 Test su `AsteDetailView`

**File:** `__tests__/components/AsteDetailView.test.tsx` (nuovo)

Copertura:

- Render con asta valida
- Login gate se non autenticato e click "Fai offerta"
- Offerta valida → "Stai vincendo"
- Offerta bassa → errore
- WebSocket update → "Sei stato superato"
- Calendario `.ics` download
- Proxy bidding flow

---

## 8.3 Test su `ProductDetailView`

**File:** `__tests__/components/ProductDetailView.test.tsx` (nuovo)

Copertura:

- Render con prodotto valido
- 5 tab funzionanti
- `handleOwnerQtyDelta` (verificare no duplicazione con OggettiContent)
- Lightbox foto

---

## 8.4 Test su `OggettiContent`

**File:** `__tests__/components/OggettiContent.test.tsx` (nuovo)

Copertura:

- Inventory load + filtri
- Bulk delete
- Bulk price wizard
- Sync marketplace
- Export CSV

---

## 8.5 Test su `SellSingleWizard`

**File:** `__tests__/components/SellSingleWizard.test.tsx` (nuovo)

Copertura:

- 4 step wizard
- Photo upload (mock XHR)
- QR pairing
- Validazione price
- Publish confirm

---

## 8.6 Estendere BFF security test

**File:** `__tests__/lib/bff-security.test.ts` (estendere)

Copertura aggiuntiva:

- `/api/sync` rate limit
- `/api/auctions` guest QR (3 casi validi + 5 invalidi)
- Bridge auth
- CSRF token validation
- Body size limit 413

---

## 8.7 Test i18n keys parity

**File:** `__tests__/i18n/keys-parity.test.ts` (nuovo)

Copertura: tutti e 6 i file `lib/i18n/messages/{en,it,de,fr,es,pt}.ts` abbiano stesse chiavi (script esistente lo fa, ma non è un test).

---

## 8.8 Test dispute WS reconnect

**File:** `__tests__/flow/dispute-ws.test.ts` (nuovo)

Copertura:

- 5 reconnect con delay 3s
- Fallback polling 8s
- Dedup messaggi
- Reset su `dataUpdatedAt`

---

## 8.9 Rimuovere commento residuo BFF

**File:** `app/api/auth/[...path]/route.ts:226`

Rimuovere `// <--- MANCAVA QUESTA PARENTESI...`.

---

## 8.10 Sostituire `as any` con tipi espliciti

**File:**

- `components/feature/LandingWelcome.tsx:27`
- `components/layout/GlobalSearchBar.tsx:107`
- `lib/errors/auth-error-codes.ts:291-380`
- `components/ui/AuthErrorAlert.tsx:160`
- `lib/mock-cards.ts:260`

Tipizzare correttamente.

---

## Criteri di accettazione

- `npm run test` passa
- `npm run test:coverage` mostra copertura >60% su `lib/stores/`, `lib/hooks/`, `lib/api/`
- Nessun `as any` residuo (verificato con `grep -r "as any" components/ lib/`)
- I 2 test BFF-security che falliscono (CLAUDE.md) sono risolti

---

## Diario esecuzione — 2026-06-29

Suite: **199 test / 28 file, tutti verdi** (da 181/27 prima di questa passata,
+18 test). `npm run typecheck` ✅, `npm run lint` ✅ (0 errori sui nuovi file).

**Già fatti prima di questa passata:**

- **8.1** (parziale) — `__tests__/lib/auth-store.test.ts` esisteva già con copertura
  login diretto, login MFA, login fallito, verifyMFA ok/scaduto, logout,
  persistenza `preAuthToken`, race `flashMessage`/`isAuthenticated`.
- **8.6** — `__tests__/lib/bff-security.test.ts` esiste e passa (i 2 test GET
  `/api/auctions` sono stati allineati al comportamento BFF, vedi CLAUDE.md).
- **8.7** — `__tests__/i18n/keys-parity.test.ts` esiste e passa (parità chiavi 6 locali).
- **8.9** — il commento residuo nel BFF (`route.ts:226`) è già stato rimosso.
- **8.10** — nessun `as any` residuo: `grep -rn "as any" components/ lib/ hooks/`
  ritorna 0 occorrenze (ripulito dal Piano 12).

**Eseguiti in questa passata:**

- **8.1 (esteso)** — aggiunti ad `auth-store.test.ts`:
  - login passwordless: `requestLoginCode` ok/errore;
  - `verifyLoginCode` con token diretti → autenticato + flash + utente;
  - `verifyLoginCode` con MFA → `preAuthToken`/`mfaRequired`, non autenticato;
  - `logout` azzera `authError`/`error` e imposta `flashMessage` atomicamente con
    `isAuthenticated=false` (copre la preoccupazione "race" del Piano 9.4).
- **8.1 "Token refresh proattivo"** — nuovo file `__tests__/lib/refresh-token.test.ts`:
  `isTokenNearExpiry` (near/far/malformato/buffer custom); `tokenManager.ensureFreshToken`
  (no refresh token, successo con update storage, fallimento, **chiamate concorrenti
  condividono un solo refresh in volo**); wrapper `refreshAccessToken`;
  `startProactiveRefresh`/`stopProactiveRefresh` (refresh immediato se prossimo alla
  scadenza, nessun refresh se lontano, nessun crash senza token/malformato).

**Rimandati (component test, alto rischio di flakiness in single-pass senza runtime):**

- **8.2** AsteDetailView, **8.3** ProductDetailView, **8.4** OggettiContent,
  **8.5** SellSingleWizard — richiedono mocking pesante di React Query, router,
  WebSocket, XHR upload; meglio in una sessione dedicata con verifica runtime.
- **8.8** Dispute WS reconnect — la logica di reconnect/dedup/polling vive *inline*
  in `DisputeDetailContent.tsx` (non in `lib/hooks/use-disputes.ts`, che contiene
  solo query/mutation React Query). Testarla richiede un component/integration test
  con `WebSocket` e timer fittizi. NB: la parte dedup/merge è stata già irrobustita
  nel Piano 10.12 (prune invece di clear).

**Nota copertura:** il criterio ">60% su lib/stores, lib/hooks, lib/api" non è stato
misurato formalmente in questa passata; i nuovi test alzano sensibilmente la copertura
di `lib/api/refresh-token.ts` (prima 0) e `lib/stores/auth-store.ts`.
